using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class SummaryStatsEngineTests
{
    private static Result MakeResult(string language = "python", double wpm = 40, double accuracy = 90,
                                      int xp = 10, int chars = 100, DateTimeOffset? timestamp = null)
    {
        return new Result(
            Timestamp: timestamp ?? DateTimeOffset.UtcNow,
            Language: language,
            SnippetId: "s1",
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: 1,
            CharactersTyped: chars,
            XpEarned: xp
        );
    }

    [Fact]
    public void EmptyResults_ReturnsEmpty()
    {
        var stats = SummaryStatsEngine.Compute(new List<Result>());

        Assert.Equal(0, stats.TotalSessions);
        Assert.Equal(0, stats.AvgWpm);
    }

    [Fact]
    public void MultipleResults_ComputesCorrectly()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            MakeResult("python", 40, 90, 10, 100, now.AddHours(-2)),
            MakeResult("python", 60, 95, 20, 150, now.AddHours(-1)),
            MakeResult("rust", 30, 85, 8, 80, now)
        };

        var stats = SummaryStatsEngine.Compute(results);

        Assert.Equal(3, stats.TotalSessions);
        Assert.InRange(stats.AvgWpm, 43, 44); // (40+60+30)/3 = 43.33
        Assert.Equal(60, stats.BestWpm);
        Assert.Equal(95, stats.BestAccuracy);
        Assert.Equal(38, stats.TotalXpEarned); // 10+20+8
        Assert.Equal(330, stats.TotalCharactersTyped); // 100+150+80
        Assert.Equal(2, stats.SessionsByLanguage.Count);
        Assert.Equal(2, stats.SessionsByLanguage["python"]);
        Assert.Equal(1, stats.SessionsByLanguage["rust"]);
    }

    [Fact]
    public void SingleResult_ComputesCorrectly()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>
        {
            MakeResult("python", 55, 92, 15, 120, now)
        };

        var stats = SummaryStatsEngine.Compute(results);

        Assert.Equal(1, stats.TotalSessions);
        Assert.Equal(55, stats.AvgWpm);
        Assert.Equal(55, stats.BestWpm);
        Assert.Equal(92, stats.BestAccuracy);
        Assert.Equal(15, stats.TotalXpEarned);
        Assert.Equal(120, stats.TotalCharactersTyped);
        Assert.Single(stats.SessionsByLanguage);
    }

    [Fact]
    public void LanguageFilter_NoMatch_ReturnsEmpty()
    {
        var results = new List<Result>
        {
            MakeResult("python", 40, 90),
            MakeResult("rust", 50, 85)
        };

        var stats = SummaryStatsEngine.Compute(results, "go");

        Assert.Equal(0, stats.TotalSessions);
        Assert.Equal(0, stats.AvgWpm);
    }

    [Fact]
    public void LanguageFilter_OnlyIncludesMatching()
    {
        var results = new List<Result>
        {
            MakeResult("python", 40, 90),
            MakeResult("python", 60, 95),
            MakeResult("rust", 30, 85)
        };

        var stats = SummaryStatsEngine.Compute(results, "python");

        Assert.Equal(2, stats.TotalSessions);
        Assert.Equal(50, stats.AvgWpm); // (40+60)/2
        Assert.Single(stats.SessionsByLanguage);
    }
}
