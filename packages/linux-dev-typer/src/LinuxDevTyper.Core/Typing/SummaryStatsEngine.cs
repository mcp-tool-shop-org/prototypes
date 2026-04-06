using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Computes aggregate summary statistics from session history.
/// Pure static engine — no state.
/// </summary>
public static class SummaryStatsEngine
{
    /// <summary>
    /// Compute summary statistics from a list of results.
    /// Optionally filter by language.
    /// </summary>
    public static SummaryStats Compute(IReadOnlyList<Result> results, string? language = null)
    {
        var filtered = language != null
            ? results.Where(r => string.Equals(r.Language, language, StringComparison.OrdinalIgnoreCase)).ToList()
            : results.ToList();

        if (filtered.Count == 0)
            return SummaryStats.Empty;

        double avgWpm = filtered.Average(r => r.Wpm);
        double avgAccuracy = filtered.Average(r => r.Accuracy);
        double bestWpm = filtered.Max(r => r.Wpm);
        double bestAccuracy = filtered.Max(r => r.Accuracy);
        int totalXp = filtered.Sum(r => r.XpEarned);
        int totalChars = filtered.Sum(r => r.CharactersTyped);

        var first = filtered.Min(r => r.Timestamp);
        var last = filtered.Max(r => r.Timestamp);
        var timespan = last - first;

        var byLanguage = filtered
            .GroupBy(r => r.Language, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        return new SummaryStats(
            TotalSessions: filtered.Count,
            AvgWpm: avgWpm,
            AvgAccuracy: avgAccuracy,
            BestWpm: bestWpm,
            BestAccuracy: bestAccuracy,
            TotalXpEarned: totalXp,
            TotalCharactersTyped: totalChars,
            FirstToLast: timespan,
            SessionsByLanguage: byLanguage
        );
    }
}

/// <summary>
/// Aggregate summary statistics from session history.
/// </summary>
public sealed record SummaryStats(
    int TotalSessions,
    double AvgWpm,
    double AvgAccuracy,
    double BestWpm,
    double BestAccuracy,
    int TotalXpEarned,
    int TotalCharactersTyped,
    TimeSpan FirstToLast,
    Dictionary<string, int> SessionsByLanguage
)
{
    public static readonly SummaryStats Empty = new(
        0, 0, 0, 0, 0, 0, 0, TimeSpan.Zero, new Dictionary<string, int>());
}
