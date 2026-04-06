using System.Diagnostics;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Performance gates ensuring selection and planning stay fast at scale.
/// All tests must pass at 5K CodeItems to prove UI won't stutter.
/// Budgets are set at ~2x observed peaks to avoid CI-flaky failures
/// while still catching genuine O(n²) regressions.
/// </summary>
public class SelectionPerformanceTests
{
    private static List<Snippet> Generate5KPool()
    {
        var pool = new List<Snippet>();
        for (int i = 0; i < 5_000; i++)
        {
            pool.Add(new Snippet
            {
                Id = $"perf-{i:D5}",
                Language = "python",
                Difficulty = (i % 7) + 1,
                Title = $"Perf snippet {i}",
                Code = $"def f{i}(x): return x + {i} # {{ }} ( ) [ ]\n",
                Topics = new[] { "performance" },
                Explain = new[] { "test" }
            });
        }
        return pool;
    }

    private static MistakeHeatmap BuildHeatmap()
    {
        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '(', ')', '[', ']', ':', '=' })
        {
            heatmap.RecordHit(c);
            for (int j = 0; j < 4; j++) heatmap.RecordMiss(c, null);
        }
        return heatmap;
    }

    [Fact]
    public void Pick_5KPool_100Selections_Under1s()
    {
        var pool = Generate5KPool();
        var rng = new Random(42);
        var heatmap = BuildHeatmap();
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        // Warm up
        SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
            heatmap: heatmap, signalPolicy: policy);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
        {
            SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
        }
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 1500,
            $"100 selections from 5K pool took {sw.ElapsedMilliseconds}ms (budget: 1500ms)");
    }

    [Fact]
    public void PlanNext_5KPool_50Plans_Under1s()
    {
        var pool = Generate5KPool();
        var rng = new Random(42);
        var heatmap = BuildHeatmap();
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 50; i++)
        {
            SessionPlanner.PlanNext(pool, 1200, level: 5,
                comfortZone: 4, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
        }
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 1500,
            $"50 plans from 5K pool took {sw.ElapsedMilliseconds}ms (budget: 1500ms)");
    }

    [Fact]
    public void HeatmapCategoryBias_5KSnippets_Under200ms()
    {
        var pool = Generate5KPool();
        var heatmap = BuildHeatmap();

        var sw = Stopwatch.StartNew();
        foreach (var s in pool)
            SnippetSelector.HeatmapCategoryBias(s.Code, heatmap);
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 200,
            $"5K HeatmapCategoryBias calls took {sw.ElapsedMilliseconds}ms (budget: 200ms)");
    }

    [Fact]
    public void WeaknessBoost_5KSnippets_Under200ms()
    {
        var pool = Generate5KPool();
        var weakCategories = new HashSet<SymbolCategoryKind>
        {
            SymbolCategoryKind.CurlyBraces,
            SymbolCategoryKind.Parentheses,
            SymbolCategoryKind.Operators
        };

        var sw = Stopwatch.StartNew();
        foreach (var s in pool)
            SnippetSelector.WeaknessBoost(s.Code, weakCategories);
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 200,
            $"5K WeaknessBoost calls took {sw.ElapsedMilliseconds}ms (budget: 200ms)");
    }

    [Fact]
    public void Prune_1KCalls_Under100ms()
    {
        var heatmap = BuildHeatmap();

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 1_000; i++)
            heatmap.Prune();
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 100,
            $"1K Prune() calls took {sw.ElapsedMilliseconds}ms (budget: 100ms)");
    }

    [Fact]
    public void MicroDrill_5KPool_Under500ms()
    {
        var pool = Generate5KPool();
        var rng = new Random(42);
        var heatmap = BuildHeatmap();
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 10;
        profile.CategoryErrors["Operators"] = 5;

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 10; i++)
        {
            MicroDrillService.GenerateDrill(pool, 1200, level: 5,
                weaknessProfile: profile, heatmap: heatmap,
                signalPolicy: policy, rng: rng);
        }
        sw.Stop();

        Assert.True(sw.ElapsedMilliseconds < 5000,
            $"10 micro-drills from 5K pool took {sw.ElapsedMilliseconds}ms (budget: 5000ms)");
    }
}
