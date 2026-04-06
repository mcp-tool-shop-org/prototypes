namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Aggregated statistics for a single month of practice.
/// Built from results that roll off the 200-result cap.
/// </summary>
public sealed record MonthSummary(
    int SessionCount,
    double AvgWpm,
    double AvgAccuracy,
    int TotalXp,
    HashSet<string> LanguagesUsed
);
