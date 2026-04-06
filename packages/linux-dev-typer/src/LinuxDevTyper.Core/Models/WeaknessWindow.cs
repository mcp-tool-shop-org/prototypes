namespace LinuxDevTyper.Core.Models;

/// <summary>
/// A single mistake event with timestamp, used for rolling decay windows.
/// </summary>
public sealed record MistakeEvent(string Category, DateTimeOffset Timestamp);

/// <summary>
/// Rolling decay window for weakness detection. Recent mistakes are weighted
/// more heavily than older ones, so improving skills naturally reduce weakness
/// scores without explicit "I fixed it" actions.
///
/// Window: last N sessions (default 20). Events older than MaxAgeDays (default 30)
/// are pruned on access. Decay factor: events in the recent half of the window
/// count at full weight; events in the older half count at 0.5× weight.
///
/// Stored in PersistedState alongside MistakeProfile (which remains for
/// cumulative lifetime stats).
/// </summary>
public sealed class WeaknessWindow
{
    /// <summary>Maximum events retained in the window.</summary>
    public int MaxEvents { get; set; } = 500;

    /// <summary>Events older than this are pruned on access.</summary>
    public int MaxAgeDays { get; set; } = 30;

    /// <summary>Rolling list of recent mistake events.</summary>
    public List<MistakeEvent> Events { get; set; } = new();

    /// <summary>
    /// Record mistakes from a completed session. Prunes old events after adding.
    /// </summary>
    public void RecordMistakes(IReadOnlyList<MistakeEvent> newEvents)
    {
        Events.AddRange(newEvents);
        Prune(DateTimeOffset.UtcNow);
    }

    /// <summary>
    /// Returns weakness scores by category, using recency-weighted decay.
    /// Higher score = more recent and frequent mistakes in that category.
    /// </summary>
    public List<(string Category, double Score)> GetWeaknessScores(int topN = 5, DateTimeOffset? now = null)
    {
        var timestamp = now ?? DateTimeOffset.UtcNow;
        Prune(timestamp);

        if (Events.Count == 0)
            return new List<(string, double)>();

        // Find time range of events
        var oldest = Events.Min(e => e.Timestamp);
        var midpoint = oldest + (timestamp - oldest) / 2;

        // Score by category: recent events = 1.0, older events = 0.5
        var scores = new Dictionary<string, double>();
        foreach (var evt in Events)
        {
            double weight = evt.Timestamp >= midpoint ? 1.0 : 0.5;
            scores.TryGetValue(evt.Category, out double current);
            scores[evt.Category] = current + weight;
        }

        // Exclude alphanumeric and whitespace (same as MistakeProfile)
        var exclude = new HashSet<string> { "Alphanumeric", "Whitespace" };

        return scores
            .Where(kv => !exclude.Contains(kv.Key) && kv.Value > 0)
            .OrderByDescending(kv => kv.Value)
            .Take(topN)
            .Select(kv => (kv.Key, kv.Value))
            .ToList();
    }

    /// <summary>
    /// Returns the top N weak categories as a simple list (for integration
    /// with existing SnippetSelector weakness boosting).
    /// </summary>
    public List<string> GetTopWeakCategories(int topN = 3, DateTimeOffset? now = null)
    {
        return GetWeaknessScores(topN, now).Select(w => w.Category).ToList();
    }

    /// <summary>
    /// Checks whether a specific category is currently a weakness (in top N).
    /// </summary>
    public bool IsWeak(string category, int topN = 5, DateTimeOffset? now = null)
    {
        return GetTopWeakCategories(topN, now).Contains(category);
    }

    /// <summary>
    /// Removes events older than MaxAgeDays and trims to MaxEvents.
    /// </summary>
    public void Prune(DateTimeOffset now)
    {
        var cutoff = now.AddDays(-MaxAgeDays);
        Events.RemoveAll(e => e.Timestamp < cutoff);

        if (Events.Count > MaxEvents)
        {
            Events.Sort((a, b) => b.Timestamp.CompareTo(a.Timestamp));
            Events.RemoveRange(MaxEvents, Events.Count - MaxEvents);
        }
    }
}
