using System.Diagnostics;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Performance tests for Phase 4 explanation and signal generation.
/// Ensures ExplanationBuilder, ReasonFormatter, SkillSignalBuilder,
/// and WeaknessDetector perform well under sustained load.
/// </summary>
public class ExplanationPerformanceTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    [Fact]
    public void ExplanationBuilder_10000Builds_Under1s()
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
        var weakCategories = new HashSet<SymbolCategoryKind>
        {
            SymbolCategoryKind.CurlyBraces,
            SymbolCategoryKind.Quotes
        };

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 10_000; i++)
        {
            ExplanationBuilder.Build(plan, snippet, weakCategories, SymbolCategoryKind.Operators);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"10K explanation builds took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void ReasonFormatter_10000Formats_Under500ms()
    {
        var plans = new[]
        {
            new SessionPlan { Category = MixCategory.Target, TargetDifficulty = 4, Reason = "Test", ComfortZone = 4 },
            new SessionPlan { Category = MixCategory.Review, TargetDifficulty = 2, Reason = "Test", ComfortZone = 4 },
            new SessionPlan { Category = MixCategory.Stretch, TargetDifficulty = 6, Reason = "Test", ComfortZone = 4 },
            new SessionPlan { Category = MixCategory.Target, TargetDifficulty = 3, Reason = "No comfort zone" },
        };

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 10_000; i++)
        {
            ReasonFormatter.Format(plans[i % plans.Length]);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 500,
            $"10K reason formats took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void SkillSignalBuilder_5000Builds_Under2s()
    {
        var window = new WeaknessWindow();
        for (int i = 0; i < 50; i++)
            window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-i)));
        for (int i = 0; i < 30; i++)
            window.Events.Add(new MistakeEvent("Quotes", Now.AddMinutes(-i)));

        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            Reason = "Practicing at D4",
            ComfortZone = 4
        };

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 5000; i++)
        {
            SkillSignalBuilder.Build(
                plan: plan, comfortZone: 4,
                window: window, isYoYoing: false,
                isManualLock: false, topN: 5, now: Now);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 2000,
            $"5K skill signal builds took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void WeaknessDetector_10000Detections_Under2s()
    {
        var window = new WeaknessWindow();
        for (int i = 0; i < 100; i++)
        {
            window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-i)));
            window.Events.Add(new MistakeEvent("Quotes", Now.AddMinutes(-i * 2)));
            window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-i * 3)));
        }

        var profile = new MistakeProfile();
        profile.CategoryErrors["Parentheses"] = 20;

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 10_000; i++)
        {
            WeaknessDetector.GetWeakCategories(window, profile, topN: 3, now: Now);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 2000,
            $"10K weakness detections took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void FullExplanationPipeline_1000Cycles_Under3s()
    {
        // Simulate a full pipeline: plan -> explain -> format -> signal
        var pool = SnippetFixtures.FullPool("python", perBand: 10);
        var rng = new Random(42);
        var window = new WeaknessWindow();
        for (int i = 0; i < 30; i++)
            window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-i)));

        var profile = new MistakeProfile();
        profile.CategoryErrors["Quotes"] = 15;

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 1000; i++)
        {
            var (snippet, plan) = SessionPlanner.PlanNext(
                pool, 1200, level: 5, comfortZone: 4,
                weaknessProfile: profile, rng: rng,
                weaknessWindow: window);

            var weakCategories = WeaknessDetector.GetWeakCategories(window, profile, now: Now);
            var explanation = ExplanationBuilder.Build(plan, snippet, weakCategories);
            var reason = ReasonFormatter.Format(plan);
            var signal = SkillSignalBuilder.Build(
                plan: plan, comfortZone: 4, window: window, now: Now);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 3000,
            $"1K full explanation pipeline cycles took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void WeaknessDescribe_10000Descriptions_Under1s()
    {
        var window = new WeaknessWindow();
        for (int i = 0; i < 20; i++)
            window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-i)));
        for (int i = 0; i < 15; i++)
            window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-i)));

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 10_000; i++)
        {
            WeaknessDetector.DescribeWeaknesses(window, null, topN: 3, now: Now);
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"10K weakness descriptions took {sw.ElapsedMilliseconds}ms");
    }
}
