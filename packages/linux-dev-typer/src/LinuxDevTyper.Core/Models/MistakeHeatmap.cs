using System.Text.Json.Serialization;
using LinuxDevTyper.Core.Mistakes;

namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Tracks per-character mistake frequency for identifying weaknesses.
/// Replaces the binary WeakChars HashSet with frequency-weighted data.
/// Coexists with <see cref="MistakeProfile"/> (both are populated independently).
/// </summary>
public sealed class MistakeHeatmap
{
    /// <summary>
    /// Per-character mistake tracking. Key = the expected character.
    /// </summary>
    [JsonInclude]
    public Dictionary<char, HeatmapEntry> Records { get; set; } = new();

    /// <summary>
    /// Default rolling window size. Only the most recent N attempts per character
    /// are considered when computing recent error rates. Prevents ancient mistakes
    /// from dominating current weakness assessment.
    /// </summary>
    public const int DefaultWindowSize = 50;

    /// <summary>
    /// Records a correctly typed character.
    /// </summary>
    public void RecordHit(char expected)
    {
        var entry = GetOrCreate(expected);
        entry.Hits++;
        entry.PushRecent(true);
    }

    /// <summary>
    /// Records an incorrectly typed character.
    /// </summary>
    public void RecordMiss(char expected, char? actual)
    {
        var entry = GetOrCreate(expected);
        entry.Misses++;
        entry.LastMissedAt = DateTime.UtcNow;
        entry.PushRecent(false);

        // Track what was typed instead (confusion pairs)
        if (actual.HasValue)
        {
            entry.ConfusedWith.TryGetValue(actual.Value, out int count);
            entry.ConfusedWith[actual.Value] = count + 1;
        }
    }

    /// <summary>
    /// Gets the all-time error rate for a specific character (0.0 = perfect, 1.0 = always wrong).
    /// </summary>
    public double GetErrorRate(char c)
    {
        if (!Records.TryGetValue(c, out var record)) return 0;
        int total = record.Hits + record.Misses;
        return total > 0 ? (double)record.Misses / total : 0;
    }

    /// <summary>
    /// Gets the recent error rate considering only the last <paramref name="windowSize"/> attempts.
    /// Falls back to all-time rate if fewer recent attempts are tracked.
    /// </summary>
    public double GetRecentErrorRate(char c, int windowSize = DefaultWindowSize)
    {
        if (!Records.TryGetValue(c, out var entry)) return 0;
        if (entry.RecentAttempts.Count == 0) return GetErrorRate(c);

        var window = entry.RecentAttempts.Count <= windowSize
            ? entry.RecentAttempts
            : entry.RecentAttempts.Skip(entry.RecentAttempts.Count - windowSize).ToList();

        if (window.Count == 0) return 0;
        int misses = window.Count(hit => !hit);
        return (double)misses / window.Count;
    }

    /// <summary>
    /// Gets the top N weakest characters by error rate.
    /// </summary>
    public List<CharWeakness> GetWeakest(int count = 10, int minAttempts = 5)
    {
        return Records
            .Where(kvp => kvp.Value.Hits + kvp.Value.Misses >= minAttempts)
            .Select(kvp => new CharWeakness
            {
                Character = kvp.Key,
                ErrorRate = GetErrorRate(kvp.Key),
                TotalAttempts = kvp.Value.Hits + kvp.Value.Misses,
                TotalMisses = kvp.Value.Misses,
                Category = SymbolClassifier.Classify(kvp.Key),
                TopConfusion = kvp.Value.ConfusedWith
                    .OrderByDescending(c => c.Value)
                    .Select(c => c.Key)
                    .FirstOrDefault()
            })
            .Where(w => w.ErrorRate > 0)
            .OrderByDescending(w => w.ErrorRate)
            .Take(count)
            .ToList();
    }

    /// <summary>
    /// Gets aggregated error rates by symbol category.
    /// </summary>
    public List<CategoryWeakness> GetWeakestCategories(int minAttempts = 10)
    {
        return Records
            .GroupBy(kvp => SymbolClassifier.Classify(kvp.Key))
            .Where(g => g.Key != SymbolCategoryKind.Alphanumeric) // Letters/digits are usually fine
            .Select(g =>
            {
                int totalHits = g.Sum(kvp => kvp.Value.Hits);
                int totalMisses = g.Sum(kvp => kvp.Value.Misses);
                int total = totalHits + totalMisses;
                return new CategoryWeakness
                {
                    Category = g.Key,
                    ErrorRate = total > 0 ? (double)totalMisses / total : 0,
                    TotalAttempts = total,
                    TotalMisses = totalMisses,
                    Characters = g.Select(kvp => kvp.Key).ToList()
                };
            })
            .Where(g => g.TotalAttempts >= minAttempts && g.ErrorRate > 0)
            .OrderByDescending(g => g.ErrorRate)
            .ToList();
    }

    /// <summary>
    /// Maximum number of distinct characters tracked.
    /// When exceeded, least-attempted characters are pruned.
    /// </summary>
    public const int MaxTrackedChars = 200;

    /// <summary>
    /// Maximum confusion pairs per character.
    /// When exceeded, least-frequent pairs are pruned.
    /// </summary>
    public const int MaxConfusionPairs = 20;

    /// <summary>
    /// Prunes the heatmap to stay within storage limits.
    /// Removes least-attempted characters beyond MaxTrackedChars.
    /// Trims confusion pairs per character beyond MaxConfusionPairs.
    /// Deterministic: same data → same pruning result.
    /// </summary>
    public void Prune()
    {
        // Prune confusion pairs per character
        foreach (var entry in Records.Values)
        {
            if (entry.ConfusedWith.Count > MaxConfusionPairs)
            {
                var topPairs = entry.ConfusedWith
                    .OrderByDescending(kvp => kvp.Value)
                    .ThenBy(kvp => kvp.Key) // deterministic tie-break
                    .Take(MaxConfusionPairs)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
                entry.ConfusedWith = topPairs;
            }
        }

        // Prune tracked characters
        if (Records.Count > MaxTrackedChars)
        {
            var toKeep = Records
                .OrderByDescending(kvp => kvp.Value.Hits + kvp.Value.Misses)
                .ThenBy(kvp => kvp.Key) // deterministic tie-break
                .Take(MaxTrackedChars)
                .Select(kvp => kvp.Key)
                .ToHashSet();

            var toRemove = Records.Keys.Where(k => !toKeep.Contains(k)).ToList();
            foreach (var key in toRemove)
                Records.Remove(key);
        }
    }

    /// <summary>
    /// Gets a flat set of weak characters for backward compatibility with snippet selection.
    /// Characters with error rate above <paramref name="threshold"/> and at least
    /// <paramref name="minAttempts"/> attempts qualify.
    /// </summary>
    public HashSet<char> GetWeakCharSet(double threshold = 0.15, int minAttempts = 5)
    {
        var result = new HashSet<char>();
        foreach (var kvp in Records)
        {
            int total = kvp.Value.Hits + kvp.Value.Misses;
            if (total >= minAttempts)
            {
                double errorRate = (double)kvp.Value.Misses / total;
                if (errorRate >= threshold)
                    result.Add(kvp.Key);
            }
        }
        return result;
    }

    private HeatmapEntry GetOrCreate(char c)
    {
        if (!Records.TryGetValue(c, out var record))
        {
            record = new HeatmapEntry();
            Records[c] = record;
        }
        return record;
    }
}

/// <summary>
/// Tracks hit/miss frequency for a single character inside <see cref="MistakeHeatmap"/>.
/// Named HeatmapEntry to avoid collision with the existing <see cref="MistakeRecord"/> record type.
/// </summary>
public sealed class HeatmapEntry
{
    /// <summary>Number of times this character was typed correctly.</summary>
    [JsonInclude]
    public int Hits { get; set; }

    /// <summary>Number of times this character was typed incorrectly.</summary>
    [JsonInclude]
    public int Misses { get; set; }

    /// <summary>When this character was last missed (UTC).</summary>
    [JsonInclude]
    public DateTime? LastMissedAt { get; set; }

    /// <summary>
    /// What the user typed instead (confusion pairs).
    /// Key = the incorrect char typed, Value = how many times.
    /// </summary>
    [JsonInclude]
    public Dictionary<char, int> ConfusedWith { get; set; } = new();

    /// <summary>
    /// Rolling window of recent attempts. true = hit, false = miss.
    /// Capped at <see cref="MistakeHeatmap.DefaultWindowSize"/> * 2 entries.
    /// Used to compute recent error rates that don't include ancient history.
    /// </summary>
    [JsonInclude]
    public List<bool> RecentAttempts { get; set; } = new();

    /// <summary>
    /// Pushes a hit/miss into the rolling window, capping at max capacity.
    /// </summary>
    internal void PushRecent(bool hit)
    {
        RecentAttempts.Add(hit);
        int cap = MistakeHeatmap.DefaultWindowSize * 2;
        if (RecentAttempts.Count > cap)
        {
            RecentAttempts.RemoveAt(0);
        }
    }
}

/// <summary>
/// Weakness info for a single character.
/// </summary>
public sealed class CharWeakness
{
    [JsonInclude]
    public char Character { get; set; }

    [JsonInclude]
    public double ErrorRate { get; set; }

    [JsonInclude]
    public int TotalAttempts { get; set; }

    [JsonInclude]
    public int TotalMisses { get; set; }

    [JsonInclude]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public SymbolCategoryKind Category { get; set; }

    [JsonInclude]
    public char TopConfusion { get; set; }
}

/// <summary>
/// Weakness info for a group of characters (e.g., all brackets).
/// </summary>
public sealed class CategoryWeakness
{
    [JsonInclude]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public SymbolCategoryKind Category { get; set; }

    [JsonInclude]
    public double ErrorRate { get; set; }

    [JsonInclude]
    public int TotalAttempts { get; set; }

    [JsonInclude]
    public int TotalMisses { get; set; }

    [JsonInclude]
    public List<char> Characters { get; set; } = new();
}
