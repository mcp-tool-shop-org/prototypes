using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class MistakeAggregatorTests
{
    [Fact]
    public void Aggregate_CountsByCategory()
    {
        var mistakes = new List<MistakeRecord>
        {
            new(0, '{', 'x', "s1"),
            new(1, '}', 'y', "s1"),
            new(2, '(', 'z', "s1"),
        };

        var agg = MistakeAggregator.Aggregate(mistakes);

        Assert.Equal(2, agg[SymbolCategoryKind.CurlyBraces]);
        Assert.Equal(1, agg[SymbolCategoryKind.Parentheses]);
    }

    [Fact]
    public void TopWeakCategories_ExcludesAlphanumeric()
    {
        var mistakes = new List<MistakeRecord>
        {
            new(0, 'a', 'x', "s1"),
            new(1, 'b', 'y', "s1"),
            new(2, '{', 'z', "s1"),
        };

        var agg = MistakeAggregator.Aggregate(mistakes);
        var top = MistakeAggregator.TopWeakCategories(agg);

        // Should only return CurlyBraces, not Alphanumeric
        Assert.Single(top);
        Assert.Equal(SymbolCategoryKind.CurlyBraces, top[0].Category);
    }

    [Fact]
    public void MistakeProfile_RecordSession_Accumulates()
    {
        var profile = new MistakeProfile();

        var session1 = new List<MistakeRecord>
        {
            new(0, '{', 'x', "s1"),
        };
        profile.RecordSession(session1, 10);

        var session2 = new List<MistakeRecord>
        {
            new(0, '{', 'y', "s2"),
            new(1, '(', 'z', "s2"),
        };
        profile.RecordSession(session2, 15);

        Assert.Equal(25, profile.TotalCharactersTyped);
        Assert.Equal(2, profile.CategoryErrors["CurlyBraces"]);
        Assert.Equal(1, profile.CategoryErrors["Parentheses"]);
    }

    [Fact]
    public void MistakeProfile_GetWeaknesses_RanksCorrectly()
    {
        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 10;
        profile.CategoryErrors["Parentheses"] = 5;
        profile.CategoryErrors["Quotes"] = 8;
        profile.CategoryErrors["Alphanumeric"] = 100; // should be excluded

        var weaknesses = profile.GetWeaknesses(3);

        Assert.Equal(3, weaknesses.Count);
        Assert.Equal("CurlyBraces", weaknesses[0].Category);
        Assert.Equal("Quotes", weaknesses[1].Category);
        Assert.Equal("Parentheses", weaknesses[2].Category);
    }
}
