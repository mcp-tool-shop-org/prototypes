using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Result of fatigue analysis for a sitting (group of consecutive sessions).
/// Single-level: either suggest a break or don't. No escalation, no judgment.
/// </summary>
public sealed record FatigueReport(
    bool SuggestBreak,
    string? Suggestion,
    int SessionsInSitting
);

/// <summary>
/// Detects when the player might benefit from a break based on session count
/// or accuracy drop within a sitting. Uses 30-minute gap detection for sitting boundaries.
///
/// Single threshold, single message. No escalation levels.
/// </summary>
public static class FatigueDetector
{
    private static readonly TimeSpan SittingGap = TimeSpan.FromMinutes(30);

    /// <summary>
    /// Analyze recent results to detect fatigue within the current sitting.
    /// When profile is null, uses default constants (matching v0.5.0 behavior).
    /// </summary>
    public static FatigueReport Analyze(IReadOnlyList<Result> allResults,
                                         PracticeProfile? profile = null)
    {
        if (allResults == null || allResults.Count == 0)
            return new FatigueReport(false, null, 0);

        var p = profile ?? PracticeProfile.Default;

        // Extract current sitting: sessions with no gap > 30 min between them
        var sitting = ExtractCurrentSitting(allResults);
        if (sitting.Count < 2)
            return new FatigueReport(false, null, sitting.Count);

        // Compute peak accuracy from first half of sitting
        int peakWindow = Math.Max(1, sitting.Count / 2);
        double peakAccuracy = sitting.Take(peakWindow).Max(r => r.Accuracy);

        // Current performance: last 3 sessions (or fewer)
        int recentWindow = Math.Min(3, sitting.Count);
        var recentResults = sitting.TakeLast(recentWindow).ToList();
        double recentAccuracy = recentResults.Average(r => r.Accuracy);

        double accuracyDrop = peakAccuracy - recentAccuracy;

        // Single threshold: suggest break on session count or accuracy drop
        if (sitting.Count >= p.FatigueBreakSessions || accuracyDrop >= p.FatigueAccuracyDrop)
        {
            return new FatigueReport(
                true,
                "You've been practicing for a while.",
                sitting.Count
            );
        }

        return new FatigueReport(false, null, sitting.Count);
    }

    /// <summary>
    /// Extract sessions belonging to the current sitting (no gap > 30 min).
    /// Results must be in chronological order.
    /// </summary>
    internal static List<Result> ExtractCurrentSitting(IReadOnlyList<Result> results)
    {
        if (results.Count == 0) return new List<Result>();

        var sitting = new List<Result> { results[^1] };

        // Walk backward from the end, adding sessions that are within the gap
        for (int i = results.Count - 2; i >= 0; i--)
        {
            var gap = results[i + 1].Timestamp - results[i].Timestamp;
            if (gap <= SittingGap)
                sitting.Insert(0, results[i]);
            else
                break;
        }

        return sitting;
    }
}
