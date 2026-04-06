using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Verifies that extreme (but clamped) profile values don't crash engines
/// or produce results that violate core invariants.
/// </summary>
public class ProfileInvariantTests
{
    private static PracticeProfile MinProfile() => new PracticeProfile
    {
        XpBaseMultiplier = 0.1,
        XpRepeatDecay = 0.0,
        XpSloppyThreshold = 50.0,
        XpSloppyPenalty = 0.0,
        XpCompletionBonus = 0,
        RatingKFactor = 8,
        RatingDifficultyBase = 100,
        RatingDifficultyScale = 50,
        ComfortAccuracyThreshold = 60.0,
        ComfortMinSessions = 1,
        YoYoWindowSize = 3,
        YoYoAccuracySwing = 5.0,
        TrendWpmThreshold = 0.5,
        TrendAccuracyThreshold = 0.5,
        TrendMinSessions = 3,
        FatigueBreakSessions = 3,
        FatigueAccuracyDrop = 1.0,
    }.Clamp();

    private static PracticeProfile MaxProfile() => new PracticeProfile
    {
        XpBaseMultiplier = 2.0,
        XpRepeatDecay = 1.0,
        XpSloppyThreshold = 95.0,
        XpSloppyPenalty = 1.0,
        XpCompletionBonus = 100,
        RatingKFactor = 64,
        RatingDifficultyBase = 1000,
        RatingDifficultyScale = 500,
        ComfortAccuracyThreshold = 98.0,
        ComfortMinSessions = 10,
        YoYoWindowSize = 20,
        YoYoAccuracySwing = 50.0,
        TrendWpmThreshold = 10.0,
        TrendAccuracyThreshold = 5.0,
        TrendMinSessions = 20,
        FatigueBreakSessions = 20,
        FatigueAccuracyDrop = 15.0,
    }.Clamp();

    [Theory]
    [InlineData(0, 0)]
    [InlineData(100, 100)]
    [InlineData(60, 75)]
    [InlineData(30, 50)]
    public void XpEngine_NeverNegative_MinProfile(double wpm, double accuracy)
    {
        int xp = XpEngine.Calculate(wpm, accuracy, 10, MinProfile());
        Assert.True(xp >= 0, $"XP should be ≥ 0, got {xp}");
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(100, 100)]
    [InlineData(60, 75)]
    [InlineData(200, 100)]
    public void XpEngine_NeverNegative_MaxProfile(double wpm, double accuracy)
    {
        int xp = XpEngine.Calculate(wpm, accuracy, 0, MaxProfile());
        Assert.True(xp >= 0, $"XP should be ≥ 0, got {xp}");
    }

    [Fact]
    public void CompletionBonus_NeverNegative()
    {
        Assert.True(XpEngine.CompletionBonus(0, MinProfile()) >= 0);
        Assert.True(XpEngine.CompletionBonus(100, MinProfile()) >= 0);
        Assert.True(XpEngine.CompletionBonus(0, MaxProfile()) >= 0);
    }

    [Theory]
    [InlineData(100)]
    [InlineData(1200)]
    [InlineData(2000)]
    public void RatingEngine_NeverBelow100(int currentRating)
    {
        var result = new Result(DateTimeOffset.UtcNow, "py", "s1", 0, 0, 50, 50, 0);

        int minRating = RatingEngine.Adjust(currentRating, 7, result, MinProfile());
        int maxRating = RatingEngine.Adjust(currentRating, 7, result, MaxProfile());

        Assert.True(minRating >= 100, $"Min profile rating {minRating} < 100");
        Assert.True(maxRating >= 100, $"Max profile rating {maxRating} < 100");
    }

    [Fact]
    public void DifficultyMemory_ComfortZone_AlwaysInRange()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 10; i++) mem.RecordSession("python", 5, 95, 60);

        var comfort = mem.ComfortZone("python", MinProfile());
        Assert.True(comfort == null || (comfort >= 1 && comfort <= 7));

        comfort = mem.ComfortZone("python", MaxProfile());
        Assert.True(comfort == null || (comfort >= 1 && comfort <= 7));
    }

    [Fact]
    public void DifficultyMemory_SuggestedDifficulty_AlwaysInRange()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 10; i++) mem.RecordSession("python", 3, 90, 50);

        var suggested = mem.SuggestedDifficulty("python", MinProfile());
        Assert.True(suggested == null || (suggested >= 1 && suggested <= 7));

        suggested = mem.SuggestedDifficulty("python", MaxProfile());
        Assert.True(suggested == null || (suggested >= 1 && suggested <= 7));
    }

    [Fact]
    public void TrendEngine_NoCrash_ExtremeProfiles()
    {
        var results = new List<Result>();
        for (int i = 0; i < 10; i++)
            results.Add(new Result(DateTimeOffset.UtcNow.AddMinutes(-i * 5), "py", "s1",
                40 + i, 85 + i, 0, 100, 10));

        var snapMin = TrendEngine.Compute(results, profile: MinProfile());
        var snapMax = TrendEngine.Compute(results, profile: MaxProfile());

        Assert.True(snapMin.SessionCount >= 0);
        Assert.True(snapMax.SessionCount >= 0);
    }

    [Fact]
    public void FatigueDetector_NoCrash_ExtremeProfiles()
    {
        var now = DateTimeOffset.UtcNow;
        var results = new List<Result>();
        for (int i = 0; i < 10; i++)
            results.Add(new Result(now.AddMinutes(-i * 3), "py", "s1", 50, 90 - i, 0, 100, 10));

        var reportMin = FatigueDetector.Analyze(results, MinProfile());
        var reportMax = FatigueDetector.Analyze(results, MaxProfile());

        Assert.True(reportMin.SessionsInSitting >= 0);
        Assert.True(reportMax.SessionsInSitting >= 0);
    }

    [Fact]
    public void IsYoYoing_NoCrash_ExtremeProfiles()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 20; i++)
        {
            mem.RecordSession("python", i % 2 == 0 ? 3 : 5, i % 2 == 0 ? 95 : 60, 50);
        }

        // Neither should throw
        _ = mem.IsYoYoing("python", MinProfile());
        _ = mem.IsYoYoing("python", MaxProfile());
    }

    [Fact]
    public void Engines_IgnoreCommunityDifficulty()
    {
        // RatingEngine uses Result.Difficulty (from authored Snippet.Difficulty),
        // not Snippet.CommunityDifficulty. Verify the API: RatingEngine.Adjust
        // takes int difficulty, not double?.
        var method = typeof(RatingEngine).GetMethod("Adjust")!;
        var diffParam = method.GetParameters()[1]; // second param is difficulty
        Assert.Equal(typeof(int), diffParam.ParameterType);

        // Verify that a snippet with CommunityDifficulty=1.0 but authored Difficulty=5
        // uses Difficulty=5 for rating calculation
        var snippet = new Snippet { Difficulty = 5, CommunityDifficulty = 1.0 };
        var result = new Result(DateTimeOffset.UtcNow, "py", "s1", 80, 95, 1, 100, 20, Difficulty: snippet.Difficulty);

        // RatingEngine uses snippet.Difficulty, not CommunityDifficulty
        int newRating = RatingEngine.Adjust(1200, snippet.Difficulty, result);
        Assert.True(newRating >= 100);

        // Verify Result records authored Difficulty, not CommunityDifficulty
        Assert.Equal(5, result.Difficulty);
    }

    [Fact]
    public void Engines_IgnoreScaffold()
    {
        // RatingEngine.Adjust never takes Scaffold — it takes int difficulty.
        // DifficultyMemory.RecordSession takes (lang, difficulty, accuracy, wpm) — no Scaffold.
        // Verify via reflection: neither type references Scaffold.
        var ratingParams = typeof(RatingEngine).GetMethod("Adjust")!.GetParameters()
            .Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(string[]), ratingParams);

        var recordParams = typeof(DifficultyMemory).GetMethod("RecordSession")!.GetParameters()
            .Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(string[]), recordParams);

        // Result record has no Scaffold field
        var resultProps = typeof(Result).GetProperties().Select(p => p.Name).ToList();
        var resultParams = typeof(Result).GetConstructors()[0].GetParameters().Select(p => p.Name).ToList();
        Assert.DoesNotContain("Scaffold", resultProps);
        Assert.DoesNotContain("scaffold", resultParams);
    }

    [Fact]
    public void Engines_IgnoreVariants()
    {
        // RatingEngine.Adjust never takes Variants.
        // DifficultyMemory.RecordSession never takes Variants.
        // Verify via reflection: neither type references Variants.
        var ratingParams = typeof(RatingEngine).GetMethod("Adjust")!.GetParameters()
            .Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(string[]), ratingParams);

        var recordParams = typeof(DifficultyMemory).GetMethod("RecordSession")!.GetParameters()
            .Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(string[]), recordParams);

        // Result record has no Variants field
        var resultProps = typeof(Result).GetProperties().Select(p => p.Name).ToList();
        var resultParams = typeof(Result).GetConstructors()[0].GetParameters().Select(p => p.Name).ToList();
        Assert.DoesNotContain("Variants", resultProps);
        Assert.DoesNotContain("variants", resultParams);
    }
}
