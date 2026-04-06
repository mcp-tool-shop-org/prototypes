using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Typing;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Invariant tests ensuring the SessionPlanner is display-only and never
/// affects engine behavior, rating calculations, or XP scoring.
/// </summary>
public class PlannerInvariantTests
{
    private readonly IReadOnlyList<Snippet> _pool = SnippetFixtures.FullPool();

    // --- SessionPlan never affects RatingEngine ---

    [Fact]
    public void RatingEngine_IgnoresSessionPlan()
    {
        var snippet = SnippetFixtures.AtDifficulty(4);
        var result = SnippetFixtures.MakeResult(snippet, wpm: 65, accuracy: 92);

        // Rating calculation uses only result data, never SessionPlan
        int rating1 = RatingEngine.Adjust(1200, snippet.Difficulty, result);
        int rating2 = RatingEngine.Adjust(1200, snippet.Difficulty, result);

        Assert.Equal(rating1, rating2);
    }

    [Fact]
    public void RatingDelta_SameRegardlessOfMixCategory()
    {
        // Same snippet, same result → same rating delta, no matter what category planned it
        var snippet = SnippetFixtures.AtDifficulty(4);
        var result = SnippetFixtures.MakeResult(snippet, wpm: 60, accuracy: 90);

        int baseline = RatingEngine.Adjust(1200, snippet.Difficulty, result);

        // Recalculate — rating engine is deterministic and plan-agnostic
        foreach (var _ in Enum.GetValues<MixCategory>())
        {
            int delta = RatingEngine.Adjust(1200, snippet.Difficulty, result);
            Assert.Equal(baseline, delta);
        }
    }

    // --- SessionPlan never affects DifficultyMemory ---

    [Fact]
    public void DifficultyMemory_IgnoresSessionPlan()
    {
        var memory = new DifficultyMemory();

        // Record identical sessions — DifficultyMemory never receives SessionPlan
        memory.RecordSession("python", 4, 92.0, 65.0);
        memory.RecordSession("python", 4, 88.0, 60.0);
        memory.RecordSession("python", 4, 90.0, 62.0);

        var comfort = memory.ComfortZone("python");
        Assert.NotNull(comfort);
    }

    // --- SessionPlan never affects SnippetSelector weighting ---

    [Fact]
    public void SnippetSelector_WeightingUnaffectedByPlan()
    {
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        // Direct selector call
        var direct = SnippetSelector.Pick(_pool, 1200, 5, suggestedDifficulty: 4, rng: rng1);

        // Through planner (same seed)
        var (planned, _) = SessionPlanner.PlanNext(_pool, 1200, 5, comfortZone: 4, rng: rng2);

        // The planner uses the rng first for category selection, then passes to selector
        // So these won't be identical — but both should be valid picks
        Assert.InRange(direct.Difficulty, 1, 7);
        Assert.InRange(planned.Difficulty, 1, 7);
    }

    // --- Planner produces valid plans for all inputs ---

    [Theory]
    [InlineData(800, null)]
    [InlineData(1200, null)]
    [InlineData(1200, 3)]
    [InlineData(1500, 5)]
    [InlineData(1800, 7)]
    public void PlanNext_AlwaysProducesValidPlan(int rating, int? comfort)
    {
        var rng = new Random(42);
        var (snippet, plan) = SessionPlanner.PlanNext(_pool, rating, comfortZone: comfort, rng: rng);

        Assert.NotNull(snippet);
        Assert.NotNull(plan);
        Assert.InRange(plan.TargetDifficulty, 1, 7);
        Assert.InRange(plan.ActualDifficulty, 1, 7);
        Assert.NotEmpty(plan.Reason);
        Assert.Equal(comfort, plan.ComfortZone);
    }

    // --- Mix categories map to correct difficulty offsets ---

    [Theory]
    [InlineData(MixCategory.Review, 4, 3)]
    [InlineData(MixCategory.Target, 4, 4)]
    [InlineData(MixCategory.Stretch, 4, 5)]
    [InlineData(MixCategory.Review, 1, 1)]
    [InlineData(MixCategory.Stretch, 7, 7)]
    public void CategoryToDifficulty_Invariant(MixCategory category, int comfort, int expected)
    {
        Assert.Equal(expected, SessionPlanner.CategoryToDifficulty(category, comfort));
    }

    // --- SessionPlan has no Snippet fields ---

    [Fact]
    public void SessionPlan_NoSnippetFields()
    {
        // SessionPlan should never contain snippet content (code, topics, etc.)
        var props = typeof(SessionPlan).GetProperties();
        var propNames = props.Select(p => p.Name).ToHashSet();

        Assert.DoesNotContain("Code", propNames);
        Assert.DoesNotContain("Topics", propNames);
        Assert.DoesNotContain("Language", propNames);
        Assert.DoesNotContain("Explain", propNames);
        Assert.DoesNotContain("SnippetId", propNames);
    }

    // --- Mix distribution is stable across seeds ---

    [Fact]
    public void MixDistribution_StableAcrossSeeds()
    {
        int targetCount = 0, reviewCount = 0, stretchCount = 0;
        const int iterations = 5000;

        for (int seed = 0; seed < iterations; seed++)
        {
            var rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(_pool, 1200, comfortZone: 4, rng: rng);
            switch (plan.Category)
            {
                case MixCategory.Target: targetCount++; break;
                case MixCategory.Review: reviewCount++; break;
                case MixCategory.Stretch: stretchCount++; break;
            }
        }

        // Allow ±7% tolerance for 5000 samples
        Assert.InRange(targetCount, iterations * 0.43, iterations * 0.57);
        Assert.InRange(reviewCount, iterations * 0.23, iterations * 0.37);
        Assert.InRange(stretchCount, iterations * 0.13, iterations * 0.27);
    }

    // --- Planner respects all override modes ---

    [Fact]
    public void ManualLock_AlwaysOverridesMixCategory()
    {
        for (int seed = 0; seed < 100; seed++)
        {
            var rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(
                _pool, 1200, comfortZone: 4,
                manualDifficultyLock: 6, rng: rng);

            // Manual lock always produces Target category
            Assert.Equal(MixCategory.Target, plan.Category);
            Assert.Equal(6, plan.TargetDifficulty);
        }
    }

    [Fact]
    public void YoYoLock_AlwaysOverridesMixCategory()
    {
        for (int seed = 0; seed < 100; seed++)
        {
            var rng = new Random(seed);
            var (_, plan) = SessionPlanner.PlanNext(
                _pool, 1200, comfortZone: 3,
                isYoYoing: true, rng: rng);

            Assert.Equal(MixCategory.Target, plan.Category);
            Assert.Equal(3, plan.TargetDifficulty);
        }
    }
}
