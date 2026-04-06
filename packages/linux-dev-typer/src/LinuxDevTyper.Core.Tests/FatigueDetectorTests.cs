using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class FatigueDetectorTests
{
    private static Result MakeResult(DateTimeOffset timestamp, double accuracy = 90, double wpm = 50)
    {
        return new Result(
            Timestamp: timestamp,
            Language: "python",
            SnippetId: "s1",
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: 0,
            CharactersTyped: 100,
            XpEarned: 10,
            Difficulty: 3
        );
    }

    [Fact]
    public void EmptyResults_NoBreak()
    {
        var report = FatigueDetector.Analyze(new List<Result>());
        Assert.False(report.SuggestBreak);
        Assert.Null(report.Suggestion);
    }

    [Fact]
    public void SingleSession_NoBreak()
    {
        var results = new List<Result> { MakeResult(DateTimeOffset.UtcNow) };
        var report = FatigueDetector.Analyze(results);
        Assert.False(report.SuggestBreak);
        Assert.Equal(1, report.SessionsInSitting);
    }

    [Fact]
    public void FewSessions_StableAccuracy_NoBreak()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            MakeResult(now.AddMinutes(-10), accuracy: 92),
            MakeResult(now.AddMinutes(-7), accuracy: 91),
            MakeResult(now.AddMinutes(-4), accuracy: 93),
            MakeResult(now, accuracy: 91),
        };

        var report = FatigueDetector.Analyze(results);
        Assert.False(report.SuggestBreak);
        Assert.Equal(4, report.SessionsInSitting);
    }

    [Fact]
    public void FiveSessions_SuggestsBreak()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>();
        for (int i = 0; i < 5; i++)
            results.Add(MakeResult(now.AddMinutes(-20 + i * 4), accuracy: 92));

        var report = FatigueDetector.Analyze(results);
        Assert.True(report.SuggestBreak);
        Assert.NotNull(report.Suggestion);
        Assert.Contains("practicing", report.Suggestion);
    }

    [Fact]
    public void AccuracyDrop_SuggestsBreak()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            MakeResult(now.AddMinutes(-12), accuracy: 95),
            MakeResult(now.AddMinutes(-9), accuracy: 94),
            MakeResult(now.AddMinutes(-6), accuracy: 91),
            MakeResult(now, accuracy: 91),
        };

        var report = FatigueDetector.Analyze(results);
        // Peak = 95, recent avg ~ 91 → drop = 4% ≥ 3% → suggest break
        Assert.True(report.SuggestBreak);
    }

    [Fact]
    public void SittingBoundary_BreaksOnGap()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            // Old sitting (>30 min gap)
            MakeResult(now.AddHours(-2), accuracy: 60),
            MakeResult(now.AddHours(-1.5), accuracy: 55),
            // Current sitting
            MakeResult(now.AddMinutes(-10), accuracy: 92),
            MakeResult(now.AddMinutes(-6), accuracy: 93),
            MakeResult(now, accuracy: 91),
        };

        var report = FatigueDetector.Analyze(results);
        // Only 3 sessions in current sitting
        Assert.Equal(3, report.SessionsInSitting);
        Assert.False(report.SuggestBreak);
    }

    [Fact]
    public void FourSessions_StableAccuracy_NoBreak()
    {
        // 4 sessions (just below threshold) with no accuracy drop
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>();
        for (int i = 0; i < 4; i++)
            results.Add(MakeResult(now.AddMinutes(-16 + i * 4), accuracy: 91));

        var report = FatigueDetector.Analyze(results);
        Assert.False(report.SuggestBreak);
        Assert.Equal(4, report.SessionsInSitting);
    }

    [Fact]
    public void NullResults_NoBreak()
    {
        var report = FatigueDetector.Analyze(null!);
        Assert.False(report.SuggestBreak);
    }

    [Fact]
    public void CustomProfile_HigherBreakThreshold_NoBreak()
    {
        // Default: 5 sessions triggers break. Custom: 10 sessions threshold.
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>();
        for (int i = 0; i < 5; i++)
            results.Add(MakeResult(now.AddMinutes(-20 + i * 4), accuracy: 92));

        var profile = new PracticeProfile { FatigueBreakSessions = 10 };

        var defaultReport = FatigueDetector.Analyze(results);
        var customReport = FatigueDetector.Analyze(results, profile);

        Assert.True(defaultReport.SuggestBreak);
        Assert.False(customReport.SuggestBreak);
    }

    [Fact]
    public void CustomProfile_HigherAccuracyDropThreshold_NoBreak()
    {
        // Accuracy drops 4% — above default (3%) but below custom (8%)
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            MakeResult(now.AddMinutes(-12), accuracy: 95),
            MakeResult(now.AddMinutes(-9), accuracy: 94),
            MakeResult(now.AddMinutes(-6), accuracy: 91),
            MakeResult(now, accuracy: 91),
        };

        var profile = new PracticeProfile { FatigueAccuracyDrop = 8.0 };

        var defaultReport = FatigueDetector.Analyze(results);
        var customReport = FatigueDetector.Analyze(results, profile);

        Assert.True(defaultReport.SuggestBreak);
        Assert.False(customReport.SuggestBreak);
    }

    [Fact]
    public void NullProfile_MatchesDefault()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>();
        for (int i = 0; i < 5; i++)
            results.Add(MakeResult(now.AddMinutes(-20 + i * 4), accuracy: 92));

        var reportNull = FatigueDetector.Analyze(results, null);
        var reportNoParam = FatigueDetector.Analyze(results);

        Assert.Equal(reportNoParam.SuggestBreak, reportNull.SuggestBreak);
        Assert.Equal(reportNoParam.SessionsInSitting, reportNull.SessionsInSitting);
    }
}
