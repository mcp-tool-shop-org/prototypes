using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class PracticeProfileTests
{
    [Fact]
    public void Default_MatchesHardcodedXpConstants()
    {
        var p = PracticeProfile.Default;
        Assert.Equal(0.8, p.XpBaseMultiplier);
        Assert.Equal(0.3, p.XpRepeatDecay);
        Assert.Equal(70.0, p.XpSloppyThreshold);
        Assert.Equal(0.5, p.XpSloppyPenalty);
        Assert.Equal(25, p.XpCompletionBonus);
    }

    [Fact]
    public void Default_MatchesHardcodedRatingConstants()
    {
        var p = PracticeProfile.Default;
        Assert.Equal(32, p.RatingKFactor);
        Assert.Equal(400, p.RatingDifficultyBase);
        Assert.Equal(200, p.RatingDifficultyScale);
    }

    [Fact]
    public void Default_MatchesHardcodedDifficultyConstants()
    {
        var p = PracticeProfile.Default;
        Assert.Equal(85.0, p.ComfortAccuracyThreshold);
        Assert.Equal(3, p.ComfortMinSessions);
        Assert.Equal(6, p.YoYoWindowSize);
        Assert.Equal(20.0, p.YoYoAccuracySwing);
    }

    [Fact]
    public void Default_MatchesHardcodedTrendConstants()
    {
        var p = PracticeProfile.Default;
        Assert.Equal(2.0, p.TrendWpmThreshold);
        Assert.Equal(1.0, p.TrendAccuracyThreshold);
        Assert.Equal(5, p.TrendMinSessions);
    }

    [Fact]
    public void Default_MatchesHardcodedFatigueConstants()
    {
        var p = PracticeProfile.Default;
        Assert.Equal(5, p.FatigueBreakSessions);
        Assert.Equal(3.0, p.FatigueAccuracyDrop);
    }

    [Fact]
    public void Clamp_ClampsExtremeValues()
    {
        var p = new PracticeProfile
        {
            XpBaseMultiplier = 999.0,
            XpSloppyThreshold = 1.0,
            RatingKFactor = 1000,
            ComfortAccuracyThreshold = 0.0,
            FatigueBreakSessions = 1,
        };

        p.Clamp();

        Assert.Equal(2.0, p.XpBaseMultiplier);
        Assert.Equal(50.0, p.XpSloppyThreshold);
        Assert.Equal(64, p.RatingKFactor);
        Assert.Equal(60.0, p.ComfortAccuracyThreshold);
        Assert.Equal(3, p.FatigueBreakSessions);
    }

    [Fact]
    public void Clamp_PreservesValidValues()
    {
        var p = new PracticeProfile
        {
            XpBaseMultiplier = 1.0,
            XpSloppyThreshold = 80.0,
            RatingKFactor = 48,
            ComfortAccuracyThreshold = 90.0,
            FatigueBreakSessions = 8,
        };

        p.Clamp();

        Assert.Equal(1.0, p.XpBaseMultiplier);
        Assert.Equal(80.0, p.XpSloppyThreshold);
        Assert.Equal(48, p.RatingKFactor);
        Assert.Equal(90.0, p.ComfortAccuracyThreshold);
        Assert.Equal(8, p.FatigueBreakSessions);
    }

    [Fact]
    public void Diff_DetectsChanges()
    {
        var baseline = PracticeProfile.Default;
        var custom = new PracticeProfile
        {
            XpBaseMultiplier = 1.2,
            FatigueBreakSessions = 10,
        };

        var diffs = custom.Diff(baseline);

        Assert.Equal(2, diffs.Count);
        Assert.Contains(diffs, d => d.Field == "XP Multiplier");
        Assert.Contains(diffs, d => d.Field == "Fatigue Sessions");
    }

    [Fact]
    public void Diff_EmptyWhenIdentical()
    {
        var a = PracticeProfile.Default;
        var b = PracticeProfile.Default;

        var diffs = a.Diff(b);

        Assert.Empty(diffs);
    }

    [Fact]
    public void Default_NameIsDefault()
    {
        Assert.Equal("Default", PracticeProfile.Default.Name);
    }

    [Fact]
    public void Default_IsCachedSingleton()
    {
        var a = PracticeProfile.Default;
        var b = PracticeProfile.Default;
        Assert.Same(a, b);
    }

    [Fact]
    public void Clamp_ClampsLowEndValues()
    {
        var p = new PracticeProfile
        {
            XpRepeatDecay = -5.0,
            XpSloppyPenalty = -1.0,
            XpCompletionBonus = -50,
            RatingDifficultyBase = 0,
            RatingDifficultyScale = 0,
            ComfortMinSessions = 0,
            YoYoWindowSize = 0,
            YoYoAccuracySwing = -10.0,
            TrendWpmThreshold = -1.0,
            TrendAccuracyThreshold = -1.0,
            TrendMinSessions = 0,
            FatigueAccuracyDrop = -5.0,
        };

        p.Clamp();

        Assert.Equal(0.0, p.XpRepeatDecay);
        Assert.Equal(0.0, p.XpSloppyPenalty);
        Assert.Equal(0, p.XpCompletionBonus);
        Assert.Equal(100, p.RatingDifficultyBase);
        Assert.Equal(50, p.RatingDifficultyScale);
        Assert.Equal(1, p.ComfortMinSessions);
        Assert.Equal(3, p.YoYoWindowSize);
        Assert.Equal(5.0, p.YoYoAccuracySwing);
        Assert.Equal(0.5, p.TrendWpmThreshold);
        Assert.Equal(0.5, p.TrendAccuracyThreshold);
        Assert.Equal(3, p.TrendMinSessions);
        Assert.Equal(1.0, p.FatigueAccuracyDrop);
    }

    [Fact]
    public void Clamp_ClampsHighEndValues()
    {
        var p = new PracticeProfile
        {
            XpRepeatDecay = 5.0,
            XpSloppyPenalty = 5.0,
            XpCompletionBonus = 500,
            RatingDifficultyBase = 5000,
            RatingDifficultyScale = 5000,
            ComfortMinSessions = 100,
            YoYoWindowSize = 100,
            YoYoAccuracySwing = 200.0,
            TrendWpmThreshold = 100.0,
            TrendAccuracyThreshold = 100.0,
            TrendMinSessions = 100,
            FatigueAccuracyDrop = 100.0,
        };

        p.Clamp();

        Assert.Equal(1.0, p.XpRepeatDecay);
        Assert.Equal(1.0, p.XpSloppyPenalty);
        Assert.Equal(100, p.XpCompletionBonus);
        Assert.Equal(1000, p.RatingDifficultyBase);
        Assert.Equal(500, p.RatingDifficultyScale);
        Assert.Equal(10, p.ComfortMinSessions);
        Assert.Equal(20, p.YoYoWindowSize);
        Assert.Equal(50.0, p.YoYoAccuracySwing);
        Assert.Equal(10.0, p.TrendWpmThreshold);
        Assert.Equal(5.0, p.TrendAccuracyThreshold);
        Assert.Equal(20, p.TrendMinSessions);
        Assert.Equal(15.0, p.FatigueAccuracyDrop);
    }

    [Fact]
    public void Clamp_ReturnsSameInstance()
    {
        var p = new PracticeProfile { XpBaseMultiplier = 999.0 };
        var result = p.Clamp();
        Assert.Same(p, result);
    }

    [Fact]
    public void Diff_AllFieldsDiffer()
    {
        var a = new PracticeProfile
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
        };

        var diffs = a.Diff(PracticeProfile.Default);

        // All 17 tunable fields differ
        Assert.Equal(17, diffs.Count);
    }
}
