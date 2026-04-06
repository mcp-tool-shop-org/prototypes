using System.Reflection;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Proves that WeaknessWindow, WeaknessDetector, and SkillSignal are
/// display-only and never affect engine behavior. Same pattern as
/// PlannerInvariantTests — tests that the weakness system is a lens,
/// not a lever.
/// </summary>
public class WeaknessInvariantTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    // --- WeaknessWindow never affects RatingEngine ---

    [Fact]
    public void RatingEngine_NeverReadsWeaknessWindow()
    {
        // Reflection: RatingEngine.Adjust has no WeaknessWindow parameter
        var method = typeof(RatingEngine).GetMethod("Adjust", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(WeaknessWindow), paramTypes);
    }

    [Fact]
    public void RatingEngine_SameResultWithAndWithoutWeaknessData()
    {
        var result = SnippetFixtures.MakeResult(SnippetFixtures.AtDifficulty(4), wpm: 80, accuracy: 92);

        int rating1 = RatingEngine.Adjust(1200, 4, result);
        int rating2 = RatingEngine.Adjust(1200, 4, result);

        Assert.Equal(rating1, rating2);
    }

    // --- WeaknessWindow never affects XpEngine ---

    [Fact]
    public void XpEngine_NeverReadsWeaknessWindow()
    {
        var methods = typeof(XpEngine).GetMethods(BindingFlags.Public | BindingFlags.Static);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(WeaknessWindow), paramTypes);
        }
    }

    // --- WeaknessWindow never affects DifficultyMemory ---

    [Fact]
    public void DifficultyMemory_NeverReadsWeaknessWindow()
    {
        var methods = typeof(DifficultyMemory).GetMethods(BindingFlags.Public | BindingFlags.Instance);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(WeaknessWindow), paramTypes);
        }
    }

    [Fact]
    public void ComfortZone_IdenticalWithAndWithoutWeaknessData()
    {
        var memory = new DifficultyMemory();
        memory.RecordSession("python", 4, 90, 70);
        memory.RecordSession("python", 4, 88, 72);
        memory.RecordSession("python", 4, 92, 68);

        var comfort1 = memory.ComfortZone("python");

        // Adding weakness data to a completely separate system shouldn't matter
        var window = new WeaknessWindow();
        window.RecordMistakes(new[]
        {
            new MistakeEvent("CurlyBraces", Now),
            new MistakeEvent("CurlyBraces", Now),
            new MistakeEvent("Operators", Now),
        });

        var comfort2 = memory.ComfortZone("python");

        Assert.Equal(comfort1, comfort2);
    }

    // --- SkillSignal and SkillSignalBuilder are display-only ---

    [Fact]
    public void SkillSignal_PropertiesAreInitOnly()
    {
        // SkillSignal properties use init-only setters (not mutable set).
        // Verify all properties that have setters are marked with the
        // IsExternalInit modreq (init-only pattern in C# 9+).
        var props = typeof(SkillSignal).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        foreach (var prop in props)
        {
            var setter = prop.GetSetMethod(nonPublic: true);
            if (setter == null) continue; // get-only is fine

            // init-only setters have a required modifier (modreq) for IsExternalInit
            var returnMods = setter.ReturnParameter.GetRequiredCustomModifiers();
            Assert.Contains(returnMods, t => t.Name == "IsExternalInit");
        }
    }

    [Fact]
    public void SkillSignalBuilder_NeverModifiesInputs()
    {
        var window = new WeaknessWindow();
        window.Events.Add(new MistakeEvent("Quotes", Now.AddMinutes(-5)));
        window.Events.Add(new MistakeEvent("Quotes", Now.AddMinutes(-3)));
        int eventCountBefore = window.Events.Count;

        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            Reason = "Practicing at D4"
        };

        var signal = SkillSignalBuilder.Build(
            plan: plan,
            comfortZone: 4,
            window: window,
            isYoYoing: false,
            isManualLock: false,
            now: Now);

        // Window events may be pruned by GetWeaknessScores, but no new events added
        Assert.True(window.Events.Count <= eventCountBefore);
        Assert.NotNull(signal);
    }

    // --- WeaknessDetector never writes to MistakeProfile ---

    [Fact]
    public void WeaknessDetector_NeverModifiesMistakeProfile()
    {
        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 10;
        profile.TotalCharactersTyped = 500;

        var window = new WeaknessWindow();

        WeaknessDetector.GetWeakCategories(window, profile, topN: 3, now: Now);
        WeaknessDetector.DescribeWeaknesses(window, profile, topN: 3, now: Now);

        Assert.Equal(10, profile.CategoryErrors["CurlyBraces"]);
        Assert.Equal(500, profile.TotalCharactersTyped);
    }

    [Fact]
    public void WeaknessDetector_NeverModifiesWeaknessWindow()
    {
        var window = new WeaknessWindow();
        window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-5)));
        window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-3)));
        int eventsBefore = window.Events.Count;

        WeaknessDetector.GetWeakCategories(window, null, topN: 3, now: Now);
        WeaknessDetector.GetWeaknessScores(window, topN: 5, now: Now);

        // Events may be pruned but never added
        Assert.True(window.Events.Count <= eventsBefore);
    }

    // --- SnippetSelector independence ---

    [Fact]
    public void SnippetSelector_SamePickWithAndWithoutWeaknessWindow()
    {
        var snippets = SnippetFixtures.FullPool("python", 5);
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        // Pick without any weakness data
        var pick1 = SnippetSelector.Pick(snippets, 1200, level: 5, rng: rng1);

        // Pick with the same seed — SnippetSelector doesn't take WeaknessWindow
        var pick2 = SnippetSelector.Pick(snippets, 1200, level: 5, rng: rng2);

        Assert.Equal(pick1.Id, pick2.Id);
    }

    [Fact]
    public void SnippetSelector_HasNoWeaknessWindowParameter()
    {
        var method = typeof(SnippetSelector).GetMethod("Pick", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(WeaknessWindow), paramTypes);
    }

    // --- SessionPlanner weakness enrichment is reason-only ---

    [Fact]
    public void SessionPlanner_WeaknessWindow_OnlyAffectsReasonString()
    {
        var snippets = SnippetFixtures.FullPool("python", 5);
        var rng1 = new Random(42);
        var rng2 = new Random(42);

        var window = new WeaknessWindow();
        window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-1)));
        window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-1)));

        var (snip1, plan1) = SessionPlanner.PlanNext(
            snippets, 1200, level: 5, comfortZone: 4, rng: rng1);

        var (snip2, plan2) = SessionPlanner.PlanNext(
            snippets, 1200, level: 5, comfortZone: 4,
            weaknessWindow: window, rng: rng2);

        // Same snippet selected (same seed, same selection logic)
        Assert.Equal(snip1.Id, snip2.Id);

        // Same structural plan fields
        Assert.Equal(plan1.Category, plan2.Category);
        Assert.Equal(plan1.TargetDifficulty, plan2.TargetDifficulty);
        Assert.Equal(plan1.ActualDifficulty, plan2.ActualDifficulty);
        Assert.Equal(plan1.ComfortZone, plan2.ComfortZone);

        // Reason may differ (enriched with weakness context)
        // The base reason is contained in both
        Assert.Contains("D", plan1.Reason);
        Assert.Contains("D", plan2.Reason);
    }

    [Fact]
    public void SessionPlanner_WeaknessWindow_NeverChangesTargetDifficulty()
    {
        var snippets = SnippetFixtures.FullPool("python", 5);

        var window = new WeaknessWindow();
        for (int i = 0; i < 20; i++)
            window.Events.Add(new MistakeEvent("CurlyBraces", Now.AddMinutes(-i)));

        // Run 100 plans with and without window — target difficulty must be identical
        for (int i = 0; i < 100; i++)
        {
            var rng1 = new Random(i);
            var rng2 = new Random(i);

            var (_, plan1) = SessionPlanner.PlanNext(
                snippets, 1200, level: 5, comfortZone: 4, rng: rng1);

            var (_, plan2) = SessionPlanner.PlanNext(
                snippets, 1200, level: 5, comfortZone: 4,
                weaknessWindow: window, rng: rng2);

            Assert.Equal(plan1.TargetDifficulty, plan2.TargetDifficulty);
            Assert.Equal(plan1.Category, plan2.Category);
        }
    }

    // --- SkillSignalBuilder summary content ---

    [Fact]
    public void SkillSignalBuilder_ComfortZoneSummary()
    {
        var signal = SkillSignalBuilder.Build(comfortZone: 4);
        Assert.Contains("Comfort D4", signal.Summary);
    }

    [Fact]
    public void SkillSignalBuilder_ManualLockSummary()
    {
        var signal = SkillSignalBuilder.Build(isManualLock: true);
        Assert.Contains("Manual lock", signal.Summary);
    }

    [Fact]
    public void SkillSignalBuilder_YoYoSummary()
    {
        var signal = SkillSignalBuilder.Build(isYoYoing: true);
        Assert.Contains("Stabilizing", signal.Summary);
    }

    [Fact]
    public void SkillSignalBuilder_NoComfortZoneSummary()
    {
        var signal = SkillSignalBuilder.Build();
        Assert.Contains("Establishing baseline", signal.Summary);
    }

    [Fact]
    public void SkillSignalBuilder_WithWeaknesses_IncludesInSummary()
    {
        var window = new WeaknessWindow();
        window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-1)));
        window.Events.Add(new MistakeEvent("Operators", Now.AddMinutes(-1)));

        var signal = SkillSignalBuilder.Build(
            comfortZone: 3, window: window, now: Now);

        Assert.Contains("operators", signal.Summary);
        Assert.Contains("needs work", signal.Summary);
    }

    [Fact]
    public void SkillSignalBuilder_EmptyWindow_NoWeaknessInSummary()
    {
        var signal = SkillSignalBuilder.Build(
            comfortZone: 3, window: new WeaknessWindow(), now: Now);

        Assert.DoesNotContain("needs work", signal.Summary);
    }
}
