using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class XpEngineTests
{
    [Fact]
    public void Calculate_FirstPlay_NoReduction()
    {
        // 60 WPM, 100% accuracy, first play
        int xp = XpEngine.Calculate(60, 100.0, 0);

        // base = (60 * 1.0) * 0.8 = 48, repeat=1.0, sloppy=1.0
        Assert.Equal(48, xp);
    }

    [Fact]
    public void Calculate_RepeatedSnippet_Diminishes()
    {
        int xpFirst = XpEngine.Calculate(60, 100.0, 0);
        int xpThird = XpEngine.Calculate(60, 100.0, 3);

        Assert.True(xpThird < xpFirst, $"XP should diminish with repeats: first={xpFirst}, third={xpThird}");
    }

    [Fact]
    public void Calculate_SloppyPenalty_Below70()
    {
        int xpClean = XpEngine.Calculate(60, 80.0, 0);
        int xpSloppy = XpEngine.Calculate(60, 60.0, 0);

        // 60% accuracy triggers 0.5 penalty
        // xpClean = round((60*0.80)*0.8) = round(38.4) = 38
        // xpSloppy = round((60*0.60)*0.8*0.5) = round(14.4) = 14
        Assert.Equal(38, xpClean);
        Assert.Equal(14, xpSloppy);
    }

    [Fact]
    public void CompletionBonus_DiminishesWithRepeats()
    {
        int bonusFirst = XpEngine.CompletionBonus(0);
        int bonusRepeat = XpEngine.CompletionBonus(5);

        Assert.Equal(25, bonusFirst);
        Assert.True(bonusRepeat < bonusFirst, $"Bonus should diminish: first={bonusFirst}, repeat5={bonusRepeat}");
    }

    [Fact]
    public void CountRecentPlays_CountsMatchingSnippetId()
    {
        var results = new List<Result>
        {
            new(DateTimeOffset.UtcNow, "py", "snip-A", 60, 100, 0, 10, 48),
            new(DateTimeOffset.UtcNow, "py", "snip-B", 55, 90, 1, 10, 30),
            new(DateTimeOffset.UtcNow, "py", "snip-A", 62, 100, 0, 10, 48),
            new(DateTimeOffset.UtcNow, "py", "snip-C", 70, 95, 0, 10, 40),
            new(DateTimeOffset.UtcNow, "py", "snip-A", 58, 100, 0, 10, 46),
        };

        int count = XpEngine.CountRecentPlays(results, "snip-A");
        Assert.Equal(3, count);

        int countB = XpEngine.CountRecentPlays(results, "snip-B");
        Assert.Equal(1, countB);

        int countZ = XpEngine.CountRecentPlays(results, "snip-Z");
        Assert.Equal(0, countZ);
    }

    [Fact]
    public void Calculate_ZeroWpm_ReturnsZero()
    {
        int xp = XpEngine.Calculate(0, 100.0, 0);
        Assert.Equal(0, xp);
    }

    [Fact]
    public void Calculate_CustomProfile_HigherMultiplier()
    {
        var profile = new PracticeProfile { XpBaseMultiplier = 1.6 };
        // 60 WPM, 100% accuracy, first play: base = (60*1.0)*1.6 = 96
        int xp = XpEngine.Calculate(60, 100.0, 0, profile);
        Assert.Equal(96, xp);
    }

    [Fact]
    public void Calculate_CustomProfile_DifferentSloppyThreshold()
    {
        var profile = new PracticeProfile { XpSloppyThreshold = 80.0 };
        // 75% accuracy is above default (70%) but below custom (80%)
        int xpDefault = XpEngine.Calculate(60, 75.0, 0);          // no penalty
        int xpCustom = XpEngine.Calculate(60, 75.0, 0, profile);  // 0.5× penalty

        Assert.True(xpCustom < xpDefault,
            $"Custom sloppy threshold should trigger penalty: default={xpDefault}, custom={xpCustom}");
    }

    [Fact]
    public void CompletionBonus_CustomProfile()
    {
        var profile = new PracticeProfile { XpCompletionBonus = 50 };
        int bonus = XpEngine.CompletionBonus(0, profile);
        Assert.Equal(50, bonus);
    }

    [Fact]
    public void Calculate_NullProfile_MatchesDefault()
    {
        int xpNull = XpEngine.Calculate(60, 100.0, 0, null);
        int xpNoParam = XpEngine.Calculate(60, 100.0, 0);
        Assert.Equal(xpNoParam, xpNull);
    }
}
