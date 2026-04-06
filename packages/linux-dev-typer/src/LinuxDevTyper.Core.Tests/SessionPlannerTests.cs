using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

public class SessionPlannerTests
{
    private readonly IReadOnlyList<Snippet> _pool = SnippetFixtures.FullPool();

    // --- Mix Category Distribution ---

    [Fact]
    public void ChooseCategory_DistributionApproximates50_30_20()
    {
        var rng = new Random(42);
        var counts = new Dictionary<MixCategory, int>
        {
            [MixCategory.Target] = 0,
            [MixCategory.Review] = 0,
            [MixCategory.Stretch] = 0
        };

        const int iterations = 10000;
        for (int i = 0; i < iterations; i++)
        {
            counts[SessionPlanner.ChooseCategory(rng)]++;
        }

        // Allow ±5% tolerance
        Assert.InRange(counts[MixCategory.Target], iterations * 0.45, iterations * 0.55);
        Assert.InRange(counts[MixCategory.Review], iterations * 0.25, iterations * 0.35);
        Assert.InRange(counts[MixCategory.Stretch], iterations * 0.15, iterations * 0.25);
    }

    // --- Category → Difficulty Mapping ---

    [Theory]
    [InlineData(MixCategory.Target, 4, 4)]
    [InlineData(MixCategory.Review, 4, 3)]
    [InlineData(MixCategory.Stretch, 4, 5)]
    [InlineData(MixCategory.Review, 1, 1)]   // Can't go below 1
    [InlineData(MixCategory.Stretch, 7, 7)]  // Can't go above 7
    public void CategoryToDifficulty_MapsCorrectly(MixCategory category, int comfort, int expected)
    {
        var result = SessionPlanner.CategoryToDifficulty(category, comfort);
        Assert.Equal(expected, result);
    }

    // --- PlanNext: no comfort zone ---

    [Fact]
    public void PlanNext_NoComfortZone_AlwaysTarget()
    {
        var rng = new Random(42);
        for (int i = 0; i < 50; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(_pool, rating: 1200, comfortZone: null, rng: rng);
            Assert.Equal(MixCategory.Target, plan.Category);
            Assert.Null(plan.ComfortZone);
            Assert.Contains("comfort zone", plan.Reason);
        }
    }

    // --- PlanNext: manual lock ---

    [Fact]
    public void PlanNext_ManualLock_OverridesEverything()
    {
        var rng = new Random(42);
        var (snippet, plan) = SessionPlanner.PlanNext(
            _pool, rating: 1200, comfortZone: 3,
            manualDifficultyLock: 6, rng: rng);

        Assert.Equal(MixCategory.Target, plan.Category);
        Assert.Equal(6, plan.TargetDifficulty);
        Assert.Contains("Manual lock", plan.Reason);
    }

    // --- PlanNext: yo-yo lock ---

    [Fact]
    public void PlanNext_YoYo_StabilizesAtComfort()
    {
        var rng = new Random(42);
        var (snippet, plan) = SessionPlanner.PlanNext(
            _pool, rating: 1200, comfortZone: 3,
            isYoYoing: true, rng: rng);

        Assert.Equal(MixCategory.Target, plan.Category);
        Assert.Equal(3, plan.TargetDifficulty);
        Assert.Contains("yo-yo", plan.Reason);
    }

    // --- PlanNext: with comfort zone, mix distribution ---

    [Fact]
    public void PlanNext_WithComfort_ProducesMixedCategories()
    {
        var rng = new Random(42);
        var categories = new HashSet<MixCategory>();

        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                _pool, rating: 1200, comfortZone: 4, rng: rng);
            categories.Add(plan.Category);
        }

        // All three categories should appear in 100 selections
        Assert.Contains(MixCategory.Target, categories);
        Assert.Contains(MixCategory.Review, categories);
        Assert.Contains(MixCategory.Stretch, categories);
    }

    [Fact]
    public void PlanNext_WithComfort_DifficultyMatchesCategory()
    {
        var rng = new Random(42);
        int comfortZone = 4;

        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                _pool, rating: 1200, comfortZone: comfortZone, rng: rng);

            int expectedTarget = plan.Category switch
            {
                MixCategory.Review => Math.Max(1, comfortZone - 1),
                MixCategory.Stretch => Math.Min(7, comfortZone + 1),
                _ => comfortZone
            };

            Assert.Equal(expectedTarget, plan.TargetDifficulty);
            Assert.Equal(comfortZone, plan.ComfortZone);
        }
    }

    // --- Reason strings ---

    [Fact]
    public void PlanNext_ReviewCategory_HasReinforcingReason()
    {
        // Use a seed that produces a Review category
        var pool = SnippetFixtures.FullPool();
        bool foundReview = false;

        for (int seed = 0; seed < 1000 && !foundReview; seed++)
        {
            var rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(pool, rating: 1200, comfortZone: 4, rng: rng);
            if (plan.Category == MixCategory.Review)
            {
                Assert.Contains("Reinforcing", plan.Reason);
                foundReview = true;
            }
        }

        Assert.True(foundReview, "Should find a Review category within 1000 seeds");
    }

    [Fact]
    public void PlanNext_StretchCategory_HasStretchingReason()
    {
        var pool = SnippetFixtures.FullPool();
        bool foundStretch = false;

        for (int seed = 0; seed < 1000 && !foundStretch; seed++)
        {
            var rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(pool, rating: 1200, comfortZone: 4, rng: rng);
            if (plan.Category == MixCategory.Stretch)
            {
                Assert.Contains("Stretching", plan.Reason);
                foundStretch = true;
            }
        }

        Assert.True(foundStretch, "Should find a Stretch category within 1000 seeds");
    }

    // --- Edge cases ---

    [Fact]
    public void PlanNext_ComfortAtD1_ReviewClampsToD1()
    {
        var rng = new Random(42);
        bool foundReview = false;

        for (int seed = 0; seed < 1000 && !foundReview; seed++)
        {
            rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(_pool, rating: 800, comfortZone: 1, rng: rng);
            if (plan.Category == MixCategory.Review)
            {
                Assert.Equal(1, plan.TargetDifficulty);
                foundReview = true;
            }
        }

        Assert.True(foundReview, "Should find a Review at comfort=1");
    }

    [Fact]
    public void PlanNext_ComfortAtD7_StretchClampsToD7()
    {
        var rng = new Random(42);
        bool foundStretch = false;

        for (int seed = 0; seed < 1000 && !foundStretch; seed++)
        {
            rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(_pool, rating: 1800, comfortZone: 7, rng: rng);
            if (plan.Category == MixCategory.Stretch)
            {
                Assert.Equal(7, plan.TargetDifficulty);
                foundStretch = true;
            }
        }

        Assert.True(foundStretch, "Should find a Stretch at comfort=7");
    }

    [Fact]
    public void PlanNext_EmptyPool_ReturnsFallbackSnippet()
    {
        var rng = new Random(42);
        var empty = Array.Empty<Snippet>();

        var (snippet, plan) = SessionPlanner.PlanNext(empty, rating: 1200, comfortZone: 4, rng: rng);

        // SnippetSelector returns a fallback when empty
        Assert.NotNull(snippet);
        Assert.NotNull(plan);
    }

    // --- SessionPlan is display-only ---

    [Fact]
    public void SessionPlan_NeverAffectsSnippetSelection_Deterministic()
    {
        // Same seed, same pool, same parameters → same snippet regardless of plan
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        var (snippet1, _) = SessionPlanner.PlanNext(_pool, rating: 1200, comfortZone: 4, rng: rng1);
        var (snippet2, _) = SessionPlanner.PlanNext(_pool, rating: 1200, comfortZone: 4, rng: rng2);

        Assert.Equal(snippet1.Id, snippet2.Id);
    }

    // --- Performance ---

    [Fact]
    public void PlanNext_LargePool_PerformsWell()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 50); // 350 snippets
        var rng = new Random(42);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 1000; i++)
        {
            SessionPlanner.PlanNext(pool, rating: 1200, level: 5, comfortZone: 4, rng: rng);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 2000,
            $"1000 plans from 350-snippet pool took {sw.ElapsedMilliseconds}ms");
    }

    // --- Biased pool ---

    [Fact]
    public void PlanNext_BiasedPool_StillSelectsAllCategories()
    {
        var pool = SnippetFixtures.BiasedPool(targetDifficulty: 4);
        var rng = new Random(42);
        var categories = new HashSet<MixCategory>();

        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(pool, rating: 1200, comfortZone: 4, rng: rng);
            categories.Add(plan.Category);
        }

        Assert.Contains(MixCategory.Target, categories);
        Assert.Contains(MixCategory.Review, categories);
        Assert.Contains(MixCategory.Stretch, categories);
    }
}
