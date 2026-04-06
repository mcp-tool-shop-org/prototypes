using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class WelcomeBackDetectorTests
{
    private static Result MakeResult(DateTimeOffset timestamp)
    {
        return new Result(
            Timestamp: timestamp,
            Language: "python",
            SnippetId: "s1",
            Wpm: 40,
            Accuracy: 90,
            Errors: 1,
            CharactersTyped: 100,
            XpEarned: 10
        );
    }

    [Fact]
    public void NoResults_NotReturning()
    {
        var report = WelcomeBackDetector.Analyze(new List<Result>(), DateTimeOffset.UtcNow);

        Assert.False(report.IsReturning);
        Assert.Null(report.Message);
    }

    [Fact]
    public void RecentSession_NotReturning()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddHours(-2)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.False(report.IsReturning);
        Assert.Null(report.Message);
    }

    [Fact]
    public void DayGap_ReturningWithGreeting()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddDays(-2)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.True(report.IsReturning);
        Assert.Contains("Good to see you", report.Message!);
    }

    [Fact]
    public void ExactlyOneDayGap_IsReturning()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddHours(-24)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.True(report.IsReturning);
        Assert.Contains("Good to see you", report.Message!);
    }

    [Fact]
    public void WeekGap_ReturningWithLongAbsenceMessage()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddDays(-10)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.True(report.IsReturning);
        Assert.Contains("Welcome back", report.Message!);
        Assert.Contains("10 days", report.Message!);
    }

    [Fact]
    public void ThirtyDayGap_ReturningWithLongAbsenceMessage()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddDays(-35)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.True(report.IsReturning);
        Assert.Contains("been away a while", report.Message!);
        Assert.Contains("still here", report.Message!);
    }

    [Fact]
    public void ThirtyDayGap_IncludesLastSessionRecap()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddDays(-35)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.NotNull(report.LastSession);
        Assert.Equal("python", report.LastSession!.Language);
        Assert.Equal(40, report.LastSession.Wpm);
    }

    [Fact]
    public void WeekGap_HasRecap()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddDays(-10)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.NotNull(report.LastSession);
        Assert.Equal("python", report.LastSession!.Language);
    }

    [Fact]
    public void ShortGap_NoRecap()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result> { MakeResult(now.AddHours(-2)) };

        var report = WelcomeBackDetector.Analyze(results, now);

        Assert.Null(report.LastSession);
    }
}
