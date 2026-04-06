using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class RatingEngineTests
{
    [Fact]
    public void PerfectResult_IncreasesRating()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 80, 100, 0, 50, 100);

        int newRating = RatingEngine.Adjust(1200, 3, result);

        Assert.True(newRating > 1200, $"Expected increase, got {newRating}");
    }

    [Fact]
    public void PoorResult_DecreasesRating()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 10, 40, 15, 50, 5);

        int newRating = RatingEngine.Adjust(1200, 3, result);

        Assert.True(newRating < 1200, $"Expected decrease, got {newRating}");
    }

    [Fact]
    public void Rating_NeverBelow100()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 0, 0, 50, 50, 0);

        int newRating = RatingEngine.Adjust(100, 7, result);

        Assert.True(newRating >= 100, $"Rating should not drop below 100, got {newRating}");
    }

    [Fact]
    public void HigherDifficulty_LessExpected_MoreGain()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 60, 95, 1, 50, 80);

        int gainEasy = RatingEngine.Adjust(1200, 1, result) - 1200;
        int gainHard = RatingEngine.Adjust(1200, 5, result) - 1200;

        // Beating a harder snippet should yield more rating gain
        Assert.True(gainHard > gainEasy,
            $"Hard gain ({gainHard}) should exceed easy gain ({gainEasy})");
    }

    [Fact]
    public void CustomProfile_HigherKFactor_BiggerSwings()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 80, 100, 0, 50, 100);
        var profile = new PracticeProfile { RatingKFactor = 64 };

        int defaultDelta = RatingEngine.Adjust(1200, 3, result) - 1200;
        int customDelta = RatingEngine.Adjust(1200, 3, result, profile) - 1200;

        // K=64 should produce bigger rating swings than K=32
        Assert.True(Math.Abs(customDelta) > Math.Abs(defaultDelta),
            $"K=64 delta ({customDelta}) should exceed K=32 delta ({defaultDelta})");
    }

    [Fact]
    public void CustomProfile_DifferentDifficultyScale()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 60, 95, 1, 50, 80);
        // Higher scale = opponents are "harder" = more gain when beating them
        var profile = new PracticeProfile { RatingDifficultyScale = 400 };

        int defaultGain = RatingEngine.Adjust(1200, 5, result) - 1200;
        int customGain = RatingEngine.Adjust(1200, 5, result, profile) - 1200;

        Assert.True(customGain > defaultGain,
            $"Higher scale gain ({customGain}) should exceed default ({defaultGain})");
    }

    [Fact]
    public void NullProfile_MatchesDefault()
    {
        var result = new Result(
            DateTimeOffset.UtcNow, "python", "test", 60, 95, 1, 50, 80);

        int ratingNull = RatingEngine.Adjust(1200, 3, result, null);
        int ratingNoParam = RatingEngine.Adjust(1200, 3, result);
        Assert.Equal(ratingNoParam, ratingNull);
    }
}
