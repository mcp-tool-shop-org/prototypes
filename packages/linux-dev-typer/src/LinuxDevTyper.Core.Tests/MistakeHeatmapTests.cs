using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using WeaknessEntry = LinuxDevTyper.Core.Mistakes.WeaknessEntry;

namespace LinuxDevTyper.Core.Tests;

public class MistakeHeatmapTests
{
    [Fact]
    public void RecordHit_IncrementsHits()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordHit('{');
        heatmap.RecordHit('{');

        Assert.Equal(2, heatmap.Records['{'].Hits);
        Assert.Equal(0, heatmap.Records['{'].Misses);
    }

    [Fact]
    public void RecordMiss_IncrementsMisses_SetsLastMissedAt()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordMiss('{', '}');

        Assert.Equal(0, heatmap.Records['{'].Hits);
        Assert.Equal(1, heatmap.Records['{'].Misses);
        Assert.NotNull(heatmap.Records['{'].LastMissedAt);
    }

    [Fact]
    public void RecordMiss_TracksConfusionPairs()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordMiss('{', '[');
        heatmap.RecordMiss('{', '[');
        heatmap.RecordMiss('{', '(');

        Assert.Equal(2, heatmap.Records['{'].ConfusedWith['[']);
        Assert.Equal(1, heatmap.Records['{'].ConfusedWith['(']);
    }

    [Fact]
    public void RecordMiss_NullActual_NoConfusion()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordMiss('{', null);

        Assert.Equal(1, heatmap.Records['{'].Misses);
        Assert.Empty(heatmap.Records['{'].ConfusedWith);
    }

    [Fact]
    public void GetErrorRate_ComputesCorrectly()
    {
        var heatmap = new MistakeHeatmap();
        // 7 hits, 3 misses = 30% error rate
        for (int i = 0; i < 7; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 3; i++) heatmap.RecordMiss('{', null);

        Assert.Equal(0.3, heatmap.GetErrorRate('{'), 0.001);
    }

    [Fact]
    public void GetErrorRate_UnknownChar_ReturnsZero()
    {
        var heatmap = new MistakeHeatmap();
        Assert.Equal(0, heatmap.GetErrorRate('z'));
    }

    [Fact]
    public void GetWeakest_ReturnsTopWeaknesses()
    {
        var heatmap = new MistakeHeatmap();
        // '{' = 50% error (5 of 10)
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        // '(' = 20% error (2 of 10)
        for (int i = 0; i < 8; i++) heatmap.RecordHit('(');
        for (int i = 0; i < 2; i++) heatmap.RecordMiss('(', null);

        var weakest = heatmap.GetWeakest(count: 2, minAttempts: 5);

        Assert.Equal(2, weakest.Count);
        Assert.Equal('{', weakest[0].Character); // Higher error rate first
        Assert.Equal('(', weakest[1].Character);
    }

    [Fact]
    public void GetWeakest_RespectsMinAttempts()
    {
        var heatmap = new MistakeHeatmap();
        // Only 3 attempts — below minAttempts=5
        heatmap.RecordMiss('{', null);
        heatmap.RecordMiss('{', null);
        heatmap.RecordHit('{');

        var weakest = heatmap.GetWeakest(count: 10, minAttempts: 5);
        Assert.Empty(weakest);
    }

    [Fact]
    public void GetWeakest_ExcludesZeroErrorRate()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordHit('{');

        var weakest = heatmap.GetWeakest(count: 10, minAttempts: 5);
        Assert.Empty(weakest);
    }

    [Fact]
    public void GetWeakest_IncludesCategory()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        var weakest = heatmap.GetWeakest();
        Assert.Single(weakest);
        Assert.Equal(SymbolCategoryKind.CurlyBraces, weakest[0].Category);
    }

    [Fact]
    public void GetWeakest_IncludesTopConfusion()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        heatmap.RecordMiss('{', '[');
        heatmap.RecordMiss('{', '[');
        heatmap.RecordMiss('{', '(');

        var weakest = heatmap.GetWeakest();
        Assert.Single(weakest);
        Assert.Equal('[', weakest[0].TopConfusion);
    }

    [Fact]
    public void GetWeakestCategories_AggregatesCorrectly()
    {
        var heatmap = new MistakeHeatmap();
        // CurlyBraces category
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);
        for (int i = 0; i < 5; i++) heatmap.RecordHit('}');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('}', null);

        var categories = heatmap.GetWeakestCategories(minAttempts: 10);
        Assert.Single(categories);
        Assert.Equal(SymbolCategoryKind.CurlyBraces, categories[0].Category);
        Assert.Equal(0.5, categories[0].ErrorRate, 0.01);
        Assert.Equal(20, categories[0].TotalAttempts);
    }

    [Fact]
    public void GetWeakestCategories_ExcludesAlphanumeric()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('a');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('a', null);

        var categories = heatmap.GetWeakestCategories(minAttempts: 5);
        Assert.Empty(categories);
    }

    [Fact]
    public void GetWeakCharSet_ReturnsWeakChars()
    {
        var heatmap = new MistakeHeatmap();
        // '{' = 50% error
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        // '(' = 10% error — below threshold
        for (int i = 0; i < 9; i++) heatmap.RecordHit('(');
        heatmap.RecordMiss('(', null);

        var weakChars = heatmap.GetWeakCharSet(threshold: 0.15, minAttempts: 5);
        Assert.Contains('{', weakChars);
        Assert.DoesNotContain('(', weakChars);
    }

    // --- Rolling window tests ---

    [Fact]
    public void GetRecentErrorRate_UnknownChar_ReturnsZero()
    {
        var heatmap = new MistakeHeatmap();
        Assert.Equal(0, heatmap.GetRecentErrorRate('z'));
    }

    [Fact]
    public void GetRecentErrorRate_FallsBackToAllTime_WhenNoRecentData()
    {
        // Simulate pre-rolling-window data (hits/misses set but no RecentAttempts)
        var heatmap = new MistakeHeatmap();
        heatmap.Records['{'] = new HeatmapEntry { Hits = 7, Misses = 3 };

        Assert.Equal(0.3, heatmap.GetRecentErrorRate('{'), 0.001);
    }

    [Fact]
    public void GetRecentErrorRate_UsesRecentWindow()
    {
        var heatmap = new MistakeHeatmap();
        // Record 80 hits then 20 misses
        for (int i = 0; i < 80; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 20; i++) heatmap.RecordMiss('{', null);

        // All-time: 20% error
        Assert.Equal(0.2, heatmap.GetErrorRate('{'), 0.001);

        // Recent (last 50): all 20 misses + 30 hits = 40% error
        double recent = heatmap.GetRecentErrorRate('{', windowSize: 50);
        Assert.Equal(0.4, recent, 0.001);
    }

    [Fact]
    public void GetRecentErrorRate_SmallWindow()
    {
        var heatmap = new MistakeHeatmap();
        // 10 hits then 10 misses
        for (int i = 0; i < 10; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 10; i++) heatmap.RecordMiss('{', null);

        // Last 10: all misses = 100% error
        double recent = heatmap.GetRecentErrorRate('{', windowSize: 10);
        Assert.Equal(1.0, recent, 0.001);
    }

    [Fact]
    public void RecentAttempts_CappedAtMaxCapacity()
    {
        var heatmap = new MistakeHeatmap();
        int cap = MistakeHeatmap.DefaultWindowSize * 2;

        for (int i = 0; i < cap + 50; i++)
            heatmap.RecordHit('{');

        Assert.Equal(cap, heatmap.Records['{'].RecentAttempts.Count);
    }

    [Fact]
    public void RecordHit_PushesTrue_RecordMiss_PushesFalse()
    {
        var heatmap = new MistakeHeatmap();
        heatmap.RecordHit('{');
        heatmap.RecordMiss('{', null);
        heatmap.RecordHit('{');

        var recent = heatmap.Records['{'].RecentAttempts;
        Assert.Equal(3, recent.Count);
        Assert.True(recent[0]);   // hit
        Assert.False(recent[1]);  // miss
        Assert.True(recent[2]);   // hit
    }
}

public class WeaknessTrackerTests
{
    private static MistakeHeatmap CreateHeatmapWithWeakness(char weak, int hits, int misses)
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < hits; i++) heatmap.RecordHit(weak);
        for (int i = 0; i < misses; i++) heatmap.RecordMiss(weak, null);
        return heatmap;
    }

    [Fact]
    public void GetReport_NoData_ReturnsHasDataFalse()
    {
        var tracker = new WeaknessTracker();
        var heatmap = new MistakeHeatmap();

        var report = tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());

        Assert.False(report.HasData);
        Assert.Empty(report.Items);
    }

    [Fact]
    public void GetReport_WithData_ReturnsWeaknesses()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', hits: 5, misses: 5);

        var report = tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());

        Assert.True(report.HasData);
        Assert.Single(report.Items);
        Assert.Equal('{', report.Items[0].Character);
        Assert.Equal(0.5, report.Items[0].CurrentErrorRate, 0.01);
    }

    [Fact]
    public void GetReport_NoSnapshots_AllItemsNew()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);

        var report = tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());

        Assert.All(report.Items, item => Assert.Equal(WeaknessTrajectory.New, item.Trajectory));
    }

    [Fact]
    public void GetReport_WithSnapshots_DetectsImprovement()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', 8, 2); // 20% error now

        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-2),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            },
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.3, TotalAttempts = 10 }
                }
            }
        };

        var report = tracker.GetReport("python", heatmap, snapshots);

        Assert.True(report.HasData);
        var item = Assert.Single(report.Items);
        Assert.Equal(WeaknessTrajectory.Improving, item.Trajectory);
        Assert.Equal(0.5, item.PreviousErrorRate!.Value, 0.01);
    }

    [Fact]
    public void GetReport_DetectsWorsening()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', 2, 8); // 80% error now

        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-2),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.1, TotalAttempts = 10 }
                }
            },
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.6, TotalAttempts = 10 }
                }
            }
        };

        var report = tracker.GetReport("python", heatmap, snapshots);

        var item = Assert.Single(report.Items);
        Assert.Equal(WeaknessTrajectory.Worsening, item.Trajectory);
    }

    [Fact]
    public void GetReport_DetectsResolved()
    {
        var tracker = new WeaknessTracker();
        var heatmap = new MistakeHeatmap(); // No weaknesses now
        // Add some data so heatmap isn't entirely empty
        for (int i = 0; i < 10; i++) heatmap.RecordHit('(');
        heatmap.RecordMiss('(', null); // slight miss on a different char

        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-2),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            },
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.1, TotalAttempts = 20 }
                }
            }
        };

        var report = tracker.GetReport("python", heatmap, snapshots);
        // '{' is no longer in the weakest list → resolved
        Assert.True(report.HasData);
        Assert.Single(report.ResolvedWeaknesses);
        Assert.Equal('{', report.ResolvedWeaknesses[0].Character);
    }

    [Fact]
    public void GetReport_LanguageFiltering()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);

        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "javascript", // Different language!
                CapturedAt = DateTime.UtcNow.AddDays(-2),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.8, TotalAttempts = 10 }
                }
            },
            new()
            {
                Language = "javascript",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.3, TotalAttempts = 10 }
                }
            }
        };

        var report = tracker.GetReport("python", heatmap, snapshots);
        // No python snapshots → all items are "New"
        Assert.All(report.Items, item => Assert.Equal(WeaknessTrajectory.New, item.Trajectory));
    }

    [Fact]
    public void GetPriorityWeakness_PrefersWorsening()
    {
        var tracker = new WeaknessTracker();
        var report = new WeaknessReport
        {
            HasData = true,
            Items = new List<WeaknessItem>
            {
                new() { Character = '{', CurrentErrorRate = 0.5, Trajectory = WeaknessTrajectory.Improving },
                new() { Character = '(', CurrentErrorRate = 0.3, Trajectory = WeaknessTrajectory.Worsening },
                new() { Character = '[', CurrentErrorRate = 0.8, Trajectory = WeaknessTrajectory.Steady }
            }
        };

        var priority = tracker.GetPriorityWeakness(report);
        Assert.NotNull(priority);
        Assert.Equal('(', priority.Character); // Worsening has highest priority
    }

    [Fact]
    public void GetPriorityWeakness_NoData_ReturnsNull()
    {
        var tracker = new WeaknessTracker();
        var report = new WeaknessReport { HasData = false };

        Assert.Null(tracker.GetPriorityWeakness(report));
    }

    [Fact]
    public void MaybeSnapshot_CapturesOncePerDay()
    {
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);
        var snapshots = new List<WeaknessSnapshot>();

        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        Assert.Single(snapshots);

        // Second call same day — no new snapshot
        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        Assert.Single(snapshots);
    }

    [Fact]
    public void MaybeSnapshot_DifferentLanguages_BothCaptured()
    {
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);
        var snapshots = new List<WeaknessSnapshot>();

        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        WeaknessTracker.MaybeSnapshot("javascript", heatmap, snapshots);

        Assert.Equal(2, snapshots.Count);
    }

    [Fact]
    public void MaybeSnapshot_EmptyHeatmap_NoSnapshot()
    {
        var heatmap = new MistakeHeatmap();
        var snapshots = new List<WeaknessSnapshot>();

        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        Assert.Empty(snapshots);
    }

    [Fact]
    public void MaybeSnapshot_CapsAt90()
    {
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);
        var snapshots = new List<WeaknessSnapshot>();

        // Fill with 95 snapshots (different "days" by setting language uniquely)
        for (int i = 0; i < 95; i++)
        {
            snapshots.Add(new WeaknessSnapshot
            {
                Language = $"lang-{i}",
                CapturedAt = DateTime.UtcNow.AddDays(-i - 1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            });
        }

        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        Assert.True(snapshots.Count <= 90);
    }

    [Fact]
    public void GetReport_Summary_NoSnapshots_ShowsNoWeaknessData()
    {
        var tracker = new WeaknessTracker();
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 5; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        var report = tracker.GetReport("python", heatmap, new List<WeaknessSnapshot>());
        // Without snapshots, all items are "New" trajectory — no improving/steady/worsening counts
        Assert.Equal("No weakness data yet", report.Summary);
    }

    [Fact]
    public void GetReport_Summary_WithSnapshots_ShowsCounts()
    {
        var tracker = new WeaknessTracker();
        var heatmap = CreateHeatmapWithWeakness('{', 5, 5);

        var snapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-2),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.8, TotalAttempts = 10 }
                }
            },
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            }
        };

        var report = tracker.GetReport("python", heatmap, snapshots);
        // '{' improving from 0.8→0.5
        Assert.Contains("improving", report.Summary);
    }
}
