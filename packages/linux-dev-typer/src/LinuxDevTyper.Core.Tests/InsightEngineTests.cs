using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class InsightEngineTests
{
    private static Result MakeResult(double wpm = 40, double accuracy = 90, string language = "python",
                                      int difficulty = 3, SessionMetadata? metadata = null)
    {
        return new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: language,
            SnippetId: "s1",
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: 0,
            CharactersTyped: 100,
            XpEarned: 10,
            Difficulty: difficulty,
            Metadata: metadata
        );
    }

    [Fact]
    public void PerfectAccuracy_ShowsMilestone()
    {
        var result = MakeResult(accuracy: 100);
        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("zero mistakes"));
    }

    [Fact]
    public void PersonalBest_Detected()
    {
        var prev = new List<Result> { MakeResult(wpm: 30), MakeResult(wpm: 35) };
        var current = MakeResult(wpm: 50);
        prev.Add(current);

        var insights = InsightEngine.Generate(current, null, null, "python", prev);
        Assert.Contains(insights, i => i.Text.Contains("personal best"));
    }

    [Fact]
    public void ImprovingTrend_ShowsInsight()
    {
        var trend = new TrendSnapshot(45, 92, 5, 1, MetricTrend.Improving, MetricTrend.Stable, 10);
        var result = MakeResult();

        var insights = InsightEngine.Generate(result, trend, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("trending up"));
    }

    [Fact]
    public void DecliningAccuracy_ShowsInsight()
    {
        var trend = new TrendSnapshot(45, 85, 0, -3, MetricTrend.Stable, MetricTrend.Declining, 10);
        var result = MakeResult();

        var insights = InsightEngine.Generate(result, trend, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("shifted"));
    }

    [Fact]
    public void ComfortZoneNudge_ShowsWhenReady()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 3, 90, 50);

        var result = MakeResult(difficulty: 3);
        var insights = InsightEngine.Generate(result, null, mem, "python");
        Assert.Contains(insights, i => i.Text.Contains("Ready to try 4"));
    }

    [Fact]
    public void RepeatMastery_ShowsOnThirdRepeat()
    {
        var meta = new SessionMetadata(RepeatNumber: 3);
        var result = MakeResult(metadata: meta);

        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("repeated"));
    }

    [Fact]
    public void FirstSession_ShowsWelcome()
    {
        var current = MakeResult(language: "rust");
        var allResults = new List<Result> { current };

        var insights = InsightEngine.Generate(current, null, null, "rust", allResults);
        Assert.Contains(insights, i => i.Text.Contains("Welcome to rust"));
    }

    [Fact]
    public void SloppyRun_ShowsWarning()
    {
        var result = MakeResult(accuracy: 55);
        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("Rough session"));
    }

    [Fact]
    public void MaxTwoInsights()
    {
        // Perfect accuracy + personal best → should cap at 2
        var prev = new List<Result> { MakeResult(wpm: 30) };
        var current = MakeResult(wpm: 50, accuracy: 100);
        prev.Add(current);

        var insights = InsightEngine.Generate(current, null, null, "python", prev);
        Assert.True(insights.Count <= 2, $"Expected at most 2 insights, got {insights.Count}");
    }

    [Fact]
    public void NullInputs_NoCrash()
    {
        var result = MakeResult();
        var insights = InsightEngine.Generate(result, null, null, "python", null);
        Assert.NotNull(insights);
    }

    [Fact]
    public void DrillIntent_AccuracyUp_ShowsInsight()
    {
        var meta = new SessionMetadata(Intent: PracticeIntent.Drill);
        var result = MakeResult(accuracy: 95, metadata: meta);

        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("Drill paid off"));
    }

    [Fact]
    public void WarmupIntent_FirstSession_ShowsInsight()
    {
        var meta = new SessionMetadata(Intent: PracticeIntent.Warmup);
        var current = MakeResult(language: "go", metadata: meta);
        var allResults = new List<Result> { current };

        var insights = InsightEngine.Generate(current, null, null, "go", allResults);
        Assert.Contains(insights, i => i.Text.Contains("Good warmup"));
    }

    [Fact]
    public void NoIntent_NoIntentInsight()
    {
        var meta = new SessionMetadata(Intent: PracticeIntent.None);
        var result = MakeResult(accuracy: 95, metadata: meta);

        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.DoesNotContain(insights, i => i.Text.Contains("Drill paid off"));
        Assert.DoesNotContain(insights, i => i.Text.Contains("Good warmup"));
        Assert.DoesNotContain(insights, i => i.Text.Contains("Challenge accepted"));
    }

    [Fact]
    public void ChallengeIntent_LowAccuracy_ShowsInsight()
    {
        var meta = new SessionMetadata(Intent: PracticeIntent.Challenge);
        var result = MakeResult(accuracy: 65, metadata: meta);

        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("Challenge accepted"));
    }

    [Fact]
    public void DrillIntent_LowAccuracy_NoInsight()
    {
        var meta = new SessionMetadata(Intent: PracticeIntent.Drill);
        var result = MakeResult(accuracy: 75, metadata: meta);

        var insights = InsightEngine.Generate(result, null, null, "python");
        Assert.DoesNotContain(insights, i => i.Text.Contains("Drill paid off"));
    }

    [Fact]
    public void PlateauReassurance_ShowsAfter15Sessions()
    {
        var trend = new TrendSnapshot(50, 90, 0, 0, MetricTrend.Plateau, MetricTrend.Stable, 15);
        var result = MakeResult();

        var insights = InsightEngine.Generate(result, trend, null, "python");
        Assert.Contains(insights, i => i.Text.Contains("consistency is mastery"));
    }

    [Fact]
    public void PlateauReassurance_NotBelow15Sessions()
    {
        var trend = new TrendSnapshot(50, 90, 0, 0, MetricTrend.Plateau, MetricTrend.Stable, 10);
        var result = MakeResult();

        var insights = InsightEngine.Generate(result, trend, null, "python");
        Assert.DoesNotContain(insights, i => i.Text.Contains("consistency is mastery"));
    }

    [Fact]
    public void PerformanceCuesOff_SuppressesDeclining()
    {
        var trend = new TrendSnapshot(45, 85, 0, -3, MetricTrend.Stable, MetricTrend.Declining, 10);
        var result = MakeResult(accuracy: 55);

        var insights = InsightEngine.Generate(result, trend, null, "python", showPerformanceCues: false);
        Assert.DoesNotContain(insights, i => i.Type == InsightEngine.DecliningTrend);
        Assert.DoesNotContain(insights, i => i.Type == InsightEngine.SloppyRun);
    }

    [Fact]
    public void PerformanceCuesOn_StillShowsDeclining()
    {
        var trend = new TrendSnapshot(45, 85, 0, -3, MetricTrend.Stable, MetricTrend.Declining, 10);
        var result = MakeResult(accuracy: 55);

        var insights = InsightEngine.Generate(result, trend, null, "python", showPerformanceCues: true);
        Assert.Contains(insights, i => i.Type == InsightEngine.DecliningTrend);
    }

    [Fact]
    public void DismissedType_SkipsInsight()
    {
        var result = MakeResult(accuracy: 100);
        var dismissed = new HashSet<string> { InsightEngine.AccuracyMilestone };

        var insights = InsightEngine.Generate(result, null, null, "python", dismissedTypes: dismissed);
        Assert.DoesNotContain(insights, i => i.Type == InsightEngine.AccuracyMilestone);
    }

    [Fact]
    public void NonDismissedType_StillAppears()
    {
        var result = MakeResult(accuracy: 100);
        var dismissed = new HashSet<string> { InsightEngine.PersonalBest };

        var insights = InsightEngine.Generate(result, null, null, "python", dismissedTypes: dismissed);
        Assert.Contains(insights, i => i.Type == InsightEngine.AccuracyMilestone);
    }
}
