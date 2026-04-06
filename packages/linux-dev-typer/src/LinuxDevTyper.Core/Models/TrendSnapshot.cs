namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Direction of a performance metric over time.
/// </summary>
public enum MetricTrend { Improving, Stable, Declining, Plateau }

/// <summary>
/// Immutable snapshot of rolling performance trends computed from recent results.
/// </summary>
public sealed record TrendSnapshot(
    double AvgWpm,
    double AvgAccuracy,
    double WpmDelta,
    double AccuracyDelta,
    MetricTrend WpmTrend,
    MetricTrend AccuracyTrend,
    int SessionCount
);
