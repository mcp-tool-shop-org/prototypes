using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

public class ExplanationBuilderTests
{
    // --- Category factor ---

    [Fact]
    public void Build_TargetCategory_IncludesWorkingLevelFactor()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4, comfortZone: 4);
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("working level"));
        Assert.Equal(MixCategory.Target, explanation.Category);
    }

    [Fact]
    public void Build_ReviewCategory_IncludesReinforcingFactor()
    {
        var plan = MakePlan(MixCategory.Review, 3, 3, comfortZone: 4);
        var snippet = SnippetFixtures.AtDifficulty(3);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("reinforcing"));
    }

    [Fact]
    public void Build_StretchCategory_IncludesGrowthFactor()
    {
        var plan = MakePlan(MixCategory.Stretch, 5, 5, comfortZone: 4);
        var snippet = SnippetFixtures.AtDifficulty(5);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("growth"));
    }

    // --- Difficulty factor ---

    [Fact]
    public void Build_ExactDifficultyMatch_ShowsExactMatch()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4);
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("exact match"));
    }

    [Fact]
    public void Build_DifficultyMismatch_ShowsTargetedInfo()
    {
        var plan = MakePlan(MixCategory.Target, 4, 3);
        var snippet = SnippetFixtures.AtDifficulty(3);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("targeted D4"));
    }

    // --- Weakness factor ---

    [Fact]
    public void Build_WithWeaknessBoost_SetsWeaknessInfluenced()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4);
        // Snippet code contains braces { }
        var snippet = new Snippet
        {
            Id = "test-weak",
            Language = "python",
            Difficulty = 4,
            Code = "def foo():\n    x = {1, 2}\n    return x\n",
            Topics = new[] { "test" },
            Explain = new[] { "test" }
        };

        var weakCategories = new HashSet<SymbolCategoryKind> { SymbolCategoryKind.CurlyBraces };

        var explanation = ExplanationBuilder.Build(plan, snippet, weakCategories);

        Assert.True(explanation.WeaknessInfluenced);
        Assert.Contains(explanation.Factors, f => f.Contains("weak spot"));
        Assert.Contains(explanation.Factors, f => f.Contains("braces"));
    }

    [Fact]
    public void Build_NoWeaknessBoost_WeaknessInfluencedFalse()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4);
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.False(explanation.WeaknessInfluenced);
    }

    [Fact]
    public void Build_WeakCategoriesNotInCode_WeaknessInfluencedFalse()
    {
        var plan = MakePlan(MixCategory.Target, 1, 1);
        // D1 snippet is "x = 42\n" — no angle brackets
        var snippet = SnippetFixtures.AtDifficulty(1);

        var weakCategories = new HashSet<SymbolCategoryKind> { SymbolCategoryKind.AngleBrackets };

        var explanation = ExplanationBuilder.Build(plan, snippet, weakCategories);

        Assert.False(explanation.WeaknessInfluenced);
    }

    // --- Focus factor ---

    [Fact]
    public void Build_WithFocusBoost_SetsFocusInfluenced()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4);
        var snippet = new Snippet
        {
            Id = "test-focus",
            Language = "python",
            Difficulty = 4,
            Code = "result = (a + b) * (c - d)\n",
            Topics = new[] { "test" },
            Explain = new[] { "test" }
        };

        var explanation = ExplanationBuilder.Build(plan, snippet,
            focusCategory: SymbolCategoryKind.Parentheses);

        Assert.True(explanation.FocusInfluenced);
        Assert.Contains(explanation.Factors, f => f.Contains("Focus practice"));
    }

    [Fact]
    public void Build_FocusCategoryNotInCode_FocusInfluencedFalse()
    {
        var plan = MakePlan(MixCategory.Target, 1, 1);
        var snippet = SnippetFixtures.AtDifficulty(1); // "x = 42\n"

        var explanation = ExplanationBuilder.Build(plan, snippet,
            focusCategory: SymbolCategoryKind.CurlyBraces);

        Assert.False(explanation.FocusInfluenced);
    }

    // --- Comfort zone factor ---

    [Fact]
    public void Build_WithComfortZone_IncludesComfortFactor()
    {
        var plan = MakePlan(MixCategory.Target, 4, 4, comfortZone: 4);
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Contains(explanation.Factors, f => f.Contains("Comfort zone: D4"));
    }

    [Fact]
    public void Build_NoComfortZone_NoComfortFactor()
    {
        var plan = MakePlan(MixCategory.Target, 3, 3, comfortZone: null);
        var snippet = SnippetFixtures.AtDifficulty(3);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.DoesNotContain(explanation.Factors, f => f.Contains("Comfort zone"));
    }

    // --- Primary reason ---

    [Fact]
    public void Build_PrimaryReasonFromPlan()
    {
        var plan = new SessionPlan
        {
            Category = MixCategory.Target,
            TargetDifficulty = 4,
            ActualDifficulty = 4,
            Reason = "Practicing at D4 — targeting braces weakness"
        };
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.Equal("Practicing at D4 — targeting braces weakness", explanation.PrimaryReason);
    }

    // --- Factor count ---

    [Fact]
    public void Build_MinimumTwoFactors()
    {
        // Category + difficulty = always at least 2
        var plan = MakePlan(MixCategory.Target, 4, 4);
        var snippet = SnippetFixtures.AtDifficulty(4);

        var explanation = ExplanationBuilder.Build(plan, snippet);

        Assert.True(explanation.Factors.Count >= 2);
    }

    [Fact]
    public void Build_AllFactorsPresent_HasFiveFactors()
    {
        var plan = MakePlan(MixCategory.Review, 3, 3, comfortZone: 4);
        var snippet = new Snippet
        {
            Id = "test-all",
            Language = "python",
            Difficulty = 3,
            Code = "x = {a: (b[0] + c)}\n",
            Topics = new[] { "test" },
            Explain = new[] { "test" }
        };

        var weakCategories = new HashSet<SymbolCategoryKind> { SymbolCategoryKind.CurlyBraces };

        var explanation = ExplanationBuilder.Build(plan, snippet, weakCategories,
            focusCategory: SymbolCategoryKind.Parentheses);

        // category + difficulty + weakness + focus + comfort = 5
        Assert.Equal(5, explanation.Factors.Count);
    }

    // --- Helper ---

    private static SessionPlan MakePlan(MixCategory category, int target, int actual,
        int? comfortZone = null, string reason = "")
    {
        return new SessionPlan
        {
            Category = category,
            TargetDifficulty = target,
            ActualDifficulty = actual,
            ComfortZone = comfortZone,
            Reason = string.IsNullOrEmpty(reason) ? $"Test plan D{target}" : reason
        };
    }
}
