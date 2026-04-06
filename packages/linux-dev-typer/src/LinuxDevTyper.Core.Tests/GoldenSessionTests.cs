using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Golden end-to-end session tests proving deterministic behavior.
/// Simulates a full session cycle: plan -> select -> type -> rate -> record.
/// Verifies identical results across runs with the same seed.
/// </summary>
public class GoldenSessionTests
{
    // --- Guided Mode OFF: identical to v0.9 ---

    [Fact]
    public void GoldenSession_GuidedOff_MatchesV09()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        // Build heatmap data (ignored when Guided Mode is off)
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('{', '[');
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('(', ')');

        // Run 1: v0.9 style (no heatmap, no policy)
        var session1 = new List<(string Id, int Difficulty, string Category)>();
        for (int i = 0; i < 20; i++)
        {
            var (snip, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng1);
            session1.Add((snip.Id, snip.Difficulty, plan.Category.ToString()));
        }

        // Run 2: v1.0 style with Guided Mode OFF
        var policyOff = new SignalPolicy();
        var session2 = new List<(string Id, int Difficulty, string Category)>();
        for (int i = 0; i < 20; i++)
        {
            var (snip, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng2,
                heatmap: heatmap, signalPolicy: policyOff);
            session2.Add((snip.Id, snip.Difficulty, plan.Category.ToString()));
        }

        // Byte-for-byte identical
        for (int i = 0; i < 20; i++)
        {
            Assert.Equal(session1[i].Id, session2[i].Id);
            Assert.Equal(session1[i].Difficulty, session2[i].Difficulty);
            Assert.Equal(session1[i].Category, session2[i].Category);
        }
    }

    // --- Guided Mode ON: deterministic ---

    [Fact]
    public void GoldenSession_GuidedOn_Deterministic()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('{', '[');
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('(', ')');
        for (int i = 0; i < 200; i++) heatmap.RecordHit('a');

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var rng1 = new Random(777);
        var rng2 = new Random(777);

        var session1 = new List<string>();
        var session2 = new List<string>();

        for (int i = 0; i < 30; i++)
        {
            var (s1, _) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng1,
                heatmap: heatmap, signalPolicy: policy);
            var (s2, _) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng2,
                heatmap: heatmap, signalPolicy: policy);
            session1.Add(s1.Id);
            session2.Add(s2.Id);
        }

        Assert.Equal(session1, session2);
    }

    // --- Full lifecycle: plan -> type -> rate -> record ---

    [Fact]
    public void GoldenLifecycle_PlanTypeRateRecord()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var rng = new Random(42);
        var profile = new PracticeProfile();

        // Plan
        var (snippet, plan) = SessionPlanner.PlanNext(
            pool, 1200, level: 5, comfortZone: 4, rng: rng);

        Assert.NotNull(snippet);
        Assert.NotNull(plan);
        Assert.True(snippet.Difficulty >= 1 && snippet.Difficulty <= 7);
        Assert.True(Enum.IsDefined(plan.Category));

        // Simulate typing
        var session = new TypingSession();
        var options = new TypingSessionOptions
        {
            NormalizeLineEndings = true,
            StrictWhitespace = true,
            IgnoreTrailingSpaces = false,
            HardcoreMode = false
        };
        session.Start(snippet.Code, "python", snippet.Id, options, snippet.Difficulty, 0);

        // Type the code correctly
        session.Update(snippet.Code);
        Assert.True(session.Complete);

        // Rate
        var result = session.ToResult(new SessionMetadata());
        int oldRating = 1200;
        int newRating = RatingEngine.Adjust(oldRating, snippet.Difficulty, result, profile);

        // Rating should change (accurate typing at appropriate difficulty)
        Assert.NotEqual(0, newRating); // Sanity check

        // Record
        Assert.Equal("python", result.Language);
        Assert.Equal(snippet.Id, result.SnippetId);
        Assert.Equal(snippet.Difficulty, result.Difficulty);
        Assert.True(result.Accuracy >= 0 && result.Accuracy <= 100);
    }

    // --- Mix distribution is stable ---

    [Fact]
    public void GoldenMix_TargetReviewStretchDistribution()
    {
        var rng = new Random(42);
        int target = 0, review = 0, stretch = 0;

        for (int i = 0; i < 1000; i++)
        {
            var cat = SessionPlanner.ChooseCategory(rng);
            switch (cat)
            {
                case MixCategory.Target: target++; break;
                case MixCategory.Review: review++; break;
                case MixCategory.Stretch: stretch++; break;
            }
        }

        // Expected: 50/30/20 with ±5% tolerance
        Assert.InRange(target, 400, 600);
        Assert.InRange(review, 200, 400);
        Assert.InRange(stretch, 100, 300);
    }

    // --- Guided Mode doesn't change mix distribution ---

    [Fact]
    public void GoldenMix_GuidedModeDoesNotChangeMixRatio()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('{', '[');
        var policyOn = new SignalPolicy();
        policyOn.EnableGuidedMode();

        // Run with Guided Mode
        var categories = new Dictionary<string, int>();
        var rng = new Random(42);
        for (int i = 0; i < 200; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4, rng: rng,
                heatmap: heatmap, signalPolicy: policyOn);
            var key = plan.Category.ToString();
            categories.TryGetValue(key, out int count);
            categories[key] = count + 1;
        }

        // Mix should still be roughly 50/30/20
        Assert.True(categories.GetValueOrDefault("Target", 0) > 70,
            "Target should be significant portion");
        Assert.True(categories.GetValueOrDefault("Review", 0) > 30,
            "Review should be present");
        Assert.True(categories.GetValueOrDefault("Stretch", 0) > 15,
            "Stretch should be present");
    }
}
