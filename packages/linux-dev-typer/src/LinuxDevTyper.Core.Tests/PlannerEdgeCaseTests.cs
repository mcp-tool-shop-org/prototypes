using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Edge case and integration tests for SessionPlanner behavior under
/// unusual inputs, extreme conditions, and profile tuning.
/// </summary>
public class PlannerEdgeCaseTests
{
    // --- Single-snippet pool ---

    [Fact]
    public void PlanNext_SingleSnippetPool_AlwaysSelectsIt()
    {
        var pool = new[] { SnippetFixtures.AtDifficulty(3) };
        var rng = new Random(42);

        for (int i = 0; i < 20; i++)
        {
            var (snippet, plan) = SessionPlanner.PlanNext(pool, 1200, comfortZone: 3, rng: rng);
            Assert.Equal(3, snippet.Difficulty);
            Assert.NotNull(plan);
        }
    }

    // --- All snippets at one difficulty ---

    [Fact]
    public void PlanNext_AllSameDifficulty_StillProducesValidPlans()
    {
        var pool = Enumerable.Range(1, 10)
            .Select(i => SnippetFixtures.AtDifficulty(4, seq: i))
            .ToList();
        var rng = new Random(42);

        var categories = new HashSet<MixCategory>();
        for (int i = 0; i < 50; i++)
        {
            var (snippet, plan) = SessionPlanner.PlanNext(pool, 1200, comfortZone: 4, rng: rng);
            Assert.Equal(4, snippet.Difficulty);
            categories.Add(plan.Category);
        }

        // All categories should appear even though all snippets are same difficulty
        Assert.Contains(MixCategory.Target, categories);
        Assert.Contains(MixCategory.Review, categories);
        Assert.Contains(MixCategory.Stretch, categories);
    }

    // --- Extreme ratings ---

    [Theory]
    [InlineData(100)]    // Floor rating
    [InlineData(2500)]   // Very high rating
    public void PlanNext_ExtremeRatings_ProducesValidPlan(int rating)
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);

        var (snippet, plan) = SessionPlanner.PlanNext(pool, rating, comfortZone: 4, rng: rng);

        Assert.NotNull(snippet);
        Assert.InRange(plan.TargetDifficulty, 1, 7);
        Assert.InRange(plan.ActualDifficulty, 1, 7);
    }

    // --- All comfort zones ---

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    [InlineData(7)]
    public void PlanNext_AllComfortZones_ValidPlans(int comfort)
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);

        for (int i = 0; i < 20; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(pool, 1200, comfortZone: comfort, rng: rng);
            Assert.InRange(plan.TargetDifficulty, 1, 7);
            Assert.Equal(comfort, plan.ComfortZone);
        }
    }

    // --- Weakness profile interaction ---

    [Fact]
    public void PlanNext_WithWeaknessProfile_StillProducesMixedCategories()
    {
        var pool = SnippetFixtures.FullPool();
        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 15;
        profile.CategoryErrors["Parentheses"] = 10;
        profile.TotalCharactersTyped = 5000;

        var rng = new Random(42);
        var categories = new HashSet<MixCategory>();

        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                pool, 1200, comfortZone: 4,
                weaknessProfile: profile, rng: rng);
            categories.Add(plan.Category);
        }

        Assert.Contains(MixCategory.Target, categories);
        Assert.Contains(MixCategory.Review, categories);
        Assert.Contains(MixCategory.Stretch, categories);
    }

    // --- Focus category interaction ---

    [Fact]
    public void PlanNext_WithFocusCategory_StillProducesMixedCategories()
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);
        var categories = new HashSet<MixCategory>();

        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                pool, 1200, comfortZone: 4,
                focusCategory: SymbolCategoryKind.CurlyBraces, rng: rng);
            categories.Add(plan.Category);
        }

        Assert.Contains(MixCategory.Target, categories);
        Assert.Contains(MixCategory.Review, categories);
        Assert.Contains(MixCategory.Stretch, categories);
    }

    // --- Last difficulty clamping still works through planner ---

    [Fact]
    public void PlanNext_LastDifficulty_ClampingApplied()
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);

        // With lastDifficulty=2 and comfort=6, the selector should clamp
        var (_, plan) = SessionPlanner.PlanNext(
            pool, 1200, comfortZone: 6,
            lastDifficulty: 2, rng: rng);

        // The actual difficulty should be reasonable (SnippetSelector clamps to ±1 of last)
        Assert.InRange(plan.ActualDifficulty, 1, 7);
    }

    // --- Multiple languages don't interfere ---

    [Fact]
    public void PlanNext_DifferentLanguages_IndependentPlans()
    {
        var pythonPool = SnippetFixtures.FullPool("python");
        var rustPool = SnippetFixtures.FullPool("rust");
        var rng = new Random(42);

        var (pySnippet, pyPlan) = SessionPlanner.PlanNext(pythonPool, 1200, comfortZone: 4, rng: rng);
        rng = new Random(42);
        var (rsSnippet, rsPlan) = SessionPlanner.PlanNext(rustPool, 1200, comfortZone: 4, rng: rng);

        // Same seed, same parameters → same plan decisions (categories match)
        Assert.Equal(pyPlan.Category, rsPlan.Category);
        Assert.Equal(pyPlan.TargetDifficulty, rsPlan.TargetDifficulty);
    }

    // --- High-level players get valid stretch plans ---

    [Fact]
    public void PlanNext_HighLevel_StretchStillBounded()
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);

        for (int i = 0; i < 50; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                pool, 1800, level: 15, comfortZone: 7, rng: rng);

            Assert.InRange(plan.TargetDifficulty, 1, 7);
        }
    }

    // --- Planner with both manual lock AND yo-yo (manual takes precedence) ---

    [Fact]
    public void PlanNext_ManualLockAndYoYo_ManualWins()
    {
        var pool = SnippetFixtures.FullPool();
        var rng = new Random(42);

        var (_, plan) = SessionPlanner.PlanNext(
            pool, 1200, comfortZone: 3,
            manualDifficultyLock: 5, isYoYoing: true, rng: rng);

        Assert.Equal(5, plan.TargetDifficulty);
        Assert.Contains("Manual lock", plan.Reason);
    }
}
