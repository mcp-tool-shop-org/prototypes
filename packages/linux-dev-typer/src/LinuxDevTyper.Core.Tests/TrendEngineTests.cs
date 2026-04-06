using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class TrendEngineTests
{
    private static Result MakeResult(double wpm, double accuracy, string language = "python",
                                      string snippetId = "s1", SessionMetadata? metadata = null)
    {
        return new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: language,
            SnippetId: snippetId,
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: 0,
            CharactersTyped: 100,
            XpEarned: 10,
            Metadata: metadata
        );
    }

    [Fact]
    public void EmptyResults_ReturnsStable()
    {
        var snap = TrendEngine.Compute(new List<Result>());
        Assert.Equal(MetricTrend.Stable, snap.WpmTrend);
        Assert.Equal(MetricTrend.Stable, snap.AccuracyTrend);
        Assert.Equal(0, snap.SessionCount);
    }

    [Fact]
    public void TooFewSessions_ReturnsStable()
    {
        var results = new List<Result> { MakeResult(40, 90), MakeResult(42, 91) };
        var snap = TrendEngine.Compute(results);
        Assert.Equal(MetricTrend.Stable, snap.WpmTrend);
        Assert.Equal(2, snap.SessionCount);
    }

    [Fact]
    public void ImprovingWpm_DetectedCorrectly()
    {
        // 5 slow sessions then 5 faster sessions
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(30, 90));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 90));

        var snap = TrendEngine.Compute(results, windowSize: 5);
        Assert.Equal(MetricTrend.Improving, snap.WpmTrend);
        Assert.True(snap.WpmDelta > 0);
    }

    [Fact]
    public void DecliningAccuracy_DetectedCorrectly()
    {
        // 5 accurate sessions then 5 less accurate
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 95));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 88));

        var snap = TrendEngine.Compute(results, windowSize: 5);
        Assert.Equal(MetricTrend.Declining, snap.AccuracyTrend);
        Assert.True(snap.AccuracyDelta < 0);
    }

    [Fact]
    public void StableTrend_SmallDelta()
    {
        // Very small variations — should remain Stable
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 90));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(41, 90.5));

        var snap = TrendEngine.Compute(results, windowSize: 5);
        Assert.Equal(MetricTrend.Stable, snap.WpmTrend);
        Assert.Equal(MetricTrend.Stable, snap.AccuracyTrend);
    }

    [Fact]
    public void LanguageFilter_OnlyMatchingResults()
    {
        var results = new List<Result>
        {
            MakeResult(30, 85, "python"),
            MakeResult(30, 85, "python"),
            MakeResult(30, 85, "python"),
            MakeResult(80, 99, "rust"),
            MakeResult(80, 99, "rust"),
            MakeResult(80, 99, "rust"),
        };

        var pySnap = TrendEngine.ComputeForLanguage(results, "python");
        var rsSnap = TrendEngine.ComputeForLanguage(results, "rust");

        Assert.Equal(3, pySnap.SessionCount);
        Assert.Equal(3, rsSnap.SessionCount);
        Assert.True(rsSnap.AvgWpm > pySnap.AvgWpm);
    }

    [Fact]
    public void NoiseFilter_UnderFiveSessions_AlwaysStable()
    {
        // Even with big delta, < 5 sessions should report Stable
        var results = new List<Result>();
        results.Add(MakeResult(20, 70));
        results.Add(MakeResult(20, 70));
        results.Add(MakeResult(60, 99));

        var snap = TrendEngine.Compute(results, windowSize: 2);
        Assert.Equal(MetricTrend.Stable, snap.WpmTrend);
        Assert.Equal(MetricTrend.Stable, snap.AccuracyTrend);
    }

    [Fact]
    public void WindowBoundary_RecentWindowSized()
    {
        var results = new List<Result>();
        for (int i = 0; i < 20; i++) results.Add(MakeResult(30 + i, 80 + i * 0.5));

        var snap = TrendEngine.Compute(results, windowSize: 5);
        // Recent window is last 5: WPM 45-49, avg ~47
        Assert.True(snap.AvgWpm > 40);
        Assert.Equal(20, snap.SessionCount);
    }

    [Fact]
    public void LowVariance_DetectedAsPlateau()
    {
        // 10 results with very consistent WPM (all 50)
        var results = new List<Result>();
        for (int i = 0; i < 10; i++) results.Add(MakeResult(50, 90));

        var plateau = TrendEngine.ClassifyWithPlateau(MetricTrend.Stable, results, r => r.Wpm, 2.0);
        Assert.Equal(MetricTrend.Plateau, plateau);
    }

    [Fact]
    public void HighVariance_RemainsStable()
    {
        // 10 results with wide WPM spread
        var results = new List<Result>();
        for (int i = 0; i < 10; i++) results.Add(MakeResult(30 + i * 5, 90));

        var plateau = TrendEngine.ClassifyWithPlateau(MetricTrend.Stable, results, r => r.Wpm, 2.0);
        Assert.Equal(MetricTrend.Stable, plateau);
    }

    [Fact]
    public void ThreeConsecutiveDeclines_FlaggedAsDeclining()
    {
        var results = new List<Result>
        {
            MakeResult(50, 90), MakeResult(48, 88), MakeResult(45, 85)
        };

        var stabilized = TrendEngine.StabilizeDecline(MetricTrend.Declining, results, r => r.Accuracy, 3);
        Assert.Equal(MetricTrend.Declining, stabilized);
    }

    [Fact]
    public void NoConsecutiveDeclines_DemotedToStable()
    {
        // Not strictly decreasing — last value goes up
        var results = new List<Result>
        {
            MakeResult(50, 90), MakeResult(48, 88), MakeResult(49, 89)
        };

        var stabilized = TrendEngine.StabilizeDecline(MetricTrend.Declining, results, r => r.Accuracy, 3);
        Assert.Equal(MetricTrend.Stable, stabilized);
    }

    [Fact]
    public void GroupFilter_OnlyMatchingGroupId()
    {
        var results = new List<Result>
        {
            MakeResult(30, 85, metadata: new SessionMetadata(GroupId: "g1")),
            MakeResult(35, 88, metadata: new SessionMetadata(GroupId: "g1")),
            MakeResult(40, 90, metadata: new SessionMetadata(GroupId: "g1")),
            MakeResult(80, 99, metadata: new SessionMetadata(GroupId: "g2")),
        };

        var g1 = TrendEngine.ComputeForGroup(results, "g1");
        Assert.Equal(3, g1.SessionCount);
        Assert.True(g1.AvgWpm < 50);
    }

    [Fact]
    public void CustomProfile_HigherMinSessions_StaysStable()
    {
        // With default minSessions=5, 5 sessions triggers trend detection
        // With custom minSessions=10, 5 sessions stays Stable
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(30, 90));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 90));

        var profile = new PracticeProfile { TrendMinSessions = 15 };

        var defaultSnap = TrendEngine.Compute(results, windowSize: 5);
        var customSnap = TrendEngine.Compute(results, windowSize: 5, profile: profile);

        Assert.Equal(MetricTrend.Improving, defaultSnap.WpmTrend);
        Assert.Equal(MetricTrend.Stable, customSnap.WpmTrend);
    }

    [Fact]
    public void CustomProfile_HigherWpmThreshold_StaysStable()
    {
        // Small WPM improvement: above default threshold (2.0) but below custom (10.0)
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 90));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(45, 90));

        var profile = new PracticeProfile { TrendWpmThreshold = 10.0 };

        var defaultSnap = TrendEngine.Compute(results, windowSize: 5);
        var customSnap = TrendEngine.Compute(results, windowSize: 5, profile: profile);

        Assert.Equal(MetricTrend.Improving, defaultSnap.WpmTrend);
        Assert.Equal(MetricTrend.Stable, customSnap.WpmTrend);
    }

    [Fact]
    public void NullProfile_MatchesDefault()
    {
        var results = new List<Result>();
        for (int i = 0; i < 5; i++) results.Add(MakeResult(30, 90));
        for (int i = 0; i < 5; i++) results.Add(MakeResult(40, 90));

        var snapNull = TrendEngine.Compute(results, windowSize: 5, profile: null);
        var snapNoParam = TrendEngine.Compute(results, windowSize: 5);

        Assert.Equal(snapNoParam.WpmTrend, snapNull.WpmTrend);
        Assert.Equal(snapNoParam.AccuracyTrend, snapNull.AccuracyTrend);
        Assert.Equal(snapNoParam.WpmDelta, snapNull.WpmDelta);
    }
}
