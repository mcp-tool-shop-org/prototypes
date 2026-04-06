using System.Diagnostics;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using WeaknessEntry = LinuxDevTyper.Core.Mistakes.WeaknessEntry;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Performance tests for the MistakeHeatmap and WeaknessTracker pipeline.
/// Ensures per-character tracking stays fast under sustained use.
/// </summary>
public class HeatmapPerformanceTests
{
    [Fact]
    public void MistakeHeatmap_100000Records_Under1s()
    {
        var heatmap = new MistakeHeatmap();
        var chars = "{}()[]<>+-=!@#$%^&*;:'\",./\\|`~".ToCharArray();
        var rng = new Random(42);

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 100_000; i++)
        {
            char c = chars[rng.Next(chars.Length)];
            if (rng.NextDouble() < 0.8)
                heatmap.RecordHit(c);
            else
                heatmap.RecordMiss(c, chars[rng.Next(chars.Length)]);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"100K heatmap records took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void MistakeHeatmap_GetWeakest_10000Queries_Under500ms()
    {
        var heatmap = new MistakeHeatmap();
        var chars = "{}()[]<>+-=".ToCharArray();
        var rng = new Random(42);

        // Populate with data
        for (int i = 0; i < 1000; i++)
        {
            char c = chars[rng.Next(chars.Length)];
            if (rng.NextDouble() < 0.7)
                heatmap.RecordHit(c);
            else
                heatmap.RecordMiss(c, chars[rng.Next(chars.Length)]);
        }

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 10_000; i++)
        {
            heatmap.GetWeakest(count: 5, minAttempts: 5);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 500,
            $"10K GetWeakest queries took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void WeaknessTracker_5000Reports_Under2s()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 50; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 50; i++) heatmap.RecordMiss('{', null);
        for (int i = 0; i < 30; i++) heatmap.RecordHit('(');
        for (int i = 0; i < 20; i++) heatmap.RecordMiss('(', null);

        var snapshots = new List<WeaknessSnapshot>();
        for (int i = 0; i < 30; i++)
        {
            snapshots.Add(new WeaknessSnapshot
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-30 + i),
                TopWeaknesses = new List<WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5 - (i * 0.01), TotalAttempts = 100 }
                }
            });
        }

        var tracker = new WeaknessTracker();
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 5000; i++)
        {
            tracker.GetReport("python", heatmap, snapshots);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 2000,
            $"5K tracker reports took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void MaybeSnapshot_10000Calls_Under1s()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 10; i++) heatmap.RecordMiss('{', null);

        var snapshots = new List<WeaknessSnapshot>();

        var sw = Stopwatch.StartNew();

        // Most calls should be no-ops (already snapped today)
        for (int i = 0; i < 10_000; i++)
        {
            WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"10K MaybeSnapshot calls took {sw.ElapsedMilliseconds}ms");
        Assert.Single(snapshots); // Only one per day
    }

    [Fact]
    public void FullHeatmapPipeline_1000Sessions_Under3s()
    {
        var heatmap = new MistakeHeatmap();
        var snapshots = new List<WeaknessSnapshot>();
        var tracker = new WeaknessTracker();
        var chars = "{}()[]<>+-=!;:".ToCharArray();
        var rng = new Random(42);

        var sw = Stopwatch.StartNew();

        for (int session = 0; session < 1000; session++)
        {
            // Simulate typing 50 characters per session
            for (int i = 0; i < 50; i++)
            {
                char c = chars[rng.Next(chars.Length)];
                if (rng.NextDouble() < 0.85)
                    heatmap.RecordHit(c);
                else
                    heatmap.RecordMiss(c, chars[rng.Next(chars.Length)]);
            }

            // Query weakest after each session
            heatmap.GetWeakest(count: 5, minAttempts: 5);

            // Generate report
            tracker.GetReport("python", heatmap, snapshots);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 3000,
            $"1K full heatmap pipeline sessions took {sw.ElapsedMilliseconds}ms");
    }
}
