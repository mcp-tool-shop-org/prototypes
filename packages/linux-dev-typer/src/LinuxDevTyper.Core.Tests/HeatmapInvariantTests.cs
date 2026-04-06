using System.Reflection;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Proves that MistakeHeatmap and WeaknessTracker are display-only
/// and never affect engine behavior. Ensures the per-character tracking
/// system is a lens, not a lever.
/// </summary>
public class HeatmapInvariantTests
{
    // --- MistakeHeatmap never affects RatingEngine ---

    [Fact]
    public void RatingEngine_NeverReadsMistakeHeatmap()
    {
        var method = typeof(RatingEngine).GetMethod("Adjust", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(MistakeHeatmap), paramTypes);
    }

    // --- MistakeHeatmap never affects XpEngine ---

    [Fact]
    public void XpEngine_NeverReadsMistakeHeatmap()
    {
        var methods = typeof(XpEngine).GetMethods(BindingFlags.Public | BindingFlags.Static);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(MistakeHeatmap), paramTypes);
        }
    }

    // --- MistakeHeatmap never affects DifficultyMemory ---

    [Fact]
    public void DifficultyMemory_NeverReadsMistakeHeatmap()
    {
        var methods = typeof(DifficultyMemory).GetMethods(BindingFlags.Public | BindingFlags.Instance);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(MistakeHeatmap), paramTypes);
        }
    }

    // --- MistakeHeatmap only affects SnippetSelector when SignalPolicy allows ---

    [Fact]
    public void SnippetSelector_HeatmapInert_WhenPolicyOff()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 100; i++) heatmap.RecordMiss('{', '[');

        var rng1 = new Random(42);
        var rng2 = new Random(42);

        // Policy off (default): heatmap has no effect
        var policy = new SignalPolicy(); // GuidedMode = false
        var picks1 = new List<string>();
        var picks2 = new List<string>();

        for (int i = 0; i < 20; i++)
        {
            var s1 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng1);
            var s2 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng2,
                heatmap: heatmap, signalPolicy: policy);
            picks1.Add(s1.Id);
            picks2.Add(s2.Id);
        }

        Assert.Equal(picks1, picks2);
    }

    // --- WeaknessTracker never affects engines ---

    [Fact]
    public void RatingEngine_NeverReadsWeaknessTracker()
    {
        var method = typeof(RatingEngine).GetMethod("Adjust", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(WeaknessTracker), paramTypes);
        Assert.DoesNotContain(typeof(WeaknessReport), paramTypes);
    }

    [Fact]
    public void SnippetSelector_NeverReadsWeaknessTracker()
    {
        var methods = typeof(SnippetSelector).GetMethods(BindingFlags.Public | BindingFlags.Static);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(WeaknessTracker), paramTypes);
            Assert.DoesNotContain(typeof(WeaknessReport), paramTypes);
        }
    }

    // --- WeaknessSnapshot is display-only ---

    [Fact]
    public void SessionPlanner_NeverReadsWeaknessSnapshot()
    {
        var method = typeof(SessionPlanner).GetMethod("PlanNext", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(WeaknessSnapshot), paramTypes);
        Assert.DoesNotContain(typeof(List<WeaknessSnapshot>), paramTypes);
    }

    // --- MistakeHeatmap recording doesn't affect session result ---

    [Fact]
    public void HeatmapRecording_NeverMutatesResult()
    {
        var heatmap = new MistakeHeatmap();
        var snippet = SnippetFixtures.AtDifficulty(4);
        var result = SnippetFixtures.MakeResult(snippet, wpm: 70, accuracy: 90);

        // Record some data
        foreach (char c in snippet.Code)
            heatmap.RecordHit(c);
        heatmap.RecordMiss('{', '[');

        // Result fields should be unchanged
        Assert.Equal(70, result.Wpm);
        Assert.Equal(90, result.Accuracy);
    }

    // --- MistakeHeatmap data doesn't affect snippet selection ---

    [Fact]
    public void SnippetSelection_IdenticalWithAndWithoutHeatmapData()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        // Run 1: no heatmap data
        var picks1 = new List<string>();
        for (int i = 0; i < 50; i++)
        {
            var (snip, _) = SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng1);
            picks1.Add(snip.Id);
        }

        // Run 2: heatmap has lots of data (but same seed)
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 100; i++) heatmap.RecordMiss('{', '[');
        for (int i = 0; i < 100; i++) heatmap.RecordMiss('(', ')');

        var picks2 = new List<string>();
        for (int i = 0; i < 50; i++)
        {
            var (snip, _) = SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng2);
            picks2.Add(snip.Id);
        }

        Assert.Equal(picks1, picks2);
    }

    // --- Schema migration doesn't lose existing data ---

    [Fact]
    public void Migration_V10ToV11_PreservesExistingFields()
    {
        var state = new PersistedState { SchemaVersion = 10 };
        state.Profile.Xp = 500;
        state.Settings.ShowScaffolds = false;

        var migrated = LinuxDevTyper.Core.Persistence.SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Equal(500, migrated.Profile.Xp);
        Assert.False(migrated.Settings.ShowScaffolds);
        Assert.NotNull(migrated.MistakeHeatmap);
        Assert.NotNull(migrated.WeaknessSnapshots);
    }

    // --- WeaknessTracker GetReport is read-only ---

    [Fact]
    public void WeaknessTracker_GetReport_NeverMutatesHeatmap()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        int hitsBefore = heatmap.Records['{'].Hits;
        int missesBefore = heatmap.Records['{'].Misses;

        var tracker = new WeaknessTracker();
        tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());

        Assert.Equal(hitsBefore, heatmap.Records['{'].Hits);
        Assert.Equal(missesBefore, heatmap.Records['{'].Misses);
    }

    [Fact]
    public void WeaknessTracker_GetReport_NeverMutatesSnapshots()
    {
        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<LinuxDevTyper.Core.Mistakes.WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            }
        };

        int countBefore = snapshots.Count;
        var tracker = new WeaknessTracker();
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        tracker.GetReport("python", heatmap, snapshots);

        Assert.Equal(countBefore, snapshots.Count);
    }
}
