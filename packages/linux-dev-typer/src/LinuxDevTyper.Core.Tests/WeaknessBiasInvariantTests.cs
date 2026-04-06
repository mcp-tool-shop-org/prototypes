using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Proves that WeaknessBias (HeatmapBias) is bounded, deterministic,
/// and never changes difficulty band selection. The bias is a weight
/// adjustment inside an already-filtered candidate set — a nudge, not
/// a redirect.
/// </summary>
public class WeaknessBiasInvariantTests
{
    // --- Band never changes because of bias ---

    [Fact]
    public void HeatmapBias_NeverChangesCandidateBand()
    {
        // Create pool with clear band separation
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        // Heavy heatmap data favoring characters found in D7 snippets
        var heatmap = new MistakeHeatmap();
        // Record many misses on symbols common in complex code
        foreach (char c in new[] { '{', '}', '[', ']', '(', ')', ':', '_' })
        {
            for (int i = 0; i < 2; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 8; i++) heatmap.RecordMiss(c, null);
        }

        var policy = new SignalPolicy();
        policy.EnableGuidedMode(); // Bias active

        var rng = new Random(42);

        // Target difficulty 3 (rating 1200, level 5 -> target 3, window ±1 -> D2-D4)
        var difficulties = new HashSet<int>();
        for (int i = 0; i < 100; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
            difficulties.Add(snippet.Difficulty);
        }

        // All picks must be within the standard difficulty window (target 3, ±1 = D2-D4)
        Assert.All(difficulties, d => Assert.InRange(d, 2, 4));
        // Bias must NOT pull picks out to D5, D6, or D7
        Assert.DoesNotContain(5, difficulties);
        Assert.DoesNotContain(6, difficulties);
        Assert.DoesNotContain(7, difficulties);
    }

    [Fact]
    public void HeatmapBias_NeverPullsSnippetsBelowBand()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        // Weak on simple chars that appear in D1 (x = 42)
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 2; i++) heatmap.RecordHit('x');
        for (int i = 0; i < 8; i++) heatmap.RecordMiss('x', null);
        for (int i = 0; i < 2; i++) heatmap.RecordHit('=');
        for (int i = 0; i < 8; i++) heatmap.RecordMiss('=', null);

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var rng = new Random(99);

        // Target difficulty 5 (rating 1500+)
        var difficulties = new HashSet<int>();
        for (int i = 0; i < 100; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1600, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
            difficulties.Add(snippet.Difficulty);
        }

        // Standard window: target 5, ±1 -> D4-D6
        Assert.All(difficulties, d => Assert.InRange(d, 4, 6));
        // Must not be pulled down to D1 or D2 despite weak chars there
        Assert.DoesNotContain(1, difficulties);
        Assert.DoesNotContain(2, difficulties);
    }

    // --- Bias only affects ordering inside eligible candidate set ---

    [Fact]
    public void HeatmapBias_OnlyAffectsWeightNotCandidacy()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 10);

        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '(' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        // Collect picks with bias on
        var biasedPicks = new Dictionary<string, int>();
        var rng = new Random(42);
        for (int i = 0; i < 200; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
            biasedPicks.TryGetValue(snippet.Id, out int count);
            biasedPicks[snippet.Id] = count + 1;
        }

        // Collect picks without bias (same difficulty window)
        var unbiasedPicks = new Dictionary<string, int>();
        rng = new Random(42);
        for (int i = 0; i < 200; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng);
            unbiasedPicks.TryGetValue(snippet.Id, out int count);
            unbiasedPicks[snippet.Id] = count + 1;
        }

        // Both runs draw from the same candidate pool (same difficulties appear)
        var biasedDifficulties = biasedPicks.Keys
            .Select(id => pool.First(s => s.Id == id).Difficulty).Distinct().OrderBy(d => d).ToList();
        var unbiasedDifficulties = unbiasedPicks.Keys
            .Select(id => pool.First(s => s.Id == id).Difficulty).Distinct().OrderBy(d => d).ToList();

        Assert.Equal(unbiasedDifficulties, biasedDifficulties);
    }

    // --- Same inputs, same outputs (deterministic with seed) ---

    [Fact]
    public void HeatmapBias_DeterministicWithSeed()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 3; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 7; i++) heatmap.RecordMiss('{', '[');

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var picks1 = new List<string>();
        var picks2 = new List<string>();

        var rng1 = new Random(123);
        var rng2 = new Random(123);

        for (int i = 0; i < 50; i++)
        {
            var s1 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng1,
                heatmap: heatmap, signalPolicy: policy);
            var s2 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng2,
                heatmap: heatmap, signalPolicy: policy);
            picks1.Add(s1.Id);
            picks2.Add(s2.Id);
        }

        Assert.Equal(picks1, picks2);
    }

    [Fact]
    public void SessionPlanner_DeterministicWithBias()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 2; i++) heatmap.RecordHit('(');
        for (int i = 0; i < 8; i++) heatmap.RecordMiss('(', ')');

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var picks1 = new List<string>();
        var picks2 = new List<string>();

        var rng1 = new Random(777);
        var rng2 = new Random(777);

        for (int i = 0; i < 30; i++)
        {
            var (s1, _) = SessionPlanner.PlanNext(pool, 1200, level: 5,
                comfortZone: 4, rng: rng1, heatmap: heatmap, signalPolicy: policy);
            var (s2, _) = SessionPlanner.PlanNext(pool, 1200, level: 5,
                comfortZone: 4, rng: rng2, heatmap: heatmap, signalPolicy: policy);
            picks1.Add(s1.Id);
            picks2.Add(s2.Id);
        }

        Assert.Equal(picks1, picks2);
    }

    // --- HeatmapBias is capped at +3 ---

    [Fact]
    public void HeatmapBias_CappedAtThree()
    {
        // Code containing 5+ distinct weak characters
        string code = "def foo(x): return {x: [x]}";

        var heatmap = new MistakeHeatmap();
        // Make many characters weak
        foreach (char c in new[] { '(', ')', '{', '}', '[', ']', ':', ' ' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(3, bias); // Capped at 3 despite 6+ weak chars present
    }

    [Fact]
    public void HeatmapBias_ZeroWhenNoWeakChars()
    {
        string code = "x = 42";
        var heatmap = new MistakeHeatmap();
        // Record only hits (no weakness)
        foreach (char c in code)
        {
            for (int i = 0; i < 10; i++) heatmap.RecordHit(c);
        }

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(0, bias);
    }

    [Fact]
    public void HeatmapBias_ZeroWithEmptyHeatmap()
    {
        string code = "def foo(): pass";
        var heatmap = new MistakeHeatmap();

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(0, bias);
    }

    [Fact]
    public void HeatmapBias_ZeroWithEmptyCode()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordMiss('{', null);

        Assert.Equal(0, SnippetSelector.HeatmapBias("", heatmap));
        Assert.Equal(0, SnippetSelector.HeatmapBias(null!, heatmap));
    }

    [Fact]
    public void HeatmapBias_CountsDistinctCharsOnly()
    {
        // Code with many '{' but only one distinct weak char
        string code = "{{{{{{{{{{";

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 2; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 8; i++) heatmap.RecordMiss('{', null);

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(1, bias); // Only 1 distinct weak char
    }

    [Fact]
    public void HeatmapBias_IgnoresBelowThreshold()
    {
        // Character with 10% error rate (below 15% threshold)
        string code = "def foo():";
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 9; i++) heatmap.RecordHit('(');
        heatmap.RecordMiss('(', ')'); // 1/10 = 10%

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(0, bias);
    }

    [Fact]
    public void HeatmapBias_IgnoresBelowMinAttempts()
    {
        // Character with high error rate but too few attempts
        string code = "def foo():";
        var heatmap = new MistakeHeatmap();
        heatmap.RecordMiss('(', ')'); // 1/1 = 100% but only 1 attempt (min is 5)

        int bias = SnippetSelector.HeatmapBias(code, heatmap);
        Assert.Equal(0, bias);
    }

    // --- Policy off = identical to v0.9 (no heatmap influence) ---

    [Fact]
    public void PolicyOff_PlannerIdenticalToV09()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        // Build a heavily loaded heatmap
        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '[', ']', '(', ')', ':', '_', '=', '+' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        var policyOff = new SignalPolicy(); // GuidedMode = false (default)

        // v0.9 behavior: no heatmap, no policy
        var v09Picks = new List<string>();
        var rng1 = new Random(42);
        for (int i = 0; i < 50; i++)
        {
            var (snip, _) = SessionPlanner.PlanNext(pool, 1200, level: 5,
                comfortZone: 4, rng: rng1);
            v09Picks.Add(snip.Id);
        }

        // v1.0 with policy off: same result as v0.9
        var v10Picks = new List<string>();
        var rng2 = new Random(42);
        for (int i = 0; i < 50; i++)
        {
            var (snip, _) = SessionPlanner.PlanNext(pool, 1200, level: 5,
                comfortZone: 4, rng: rng2, heatmap: heatmap, signalPolicy: policyOff);
            v10Picks.Add(snip.Id);
        }

        Assert.Equal(v09Picks, v10Picks);
    }

    [Fact]
    public void PolicyOff_SelectorIdenticalToV09()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 1; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 9; i++) heatmap.RecordMiss('{', '[');

        var policyOff = new SignalPolicy();

        var v09Picks = new List<string>();
        var v10Picks = new List<string>();
        var rng1 = new Random(99);
        var rng2 = new Random(99);

        for (int i = 0; i < 100; i++)
        {
            var s1 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng1);
            var s2 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng2,
                heatmap: heatmap, signalPolicy: policyOff);
            v09Picks.Add(s1.Id);
            v10Picks.Add(s2.Id);
        }

        Assert.Equal(v09Picks, v10Picks);
    }

    // --- Policy requires both GuidedMode AND SignalsAffectSelection ---

    [Fact]
    public void PolicyRequiresBothFlags_ForBias()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 1; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 9; i++) heatmap.RecordMiss('{', '[');

        // GuidedMode=true but SignalsAffectSelection=false
        var partialPolicy = new SignalPolicy
        {
            GuidedMode = true,
            SignalsAffectSelection = false
        };
        Assert.False(partialPolicy.EffectiveSelectionBias);

        var rng1 = new Random(42);
        var rng2 = new Random(42);

        var noBiasPicks = new List<string>();
        var partialPicks = new List<string>();

        for (int i = 0; i < 50; i++)
        {
            var s1 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng1);
            var s2 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng2,
                heatmap: heatmap, signalPolicy: partialPolicy);
            noBiasPicks.Add(s1.Id);
            partialPicks.Add(s2.Id);
        }

        // Without EffectiveSelectionBias, picks are identical to no-heatmap
        Assert.Equal(noBiasPicks, partialPicks);
    }

    [Fact]
    public void PolicyRequiresBothFlags_SelectionOnlyNotEnough()
    {
        // SignalsAffectSelection=true but GuidedMode=false
        var policy = new SignalPolicy
        {
            GuidedMode = false,
            SignalsAffectSelection = true
        };
        Assert.False(policy.EffectiveSelectionBias);

        var pool = SnippetFixtures.FullPool("python", perBand: 5);
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 1; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 9; i++) heatmap.RecordMiss('{', '[');

        var rng1 = new Random(42);
        var rng2 = new Random(42);

        var noBiasPicks = new List<string>();
        var policyPicks = new List<string>();

        for (int i = 0; i < 50; i++)
        {
            var s1 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng1);
            var s2 = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng2,
                heatmap: heatmap, signalPolicy: policy);
            noBiasPicks.Add(s1.Id);
            policyPicks.Add(s2.Id);
        }

        Assert.Equal(noBiasPicks, policyPicks);
    }

    // --- Null heatmap with policy on is safe ---

    [Fact]
    public void NullHeatmap_WithPolicyOn_NoException()
    {
        var pool = SnippetFixtures.FullPool("python", perBand: 5);

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        var rng = new Random(42);

        // Should not throw — null heatmap is handled gracefully
        for (int i = 0; i < 20; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1200, level: 5, rng: rng,
                heatmap: null, signalPolicy: policy);
            Assert.NotNull(snippet);
        }
    }

    // --- Bias active produces different distribution (proves it works) ---

    [Fact]
    public void BiasActive_ShiftsDistribution()
    {
        // Create snippets where some have many weak chars and others don't
        var pool = new List<Snippet>();
        // D4 snippets with braces (will get bias boost)
        for (int i = 1; i <= 5; i++)
        {
            pool.Add(new Snippet
            {
                Id = $"braces-{i}",
                Language = "python",
                Difficulty = 4,
                Title = $"Braces snippet {i}",
                Code = $"def foo():\n    return {{{i}: [{i}]}}\n",
                Topics = new[] { "test" },
                Explain = new[] { "test" }
            });
        }
        // D4 snippets without braces (no bias boost)
        for (int i = 1; i <= 5; i++)
        {
            pool.Add(new Snippet
            {
                Id = $"nobraces-{i}",
                Language = "python",
                Difficulty = 4,
                Title = $"Simple snippet {i}",
                Code = $"x = {i} + {i}\nprint(x)\n",
                Topics = new[] { "test" },
                Explain = new[] { "test" }
            });
        }

        // Make braces weak
        var heatmap = new MistakeHeatmap();
        foreach (char c in new[] { '{', '}', '[', ']' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        // With bias: should prefer braces snippets
        int bracesCount = 0;
        var rng = new Random(42);
        for (int i = 0; i < 200; i++)
        {
            var snippet = SnippetSelector.Pick(pool, 1300, level: 5,
                suggestedDifficulty: 4, rng: rng,
                heatmap: heatmap, signalPolicy: policy);
            if (snippet.Id.StartsWith("braces-")) bracesCount++;
        }

        // With bias, braces snippets should be picked more often
        // Base: 50/50 = 100. With +3 bias, expect significantly more.
        Assert.True(bracesCount > 120, $"Expected bias to favor braces snippets, got {bracesCount}/200");
    }

    // --- HeatmapCategoryBias invariant tests ---

    [Fact]
    public void HeatmapCategoryBias_CappedAtThree()
    {
        string code = "def foo(x): return {x: [x]} // y += <z>";

        var heatmap = new MistakeHeatmap();
        // Make 5+ categories weak
        foreach (char c in new[] { '{', '(', '[', '<', '=', ':', ';' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        int bias = SnippetSelector.HeatmapCategoryBias(code, heatmap);
        Assert.True(bias <= 3, $"Expected capped at 3, got {bias}");
    }

    [Fact]
    public void HeatmapCategoryBias_RequiresTwoWeakCategories()
    {
        string code = "def foo(): pass";

        // Only one weak category (Parentheses)
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 1; i++) heatmap.RecordHit('(');
        for (int i = 0; i < 9; i++) heatmap.RecordMiss('(', null);
        for (int i = 0; i < 1; i++) heatmap.RecordHit(')');
        for (int i = 0; i < 9; i++) heatmap.RecordMiss(')', null);

        int bias = SnippetSelector.HeatmapCategoryBias(code, heatmap);
        Assert.Equal(0, bias); // Diversity guard: < 2 weak categories
    }

    [Fact]
    public void HeatmapCategoryBias_ZeroWithEmptyHeatmap()
    {
        var heatmap = new MistakeHeatmap();
        Assert.Equal(0, SnippetSelector.HeatmapCategoryBias("def foo(): pass", heatmap));
    }

    [Fact]
    public void HeatmapCategoryBias_ZeroWithEmptyCode()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordMiss('{', null);
        for (int i = 0; i < 10; i++) heatmap.RecordMiss('(', null);

        Assert.Equal(0, SnippetSelector.HeatmapCategoryBias("", heatmap));
    }

    [Fact]
    public void HeatmapCategoryBias_ActivatesWithTwoWeakCategories()
    {
        string code = "if (x) { return; }";

        var heatmap = new MistakeHeatmap();
        // Weak on Parentheses and CurlyBraces (2 categories)
        foreach (char c in new[] { '(', ')', '{', '}' })
        {
            for (int i = 0; i < 1; i++) heatmap.RecordHit(c);
            for (int i = 0; i < 9; i++) heatmap.RecordMiss(c, null);
        }

        int bias = SnippetSelector.HeatmapCategoryBias(code, heatmap);
        Assert.True(bias >= 1, $"Expected positive bias with 2+ weak categories, got {bias}");
    }

    [Fact]
    public void HeatmapCategoryBias_IgnoresBelowThreshold()
    {
        string code = "if (x) { return; }";

        var heatmap = new MistakeHeatmap();
        // Low error rate (5%) on both categories — below 10% threshold
        foreach (char c in new[] { '(', ')', '{', '}' })
        {
            for (int i = 0; i < 19; i++) heatmap.RecordHit(c);
            heatmap.RecordMiss(c, null); // 1/20 = 5%
        }

        int bias = SnippetSelector.HeatmapCategoryBias(code, heatmap);
        Assert.Equal(0, bias);
    }
}
