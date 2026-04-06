using System.Reflection;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Proves that SelectionExplanation, ExplanationBuilder, and ReasonFormatter
/// are display-only and never affect engine behavior.
/// </summary>
public class ExplanationInvariantTests
{
    // --- SelectionExplanation is init-only ---

    [Fact]
    public void SelectionExplanation_PropertiesAreInitOnly()
    {
        var props = typeof(SelectionExplanation).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        foreach (var prop in props)
        {
            var setter = prop.GetSetMethod(nonPublic: true);
            if (setter == null) continue;

            var returnMods = setter.ReturnParameter.GetRequiredCustomModifiers();
            Assert.Contains(returnMods, t => t.Name == "IsExternalInit");
        }
    }

    // --- ExplanationBuilder never modifies inputs ---

    [Fact]
    public void ExplanationBuilder_NeverModifiesPlan()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            ComfortZone = 4,
            Reason = "Practicing at D4"
        };

        var snippet = SnippetFixtures.AtDifficulty(4);
        ExplanationBuilder.Build(plan, snippet);

        Assert.Equal(MixCategory.Target, plan.Category);
        Assert.Equal(4, plan.TargetDifficulty);
        Assert.Equal(4, plan.ActualDifficulty);
        Assert.Equal(4, plan.ComfortZone);
        Assert.Equal("Practicing at D4", plan.Reason);
    }

    [Fact]
    public void ExplanationBuilder_NeverModifiesSnippet()
    {
        var snippet = SnippetFixtures.AtDifficulty(5);
        var originalId = snippet.Id;
        var originalDifficulty = snippet.Difficulty;
        var originalCode = snippet.Code;

        var plan = new SessionPlan
        {
            Category = MixCategory.Stretch,
            TargetDifficulty = 5,
            ActualDifficulty = 5,
            Reason = "Stretching to D5"
        };

        ExplanationBuilder.Build(plan, snippet,
            new HashSet<SymbolCategoryKind> { SymbolCategoryKind.Operators },
            SymbolCategoryKind.Parentheses);

        Assert.Equal(originalId, snippet.Id);
        Assert.Equal(originalDifficulty, snippet.Difficulty);
        Assert.Equal(originalCode, snippet.Code);
    }

    // --- ReasonFormatter never modifies plan ---

    [Fact]
    public void ReasonFormatter_NeverModifiesPlan()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Review,
            TargetDifficulty = 3,
            ActualDifficulty = 3,
            ComfortZone = 4,
            Reason = "Reinforcing D3 mastery"
        };

        ReasonFormatter.Format(plan);

        Assert.Equal(MixCategory.Review, plan.Category);
        Assert.Equal(3, plan.TargetDifficulty);
        Assert.Equal("Reinforcing D3 mastery", plan.Reason);
    }

    // --- Engines never read SelectionExplanation ---

    [Fact]
    public void RatingEngine_NeverReadsSelectionExplanation()
    {
        var method = typeof(RatingEngine).GetMethod("Adjust", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(SelectionExplanation), paramTypes);
    }

    [Fact]
    public void XpEngine_NeverReadsSelectionExplanation()
    {
        var methods = typeof(XpEngine).GetMethods(BindingFlags.Public | BindingFlags.Static);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(SelectionExplanation), paramTypes);
        }
    }

    [Fact]
    public void DifficultyMemory_NeverReadsSelectionExplanation()
    {
        var methods = typeof(DifficultyMemory).GetMethods(BindingFlags.Public | BindingFlags.Instance);
        foreach (var method in methods)
        {
            var paramTypes = method.GetParameters().Select(p => p.ParameterType).ToList();
            Assert.DoesNotContain(typeof(SelectionExplanation), paramTypes);
        }
    }

    [Fact]
    public void SnippetSelector_NeverReadsSelectionExplanation()
    {
        var method = typeof(SnippetSelector).GetMethod("Pick", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(method);
        var paramTypes = method!.GetParameters().Select(p => p.ParameterType).ToList();
        Assert.DoesNotContain(typeof(SelectionExplanation), paramTypes);
    }

    // --- ReasonFormatter format consistency ---

    [Theory]
    [InlineData(MixCategory.Target)]
    [InlineData(MixCategory.Review)]
    [InlineData(MixCategory.Stretch)]
    public void ReasonFormatter_AllCategories_ProduceNonEmptyOutput(MixCategory category)
    {
        var plan = new SessionPlan
        {
            Category = category,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            ComfortZone = 4,
            Reason = $"Test {category}"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.False(string.IsNullOrWhiteSpace(result));
        Assert.Contains("D4", result);
    }

    [Fact]
    public void ReasonFormatter_NoComfortZone_UsesReason()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 3,
            ActualDifficulty = 3,
            Reason = "Establishing comfort zone"
        };

        var result = ReasonFormatter.Format(plan);

        Assert.Contains("Establishing comfort zone", result);
    }
}
