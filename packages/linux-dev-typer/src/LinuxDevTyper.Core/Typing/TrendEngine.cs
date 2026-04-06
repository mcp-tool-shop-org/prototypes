using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Computes rolling performance trends from recent session results.
///
/// Splits results into two windows (recent and previous) and computes
/// deltas to determine whether metrics are improving, stable, or declining.
///
/// Noise filter: trends are only reported as non-Stable when there are
/// at least 5 sessions in the dataset.
/// </summary>
public static class TrendEngine
{
    private const int MinSessionsForCompute = 3;

    /// <summary>
    /// Compute overall trend from all results.
    /// </summary>
    public static TrendSnapshot Compute(IReadOnlyList<Result> results, int windowSize = 10,
                                        PracticeProfile? profile = null)
    {
        return ComputeFromResults(results, windowSize, profile);
    }

    /// <summary>
    /// Compute trend filtered to a specific language.
    /// </summary>
    public static TrendSnapshot ComputeForLanguage(IReadOnlyList<Result> results, string language,
                                                    int windowSize = 10, PracticeProfile? profile = null)
    {
        var filtered = results
            .Where(r => string.Equals(r.Language, language, StringComparison.OrdinalIgnoreCase))
            .ToList();
        return ComputeFromResults(filtered, windowSize, profile);
    }

    /// <summary>
    /// Compute trend filtered to a specific group ID.
    /// </summary>
    public static TrendSnapshot ComputeForGroup(IReadOnlyList<Result> results, string groupId,
                                                 int windowSize = 10, PracticeProfile? profile = null)
    {
        var filtered = results
            .Where(r => r.Metadata != null
                     && string.Equals(r.Metadata.GroupId, groupId, StringComparison.Ordinal))
            .ToList();
        return ComputeFromResults(filtered, windowSize, profile);
    }

    private static TrendSnapshot ComputeFromResults(IReadOnlyList<Result> results, int windowSize,
                                                     PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;

        if (results.Count < MinSessionsForCompute)
        {
            return new TrendSnapshot(
                AvgWpm: 0,
                AvgAccuracy: 0,
                WpmDelta: 0,
                AccuracyDelta: 0,
                WpmTrend: MetricTrend.Stable,
                AccuracyTrend: MetricTrend.Stable,
                SessionCount: results.Count
            );
        }

        // Take the most recent results up to windowSize
        var recent = results
            .Skip(Math.Max(0, results.Count - windowSize))
            .ToList();

        // Previous window: the windowSize results before the recent window
        int prevStart = Math.Max(0, results.Count - windowSize * 2);
        int prevCount = Math.Max(0, results.Count - windowSize) - prevStart;
        var previous = results
            .Skip(prevStart)
            .Take(prevCount)
            .ToList();

        double recentAvgWpm = recent.Average(r => r.Wpm);
        double recentAvgAcc = recent.Average(r => r.Accuracy);

        double wpmDelta = 0;
        double accDelta = 0;

        if (previous.Count > 0)
        {
            double prevAvgWpm = previous.Average(r => r.Wpm);
            double prevAvgAcc = previous.Average(r => r.Accuracy);
            wpmDelta = recentAvgWpm - prevAvgWpm;
            accDelta = recentAvgAcc - prevAvgAcc;
        }

        // Noise filter: only classify trend if we have enough data
        bool enoughData = results.Count >= p.TrendMinSessions;

        var wpmTrend = MetricTrend.Stable;
        var accTrend = MetricTrend.Stable;

        if (enoughData && previous.Count > 0)
        {
            wpmTrend = ClassifyTrend(wpmDelta, p.TrendWpmThreshold);
            accTrend = ClassifyTrend(accDelta, p.TrendAccuracyThreshold);
        }

        return new TrendSnapshot(
            AvgWpm: Math.Round(recentAvgWpm, 1),
            AvgAccuracy: Math.Round(recentAvgAcc, 1),
            WpmDelta: Math.Round(wpmDelta, 1),
            AccuracyDelta: Math.Round(accDelta, 1),
            WpmTrend: wpmTrend,
            AccuracyTrend: accTrend,
            SessionCount: results.Count
        );
    }

    private static MetricTrend ClassifyTrend(double delta, double threshold)
    {
        if (delta > threshold) return MetricTrend.Improving;
        if (delta < -threshold) return MetricTrend.Declining;
        return MetricTrend.Stable;
    }

    /// <summary>
    /// Check for N consecutive declining values in the last results.
    /// Prevents a single bad session from triggering a "declining" narrative.
    /// </summary>
    public static bool HasConsecutiveDecline(IReadOnlyList<Result> results, Func<Result, double> selector, int required = 3)
    {
        if (results.Count < required)
            return false;

        for (int i = results.Count - required + 1; i < results.Count; i++)
        {
            if (selector(results[i]) >= selector(results[i - 1]))
                return false;
        }
        return true;
    }

    /// <summary>
    /// Demote Declining to Stable if there aren't enough consecutive drops.
    /// </summary>
    public static MetricTrend StabilizeDecline(MetricTrend current, IReadOnlyList<Result> results,
        Func<Result, double> selector, int requiredConsecutive = 3)
    {
        if (current != MetricTrend.Declining)
            return current;

        return HasConsecutiveDecline(results, selector, requiredConsecutive) ? MetricTrend.Declining : MetricTrend.Stable;
    }

    private const double PlateauWpmStdDev = 2.0;
    private const double PlateauAccuracyStdDev = 1.0;
    private const int PlateauMinResults = 10;

    /// <summary>
    /// Upgrade Stable to Plateau when recent results show very low variance.
    /// Plateau means consistent performance — not stagnation.
    /// </summary>
    public static MetricTrend ClassifyWithPlateau(MetricTrend current, IReadOnlyList<Result> recentResults,
        Func<Result, double> selector, double stdDevThreshold)
    {
        if (current != MetricTrend.Stable || recentResults.Count < PlateauMinResults)
            return current;

        var values = recentResults
            .Skip(Math.Max(0, recentResults.Count - PlateauMinResults))
            .Select(selector)
            .ToList();

        double mean = values.Average();
        double variance = values.Sum(v => (v - mean) * (v - mean)) / values.Count;
        double stdDev = Math.Sqrt(variance);

        return stdDev < stdDevThreshold ? MetricTrend.Plateau : MetricTrend.Stable;
    }
}
