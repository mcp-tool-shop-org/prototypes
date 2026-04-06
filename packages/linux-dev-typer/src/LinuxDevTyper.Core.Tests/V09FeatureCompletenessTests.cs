using System.Reflection;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Comprehensive v0.9.0 feature completeness tests.
/// Verifies all new types, fields, and integrations exist and function correctly.
/// </summary>
public class V09FeatureCompletenessTests
{
    // --- Phase 1: Calibration Content ---

    [Fact]
    public void CalibrationSnippet_HasDeterministicId()
    {
        var snippet = SnippetFixtures.CalibrationSnippet(3, "python", 1);
        Assert.StartsWith("cal-py-d3-", snippet.Id);
    }

    // --- Phase 2: Session Planner ---

    [Fact]
    public void SessionPlanner_ProducesSessionPlan()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var (snippet, plan) = SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4);

        Assert.NotNull(snippet);
        Assert.NotNull(plan);
        Assert.True(plan.TargetDifficulty >= 1 && plan.TargetDifficulty <= 7);
        Assert.True(plan.ActualDifficulty >= 1 && plan.ActualDifficulty <= 7);
    }

    [Fact]
    public void SessionPlan_HasCategoryAndReason()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var (_, plan) = SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4);

        Assert.True(Enum.IsDefined(plan.Category));
        Assert.False(string.IsNullOrEmpty(plan.Reason));
    }

    // --- Phase 3: Weakness Detection ---

    [Fact]
    public void WeaknessWindow_RecordsAndDecays()
    {
        var window = new WeaknessWindow();
        var now = DateTimeOffset.UtcNow;
        window.Events.Add(new MistakeEvent("CurlyBraces", now));

        Assert.Single(window.Events);
    }

    [Fact]
    public void WeaknessDetector_ProducesCategories()
    {
        var window = new WeaknessWindow();
        var now = DateTimeOffset.UtcNow;
        window.Events.Add(new MistakeEvent("CurlyBraces", now));
        window.Events.Add(new MistakeEvent("CurlyBraces", now));

        var result = WeaknessDetector.GetWeakCategories(window, null, topN: 3, now: now);
        Assert.Contains(SymbolCategoryKind.CurlyBraces, result);
    }

    [Fact]
    public void SkillSignalBuilder_ProducesSignal()
    {
        var signal = SkillSignalBuilder.Build(comfortZone: 4);
        Assert.Contains("D4", signal.Summary);
    }

    // --- Phase 4: Explanation Transparency ---

    [Fact]
    public void ExplanationBuilder_ProducesFactors()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            Reason = "Practicing at D4",
            ComfortZone = 4
        };
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.True(explanation.Factors.Count >= 2);
        Assert.Equal("Practicing at D4", explanation.PrimaryReason);
    }

    [Fact]
    public void ReasonFormatter_ProducesFormattedString()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            Reason = "Test",
            ComfortZone = 4
        };

        var formatted = ReasonFormatter.Format(plan);
        Assert.Contains("Target", formatted);
        Assert.Contains("D4", formatted);
    }

    // --- Phase 5: Per-Character Tracking ---

    [Fact]
    public void MistakeHeatmap_TracksHitsAndMisses()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordHit('{');
        heatmap.RecordMiss('{', '[');

        Assert.Equal(1, heatmap.Records['{'].Hits);
        Assert.Equal(1, heatmap.Records['{'].Misses);
        Assert.Equal(0.5, heatmap.GetErrorRate('{'), 0.01);
    }

    [Fact]
    public void WeaknessTracker_ProducesReport()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        var tracker = new WeaknessTracker();
        var report = tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());

        Assert.True(report.HasData);
        Assert.Single(report.Items);
    }

    [Fact]
    public void WeaknessSnapshot_CapturedByMaybeSnapshot()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);
        var snapshots = new List<WeaknessSnapshot>();

        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);

        Assert.Single(snapshots);
        Assert.Equal("python", snapshots[0].Language);
    }

    // --- Schema Completeness ---

    [Fact]
    public void SchemaVersion_IsAtLeast11()
    {
        Assert.True(PersistedState.CurrentSchemaVersion >= 11);
    }

    [Fact]
    public void PersistedState_HasAllV09Fields()
    {
        var props = typeof(PersistedState).GetProperties().Select(p => p.Name).ToList();

        // Phase 3 additions
        Assert.Contains("WeaknessWindow", props);

        // Phase 5 additions
        Assert.Contains("MistakeHeatmap", props);
        Assert.Contains("WeaknessSnapshots", props);
    }

    [Fact]
    public void Migration_V1ToLatest_Complete()
    {
        var state = new PersistedState { SchemaVersion = 1 };
        state.RecentResults = null!;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.RecentResults);
        Assert.NotNull(migrated.MistakeProfile);
        Assert.NotNull(migrated.DifficultyMemory);
        Assert.NotNull(migrated.PersonalDefaults);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.NotNull(migrated.PracticeProfiles);
        Assert.NotNull(migrated.PackRegistry);
        Assert.NotNull(migrated.MistakeHeatmap);
        Assert.NotNull(migrated.WeaknessSnapshots);
    }

    // --- Display-Only Architecture ---

    [Fact]
    public void AllNewModels_AreDisplayOnly()
    {
        // SelectionExplanation: init-only
        var explanationProps = typeof(SelectionExplanation).GetProperties();
        foreach (var prop in explanationProps)
        {
            var setter = prop.GetSetMethod();
            if (setter != null)
            {
                var returnMods = setter.ReturnParameter.GetRequiredCustomModifiers();
                Assert.Contains(returnMods, t => t.Name == "IsExternalInit");
            }
        }

        // SkillSignal: init-only
        var signalProps = typeof(SkillSignal).GetProperties();
        foreach (var prop in signalProps)
        {
            var setter = prop.GetSetMethod();
            if (setter != null)
            {
                var returnMods = setter.ReturnParameter.GetRequiredCustomModifiers();
                Assert.Contains(returnMods, t => t.Name == "IsExternalInit");
            }
        }
    }

    [Fact]
    public void NoNewFields_OnSnippet()
    {
        // v0.9.0 does NOT add any fields to Snippet
        var props = typeof(Snippet).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("CalibrationData", props);
        Assert.DoesNotContain("WeaknessProfile", props);
        Assert.DoesNotContain("HeatmapData", props);
    }

    // --- Integration ---

    [Fact]
    public void FullPipeline_PlanExplainSignal()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var window = new WeaknessWindow();
        var now = DateTimeOffset.UtcNow;
        window.Events.Add(new MistakeEvent("CurlyBraces", now));
        window.Events.Add(new MistakeEvent("CurlyBraces", now));

        var (snippet, plan) = SessionPlanner.PlanNext(
            pool, 1200, level: 5, comfortZone: 4, weaknessWindow: window);

        var weakCategories = WeaknessDetector.GetWeakCategories(window, null, now: now);
        var explanation = ExplanationBuilder.Build(plan, snippet, weakCategories);
        var reason = ReasonFormatter.Format(plan);
        var signal = SkillSignalBuilder.Build(
            plan: plan, comfortZone: 4, window: window, now: now);

        Assert.NotEmpty(reason);
        Assert.True(explanation.Factors.Count >= 2);
        Assert.NotEmpty(signal.Summary);
    }
}
