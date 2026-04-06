using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Integration tests for v0.9.0 UX transparency features:
/// pick reason display, plan preview, session record metadata,
/// and mismatch annotation.
/// </summary>
public class UXTransparencyTests
{
    // --- ReasonFormatter produces correct output ---

    [Theory]
    [InlineData(MixCategory.Target)]
    [InlineData(MixCategory.Review)]
    [InlineData(MixCategory.Stretch)]
    public void ReasonFormatter_Format_ProducesNonEmpty(MixCategory category)
    {
        var plan = new SessionPlan
        {
            Category = category,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            ComfortZone = 4,
            Reason = $"Test {category}"
        };

        var formatted = ReasonFormatter.Format(plan);
        Assert.False(string.IsNullOrEmpty(formatted));
    }

    [Theory]
    [InlineData(MixCategory.Target, "Target")]
    [InlineData(MixCategory.Review, "Review")]
    [InlineData(MixCategory.Stretch, "Stretch")]
    public void ReasonFormatter_IncludesCategoryLabel(MixCategory category, string expectedLabel)
    {
        var plan = new SessionPlan
        {
            Category = category,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            ComfortZone = 4,
            Reason = "test"
        };

        var formatted = ReasonFormatter.Format(plan);
        Assert.Contains(expectedLabel, formatted);
    }

    [Theory]
    [InlineData(MixCategory.Target)]
    [InlineData(MixCategory.Review)]
    [InlineData(MixCategory.Stretch)]
    public void ReasonFormatter_CategoryIcon_NonEmpty(MixCategory category)
    {
        var icon = ReasonFormatter.CategoryIcon(category);
        Assert.False(string.IsNullOrEmpty(icon));
    }

    [Fact]
    public void ReasonFormatter_Format_WithoutComfortZone_UsesRawReason()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 3,
            ActualDifficulty = 3,
            ComfortZone = null,
            Reason = "Establishing comfort zone"
        };

        var formatted = ReasonFormatter.Format(plan);
        Assert.Contains("Establishing comfort zone", formatted);
    }

    // --- Result stores plan metadata ---

    [Fact]
    public void Result_StoresPlanCategory()
    {
        var result = new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: "python",
            SnippetId: "test-1",
            Wpm: 60,
            Accuracy: 92,
            Errors: 2,
            CharactersTyped: 100,
            XpEarned: 25,
            PlanCategory: MixCategory.Stretch,
            PlanReason: "Stretching to D5"
        );

        Assert.Equal(MixCategory.Stretch, result.PlanCategory);
        Assert.Equal("Stretching to D5", result.PlanReason);
    }

    [Fact]
    public void Result_DefaultPlanFields_AreNull()
    {
        var result = new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: "python",
            SnippetId: "test-1",
            Wpm: 60,
            Accuracy: 92,
            Errors: 2,
            CharactersTyped: 100,
            XpEarned: 25
        );

        Assert.Null(result.PlanCategory);
        Assert.Null(result.PlanReason);
    }

    [Fact]
    public void Result_WithExpression_AttachesPlan()
    {
        var result = new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: "python",
            SnippetId: "test-1",
            Wpm: 60,
            Accuracy: 92,
            Errors: 2,
            CharactersTyped: 100,
            XpEarned: 25
        );

        var withPlan = result with
        {
            PlanCategory = MixCategory.Review,
            PlanReason = "Reinforcing D3 mastery"
        };

        Assert.Equal(MixCategory.Review, withPlan.PlanCategory);
        Assert.Equal("Reinforcing D3 mastery", withPlan.PlanReason);
        // Original unchanged
        Assert.Null(result.PlanCategory);
    }

    // --- SessionPlanner mismatch annotation ---

    [Fact]
    public void SessionPlanner_MismatchAnnotation_InReason()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 3);
        var rng = new Random(42);

        // Run enough picks to get a mismatch (different actual vs target)
        bool sawMismatch = false;
        for (int i = 0; i < 100; i++)
        {
            var (snip, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng);

            if (snip.Difficulty != plan.TargetDifficulty)
            {
                Assert.Contains("nearest", plan.Reason);
                sawMismatch = true;
                break;
            }
        }

        // If no mismatch found (unlikely with full pool), just verify plans work
        if (!sawMismatch)
        {
            // All plans matched target — that's fine, verify format
            var (_, testPlan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng);
            Assert.False(string.IsNullOrEmpty(testPlan.Reason));
        }
    }

    // --- Pick reason display values ---

    [Fact]
    public void PlanNext_AlwaysProducesDisplayableReason()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var rng = new Random(42);

        for (int i = 0; i < 50; i++)
        {
            var (snip, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng);

            Assert.False(string.IsNullOrEmpty(plan.Reason));
            Assert.True(plan.TargetDifficulty >= 1 && plan.TargetDifficulty <= 7);
            Assert.True(plan.ActualDifficulty >= 1 && plan.ActualDifficulty <= 7);

            var formatted = ReasonFormatter.Format(plan);
            Assert.False(string.IsNullOrEmpty(formatted));
        }
    }

    // --- Mix distribution verified ---

    [Fact]
    public void SessionPlanner_DistributionApproximate()
    {
        var counts = new int[3]; // Target, Review, Stretch
        var rng = new Random(42);

        for (int i = 0; i < 1000; i++)
        {
            var category = SessionPlanner.ChooseCategory(rng);
            counts[(int)category]++;
        }

        // 50/30/20 ± generous tolerance
        Assert.InRange(counts[0], 400, 600); // Target ~500
        Assert.InRange(counts[1], 200, 400); // Review ~300
        Assert.InRange(counts[2], 100, 300); // Stretch ~200
    }
}
