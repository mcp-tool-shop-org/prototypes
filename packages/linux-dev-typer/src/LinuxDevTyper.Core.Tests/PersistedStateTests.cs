using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class PersistedStateTests
{
    private static Result MakeResult(string language = "python", double wpm = 40, double accuracy = 90,
                                      int xp = 10, DateTimeOffset? timestamp = null)
    {
        return new Result(
            Timestamp: timestamp ?? DateTimeOffset.UtcNow,
            Language: language,
            SnippetId: "s1",
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: 1,
            CharactersTyped: 100,
            XpEarned: xp
        );
    }

    [Fact]
    public void AddResult_UnderCap_NoSummary()
    {
        var state = new PersistedState();
        for (int i = 0; i < 10; i++)
            state.AddResult(MakeResult());

        Assert.Equal(10, state.RecentResults.Count);
        Assert.Empty(state.SessionSummaryByMonth);
    }

    [Fact]
    public void AddResult_OverCap_SummarizesOldest()
    {
        var state = new PersistedState();
        var jan = new DateTimeOffset(2026, 1, 15, 12, 0, 0, TimeSpan.Zero);

        // Fill to cap with January results
        for (int i = 0; i < 200; i++)
            state.AddResult(MakeResult(timestamp: jan.AddMinutes(i)));

        Assert.Equal(200, state.RecentResults.Count);
        Assert.Empty(state.SessionSummaryByMonth);

        // One more pushes the oldest into a summary
        state.AddResult(MakeResult(timestamp: jan.AddMinutes(201)));

        Assert.Equal(200, state.RecentResults.Count);
        Assert.Single(state.SessionSummaryByMonth);
        Assert.True(state.SessionSummaryByMonth.ContainsKey("2026-01"));
        Assert.Equal(1, state.SessionSummaryByMonth["2026-01"].SessionCount);
    }

    [Fact]
    public void AddResult_MultipleOverCap_AggregatesCorrectly()
    {
        var state = new PersistedState();
        var jan = new DateTimeOffset(2026, 1, 15, 12, 0, 0, TimeSpan.Zero);

        // Fill to cap
        for (int i = 0; i < 200; i++)
            state.AddResult(MakeResult(wpm: 40, accuracy: 90, xp: 10, timestamp: jan.AddMinutes(i)));

        // Push 3 more — causes 3 to roll off
        for (int i = 0; i < 3; i++)
            state.AddResult(MakeResult(wpm: 60, accuracy: 95, xp: 20, timestamp: jan.AddMinutes(201 + i)));

        Assert.Equal(200, state.RecentResults.Count);
        var summary = state.SessionSummaryByMonth["2026-01"];
        Assert.Equal(3, summary.SessionCount);
        Assert.Equal(40, summary.AvgWpm); // All rolled-off had wpm=40
        Assert.Equal(90, summary.AvgAccuracy);
        Assert.Equal(30, summary.TotalXp); // 3 * 10
    }

    [Fact]
    public void MonthSummary_TracksLanguagesUsed()
    {
        var state = new PersistedState();
        var jan = new DateTimeOffset(2026, 1, 15, 12, 0, 0, TimeSpan.Zero);

        // Fill with python
        for (int i = 0; i < 100; i++)
            state.AddResult(MakeResult("python", timestamp: jan.AddMinutes(i)));
        // Fill with rust
        for (int i = 0; i < 100; i++)
            state.AddResult(MakeResult("rust", timestamp: jan.AddMinutes(100 + i)));

        // Push 2 more — one python and one rust roll off
        state.AddResult(MakeResult("go", timestamp: jan.AddMinutes(201)));
        state.AddResult(MakeResult("go", timestamp: jan.AddMinutes(202)));

        var summary = state.SessionSummaryByMonth["2026-01"];
        Assert.Equal(2, summary.SessionCount);
        Assert.Contains("python", summary.LanguagesUsed);
        // Second rolled-off result is python too (first 100 are python)
    }
}
