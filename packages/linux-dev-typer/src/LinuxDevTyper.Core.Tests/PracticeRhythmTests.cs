using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class PracticeRhythmTests
{
    private static Result MakeResult(int hour) =>
        new(new DateTimeOffset(2026, 1, 15, hour, 0, 0, TimeSpan.Zero),
            "python", "s1", 50, 90, 0, 100, 10);

    [Fact]
    public void DominantBracket_DetectedAt70Percent()
    {
        // 8 morning sessions + 2 evening = 80% morning
        var results = new List<Result>();
        for (int i = 0; i < 8; i++) results.Add(MakeResult(9));
        for (int i = 0; i < 2; i++) results.Add(MakeResult(20));

        var rhythm = new PracticeRhythm();
        rhythm.LearnFromResults(results);

        Assert.Equal(TimeBracket.Morning, rhythm.DominantBracket);
    }

    [Fact]
    public void NoDominant_WhenMixed()
    {
        // 4 morning + 3 afternoon + 3 evening = no bracket ≥ 70%
        var results = new List<Result>();
        for (int i = 0; i < 4; i++) results.Add(MakeResult(9));
        for (int i = 0; i < 3; i++) results.Add(MakeResult(14));
        for (int i = 0; i < 3; i++) results.Add(MakeResult(20));

        var rhythm = new PracticeRhythm();
        rhythm.LearnFromResults(results);

        Assert.Null(rhythm.DominantBracket);
    }

    [Fact]
    public void SkipsWithLessThan5Sessions()
    {
        var results = new List<Result>();
        for (int i = 0; i < 4; i++) results.Add(MakeResult(9));

        var rhythm = new PracticeRhythm();
        rhythm.LearnFromResults(results);

        Assert.Null(rhythm.DominantBracket);
        Assert.Empty(rhythm.BracketCounts);
    }
}
