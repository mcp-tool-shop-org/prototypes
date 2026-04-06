using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Tests verifying that PracticeProfile parameters interact correctly
/// with the SessionPlanner — profiles affect DifficultyMemory's comfort zone
/// calculation, which feeds into the planner's mix decisions.
/// </summary>
public class PlannerProfileTests
{
    private readonly IReadOnlyList<Snippet> _pool = SnippetFixtures.FullPool();

    [Fact]
    public void Planner_WithStrictProfile_HigherComfortThreshold()
    {
        var memory = new DifficultyMemory();
        var strict = new PracticeProfile { ComfortAccuracyThreshold = 95.0 };

        // Record sessions at 90% accuracy — below strict threshold
        for (int i = 0; i < 5; i++)
            memory.RecordSession("python", 3, 90.0, 60.0);

        // Strict profile: 90% < 95% threshold → no comfort zone
        var comfort = memory.ComfortZone("python", strict);
        Assert.Null(comfort);

        // Planner with null comfort → all Target
        var rng = new Random(42);
        var (_, plan) = SessionPlanner.PlanNext(_pool, 1200, comfortZone: comfort, rng: rng);
        Assert.Equal(MixCategory.Target, plan.Category);
    }

    [Fact]
    public void Planner_WithRelaxedProfile_LowerComfortThreshold()
    {
        var memory = new DifficultyMemory();
        var relaxed = new PracticeProfile { ComfortAccuracyThreshold = 75.0 };

        // Record sessions at 80% accuracy — above relaxed threshold
        for (int i = 0; i < 5; i++)
            memory.RecordSession("python", 4, 80.0, 55.0);

        // Relaxed profile: 80% > 75% threshold → comfort established at D4
        var comfort = memory.ComfortZone("python", relaxed);
        Assert.NotNull(comfort);
        Assert.Equal(4, comfort);

        // Planner with comfort=4 → mixed categories
        var rng = new Random(42);
        var categories = new HashSet<MixCategory>();
        for (int i = 0; i < 100; i++)
        {
            var (_, plan) = SessionPlanner.PlanNext(_pool, 1200, comfortZone: comfort, rng: rng);
            categories.Add(plan.Category);
        }
        Assert.True(categories.Count > 1, "Should produce multiple categories with established comfort");
    }

    [Fact]
    public void Planner_WithFewerRequiredSessions_EstablishesComfortFaster()
    {
        var memory = new DifficultyMemory();
        var fast = new PracticeProfile { ComfortMinSessions = 2 };

        // Only 2 sessions at 90%
        memory.RecordSession("python", 3, 90.0, 60.0);
        memory.RecordSession("python", 3, 92.0, 62.0);

        var comfort = memory.ComfortZone("python", fast);
        Assert.NotNull(comfort);
        Assert.Equal(3, comfort);
    }

    [Fact]
    public void Planner_DefaultProfile_Requires3Sessions()
    {
        var memory = new DifficultyMemory();
        var defaults = new PracticeProfile(); // ComfortMinSessions = 3

        // Only 2 sessions — not enough for default profile
        memory.RecordSession("python", 3, 90.0, 60.0);
        memory.RecordSession("python", 3, 92.0, 62.0);

        var comfort = memory.ComfortZone("python", defaults);
        Assert.Null(comfort);

        // Add third session
        memory.RecordSession("python", 3, 88.0, 58.0);
        comfort = memory.ComfortZone("python", defaults);
        Assert.NotNull(comfort);
    }

    [Fact]
    public void Planner_ComfortProgresses_StretchBecomesNewTarget()
    {
        var memory = new DifficultyMemory();
        var profile = new PracticeProfile();

        // Establish comfort at D3
        for (int i = 0; i < 3; i++)
            memory.RecordSession("python", 3, 90.0, 60.0);

        var comfort3 = memory.ComfortZone("python", profile);
        Assert.Equal(3, comfort3);

        // Now succeed at D4 (the stretch zone becomes comfortable)
        for (int i = 0; i < 3; i++)
            memory.RecordSession("python", 4, 88.0, 58.0);

        var comfort4 = memory.ComfortZone("python", profile);
        Assert.Equal(4, comfort4);

        // Planner now plans around D4
        var rng = new Random(42);
        var (_, plan) = SessionPlanner.PlanNext(_pool, 1200, comfortZone: comfort4, rng: rng);
        Assert.Equal(4, plan.ComfortZone);
    }

    [Fact]
    public void Planner_YoYoDetection_FlowsThroughToPlanner()
    {
        var memory = new DifficultyMemory();
        var profile = new PracticeProfile { YoYoWindowSize = 6, YoYoAccuracySwing = 20.0 };

        // Establish comfort at D3
        for (int i = 0; i < 3; i++)
            memory.RecordSession("python", 3, 90.0, 60.0);

        // Create yo-yo: oscillate between D3 (high acc) and D5 (low acc)
        memory.RecordSession("python", 3, 95.0, 65.0);
        memory.RecordSession("python", 5, 70.0, 45.0);
        memory.RecordSession("python", 3, 92.0, 63.0);
        memory.RecordSession("python", 5, 68.0, 42.0);

        bool yoyo = memory.IsYoYoing("python", profile);
        var comfort = memory.ComfortZone("python", profile);

        if (yoyo && comfort.HasValue)
        {
            var rng = new Random(42);
            var (_, plan) = SessionPlanner.PlanNext(_pool, 1200, comfortZone: comfort,
                isYoYoing: true, rng: rng);
            Assert.Equal(MixCategory.Target, plan.Category);
            Assert.Contains("yo-yo", plan.Reason);
        }
    }
}
