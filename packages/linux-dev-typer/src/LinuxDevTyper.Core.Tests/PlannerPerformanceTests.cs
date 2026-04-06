using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Performance tests ensuring the SessionPlanner can handle large pools
/// and rapid planning without degradation.
/// </summary>
public class PlannerPerformanceTests
{
    [Fact]
    public void Plan1000Sessions_FromLargePool_Under2s()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 100); // 700 snippets
        var rng = new Random(42);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 1000; i++)
        {
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 2000,
            $"1000 plans from 700-snippet pool took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void Plan5000Sessions_FromStandardPool_Under5s()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5); // 35 snippets
        var rng = new Random(42);
        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 10;
        profile.TotalCharactersTyped = 5000;

        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 5000; i++)
        {
            SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4,
                weaknessProfile: profile, rng: rng);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 5000,
            $"5000 plans with weakness profile took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void PlanAcross5Languages_Under1s()
    {
        var languages = new[] { "python", "rust", "javascript", "csharp", "go" };
        var pools = languages.Select(l => SnippetFixtures.FullPool(l, perBand: 10)).ToList();
        var rng = new Random(42);

        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 500; i++)
        {
            foreach (var pool in pools)
            {
                SessionPlanner.PlanNext(pool, 1200, level: 5, comfortZone: 4, rng: rng);
            }
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"2500 plans across 5 languages took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void CategoryChoice_IsConstantTime()
    {
        var rng = new Random(42);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 100_000; i++)
        {
            SessionPlanner.ChooseCategory(rng);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 500,
            $"100K category choices took {sw.ElapsedMilliseconds}ms");
    }
}
