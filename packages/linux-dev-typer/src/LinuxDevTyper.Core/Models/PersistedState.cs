using LinuxDevTyper.Core.Mistakes;

namespace LinuxDevTyper.Core.Models;

public sealed class PersistedState
{
    public const int CurrentSchemaVersion = 12;
    public const int MaxRecentResults = 200;

    public int SchemaVersion { get; set; } = CurrentSchemaVersion;
    public Profile Profile { get; set; } = new();
    public AppSettings Settings { get; set; } = new();
    public List<Result> RecentResults { get; set; } = new();
    public MistakeProfile MistakeProfile { get; set; } = new();
    public WeaknessWindow WeaknessWindow { get; set; } = new();
    public DifficultyMemory DifficultyMemory { get; set; } = new();
    public PersonalDefaults PersonalDefaults { get; set; } = new();

    /// <summary>
    /// Monthly summaries of sessions that have rolled off the RecentResults cap.
    /// Key: "yyyy-MM" (e.g., "2026-01"). Value: aggregated stats for that month.
    /// </summary>
    public Dictionary<string, MonthSummary> SessionSummaryByMonth { get; set; } = new();

    /// <summary>
    /// Named practice profiles with tuning overrides for engine constants.
    /// Key: profile name. "Default" is never stored — it's the hardcoded baseline.
    /// </summary>
    public Dictionary<string, PracticeProfile> PracticeProfiles { get; set; } = new();

    /// <summary>
    /// Registry of user-authored snippet packs discovered in the packs directory.
    /// Tracks enabled/disabled state per pack.
    /// </summary>
    public List<PackMetadata> PackRegistry { get; set; } = new();

    /// <summary>
    /// Per-character hit/miss tracking for fine-grained weakness detection.
    /// Coexists with MistakeProfile (category-level). Both are populated independently.
    /// </summary>
    public MistakeHeatmap MistakeHeatmap { get; set; } = new();

    /// <summary>
    /// Periodic snapshots of weakness state for tracking improvement over time.
    /// Captured at most once per day per language by WeaknessTracker.MaybeSnapshot().
    /// Capped at 90 entries (~3 months of daily snapshots).
    /// </summary>
    public List<WeaknessSnapshot> WeaknessSnapshots { get; set; } = new();

    public void AddResult(Result result)
    {
        RecentResults.Add(result);
        while (RecentResults.Count > MaxRecentResults)
        {
            var oldest = RecentResults[0];
            SummarizeIntoMonth(oldest);
            RecentResults.RemoveAt(0);
        }
    }

    private void SummarizeIntoMonth(Result result)
    {
        string key = result.Timestamp.ToString("yyyy-MM");
        if (SessionSummaryByMonth.TryGetValue(key, out var existing))
        {
            int newCount = existing.SessionCount + 1;
            double newAvgWpm = ((existing.AvgWpm * existing.SessionCount) + result.Wpm) / newCount;
            double newAvgAcc = ((existing.AvgAccuracy * existing.SessionCount) + result.Accuracy) / newCount;
            int newXp = existing.TotalXp + result.XpEarned;
            var langs = new HashSet<string>(existing.LanguagesUsed, StringComparer.OrdinalIgnoreCase);
            langs.Add(result.Language);
            SessionSummaryByMonth[key] = new MonthSummary(newCount, Math.Round(newAvgWpm, 1),
                Math.Round(newAvgAcc, 1), newXp, langs);
        }
        else
        {
            SessionSummaryByMonth[key] = new MonthSummary(
                1, Math.Round(result.Wpm, 1), Math.Round(result.Accuracy, 1),
                result.XpEarned,
                new HashSet<string>(StringComparer.OrdinalIgnoreCase) { result.Language });
        }
    }
}
