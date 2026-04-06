using LinuxDevTyper.Core.Mistakes;

namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Cross-session aggregation of mistake data. Stored in PersistedState.
/// CategoryErrors uses string keys (enum ToString) for readable JSON serialization.
/// </summary>
public sealed class MistakeProfile
{
    /// <summary>Cumulative error count per symbol category.</summary>
    public Dictionary<string, int> CategoryErrors { get; set; } = new();

    /// <summary>Total characters typed across all sessions (for computing error rates).</summary>
    public int TotalCharactersTyped { get; set; }

    /// <summary>Whether adaptive snippet selection based on weakness data is enabled.</summary>
    public bool AdaptiveEnabled { get; set; } = true;

    /// <summary>
    /// Accumulate mistake data from a completed session.
    /// </summary>
    public void RecordSession(IReadOnlyList<MistakeRecord> mistakes, int charsTyped)
    {
        TotalCharactersTyped += charsTyped;
        foreach (var m in mistakes)
        {
            var catName = SymbolClassifier.Classify(m.Expected).ToString();
            CategoryErrors.TryGetValue(catName, out int current);
            CategoryErrors[catName] = current + 1;
        }
    }

    /// <summary>
    /// Returns ranked weakness list: symbol categories with highest error counts.
    /// Excludes Alphanumeric and Whitespace.
    /// </summary>
    public List<(string Category, int ErrorCount)> GetWeaknesses(int topN = 5)
    {
        var exclude = new HashSet<string>
        {
            nameof(SymbolCategoryKind.Alphanumeric),
            nameof(SymbolCategoryKind.Whitespace)
        };

        return CategoryErrors
            .Where(kv => !exclude.Contains(kv.Key) && kv.Value > 0)
            .OrderByDescending(kv => kv.Value)
            .Take(topN)
            .Select(kv => (kv.Key, kv.Value))
            .ToList();
    }
}
