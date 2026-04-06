using System.Diagnostics;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Performance gate tests at 5,000 CodeItems.
/// Verifies planner speed, selector speed, and heatmap operations
/// remain fast with large data sets.
/// </summary>
public class PerfGateTests
{
    private static List<Snippet> LargePool(int count = 5000)
    {
        var pool = new List<Snippet>();
        for (int i = 0; i < count; i++)
        {
            int difficulty = (i % 7) + 1;
            pool.Add(SnippetFixtures.AtDifficulty(difficulty, "python", i + 1));
        }
        return pool;
    }

    // --- SnippetSelector.Pick at 5k snippets ---

    [Fact]
    public void Pick_5kSnippets_Under10ms()
    {
        var pool = LargePool();
        var rng = new Random(42);

        // Warmup
        for (int i = 0; i < 5; i++)
            SnippetSelector.Pick(pool, 1200, level: 5, rng: rng);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            SnippetSelector.Pick(pool, 1200, level: 5, rng: rng);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 10, $"Pick averaged {avgMs:F2}ms per call (limit: 10ms)");
    }

    [Fact]
    public void Pick_5kSnippets_WithBias_Under20ms()
    {
        var pool = LargePool();
        var rng = new Random(42);

        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '[', ']', '(', ')' })
        {
            for (int i = 0; i < 2; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 8; i++) heatmap.RecordMiss(c, null);
        }

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        // Warmup
        for (int i = 0; i < 5; i++)
            SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 50, $"Pick with bias averaged {avgMs:F2}ms per call (limit: 50ms)");
    }

    // --- SessionPlanner.PlanNext at 5k snippets ---

    [Fact]
    public void PlanNext_5kSnippets_Under15ms()
    {
        var pool = LargePool();
        var rng = new Random(42);

        // Warmup
        for (int i = 0; i < 5; i++)
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 15, $"PlanNext averaged {avgMs:F2}ms per call (limit: 15ms)");
    }

    [Fact]
    public void PlanNext_5kSnippets_WithBias_Under20ms()
    {
        var pool = LargePool();
        var rng = new Random(42);

        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '[', ']', '(', ')' })
        {
            for (int i = 0; i < 2; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 8; i++) heatmap.RecordMiss(c, null);
        }
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        // Warmup
        for (int i = 0; i < 5; i++)
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4,
                rng: rng, heatmap: heatmap, signalPolicy: policy);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4,
                rng: rng, heatmap: heatmap, signalPolicy: policy);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 20, $"PlanNext with bias averaged {avgMs:F2}ms per call (limit: 20ms)");
    }

    // --- Heatmap operations at scale ---

    [Fact]
    public void Heatmap_GetWeakCharSet_200Records_Under1ms()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 200; i++)
        {
            char c = (char)(33 + i);
            for (int j = 0; j < 10; j++) heatmap.RecordHit(c);
            for (int j = 0; j < 5; j++) heatmap.RecordMiss(c, null);
        }

        // Warmup
        heatmap.GetWeakCharSet();

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 1000; i++)
            heatmap.GetWeakCharSet();
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 1000;
        Assert.True(avgMs < 1, $"GetWeakCharSet averaged {avgMs:F3}ms per call (limit: 1ms)");
    }

    [Fact]
    public void Heatmap_GetWeakestCategories_200Records_Under1ms()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 200; i++)
        {
            char c = (char)(33 + i);
            for (int j = 0; j < 10; j++) heatmap.RecordHit(c);
            for (int j = 0; j < 5; j++) heatmap.RecordMiss(c, null);
        }

        // Warmup
        heatmap.GetWeakestCategories();

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 1000; i++)
            heatmap.GetWeakestCategories();
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 1000;
        Assert.True(avgMs < 1, $"GetWeakestCategories averaged {avgMs:F3}ms per call (limit: 1ms)");
    }

    [Fact]
    public void Heatmap_Prune_200Records_Under5ms()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 250; i++)
        {
            char c = (char)(33 + i);
            for (int j = 0; j < 10; j++) heatmap.RecordHit(c);
            for (int j = 0; j < 5; j++) heatmap.RecordMiss(c, null);
            // Add lots of confusion pairs
            for (int j = 0; j < 25; j++)
                heatmap.RecordMiss(c, (char)('a' + j));
        }

        // Warmup
        heatmap.Prune();

        // Rebuild for timing
        var heatmap2 = new MistakeHeatmap();
        for (int i = 0; i < 250; i++)
        {
            char c = (char)(33 + i);
            for (int j = 0; j < 10; j++) heatmap2.RecordHit(c);
            for (int j = 0; j < 25; j++) heatmap2.RecordMiss(c, (char)('a' + j));
        }

        var sw = Stopwatch.StartNew();
        heatmap2.Prune();
        sw.Stop();

        Assert.True(sw.Elapsed.TotalMilliseconds < 10,
            $"Prune took {sw.Elapsed.TotalMilliseconds:F2}ms (limit: 10ms)");
    }

    // --- HeatmapBias at scale ---

    [Fact]
    public void HeatmapBias_LargeCode_Under1ms()
    {
        // 1KB of code
        string code = string.Concat(Enumerable.Range(0, 100)
            .Select(i => $"def func_{i}(x, y):\n    return {{x: [y]}}\n"));

        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '[', ']', '(', ')' })
        {
            for (int i = 0; i < 2; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 8; i++) heatmap.RecordMiss(c, null);
        }

        // Warmup
        SnippetSelector.HeatmapBias(code, heatmap);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 10000; i++)
            SnippetSelector.HeatmapBias(code, heatmap);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 10000;
        Assert.True(avgMs < 1, $"HeatmapBias averaged {avgMs:F4}ms per call (limit: 1ms)");
    }
}
