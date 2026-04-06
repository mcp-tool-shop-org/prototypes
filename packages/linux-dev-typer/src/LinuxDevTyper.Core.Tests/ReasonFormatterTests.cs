using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;

namespace LinuxDevTyper.Core.Tests;

public sealed class ReasonFormatterTests
{
    [Fact]
    public void Format_TargetWithComfortZone_ContainsComfortZoneText()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            ComfortZone = 4,
            Reason = "Practicing at D4"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.Contains("Target", result);
        Assert.Contains("D4", result);
        Assert.Contains("comfort zone", result);
    }

    [Fact]
    public void Format_ReviewWithComfortZone_ContainsReinforcingText()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Review,
            TargetDifficulty = 3,
            ActualDifficulty = 3,
            ComfortZone = 4,
            Reason = "Reinforcing D3 mastery"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.Contains("Review", result);
        Assert.Contains("D3", result);
        Assert.Contains("reinforcing", result);
    }

    [Fact]
    public void Format_StretchWithComfortZone_ContainsGrowthText()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Stretch,
            TargetDifficulty = 5,
            ActualDifficulty = 5,
            ComfortZone = 4,
            Reason = "Stretching to D5"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.Contains("Stretch", result);
        Assert.Contains("D5", result);
        Assert.Contains("growth", result);
    }

    [Fact]
    public void Format_NoComfortZone_UsesReasonField()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 3,
            ActualDifficulty = 3,
            ComfortZone = null,
            Reason = "Establishing comfort zone"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.Contains("Target", result);
        Assert.Contains("Establishing comfort zone", result);
    }

    [Theory]
    [InlineData(MixCategory.Target, "Target")]
    [InlineData(MixCategory.Review, "Review")]
    [InlineData(MixCategory.Stretch, "Stretch")]
    public void CategoryLabel_ReturnsCorrectLabel(MixCategory category, string expected)
    {
        Assert.Equal(expected, ReasonFormatter.CategoryLabel(category));
    }

    [Theory]
    [InlineData(MixCategory.Target)]
    [InlineData(MixCategory.Review)]
    [InlineData(MixCategory.Stretch)]
    public void CategoryIcon_ReturnsNonEmptyString(MixCategory category)
    {
        var icon = ReasonFormatter.CategoryIcon(category);
        Assert.False(string.IsNullOrEmpty(icon));
    }

    [Fact]
    public void Format_AllCategories_ProduceNonEmptyStrings()
    {
        foreach (MixCategory category in Enum.GetValues<MixCategory>())
        {
            var plan = new SessionPlan
            {
                Category = category,
                TargetDifficulty = 4,
                ActualDifficulty = 4,
                ComfortZone = 4,
                Reason = "Test"
            };

            var result = ReasonFormatter.Format(plan);
            Assert.False(string.IsNullOrWhiteSpace(result),
                $"Format returned empty string for {category}");
        }
    }
}
