using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class MetricsTests
{
    private readonly MetricCalculator _calc = new();

    [Fact]
    public void SymbolDensityIsZeroWhenNoNonWhitespace()
    {
        var m = _calc.Compute("\n\n\t  ");
        Assert.Equal(0.0f, m.SymbolDensity);
    }

    [Fact]
    public void ComputesIndentDepthFloorColumnsDiv4()
    {
        var text = "    a\n\t\tb\n  c\n";
        var m = _calc.Compute(text);
        Assert.Equal(2, m.MaxIndentDepth);
    }

    [Fact]
    public void LinesCountIsNewlinesPlusOne()
    {
        var m = _calc.Compute("a\n");
        Assert.Equal(2, m.Lines);
    }

    [Fact]
    public void EmptyStringHasOneLine()
    {
        var m = _calc.Compute("");
        Assert.Equal(1, m.Lines);
    }

    [Fact]
    public void CharactersIncludesWhitespace()
    {
        var m = _calc.Compute("ab\n");
        Assert.Equal(3, m.Characters);
    }

    [Fact]
    public void MixedTabsAndSpacesIndent()
    {
        // tab(4) + 4 spaces(4) = 8 columns => depth 2
        var text = "\t    x\n";
        var m = _calc.Compute(text);
        Assert.Equal(2, m.MaxIndentDepth);
    }

    [Fact]
    public void QuotesCountAsSymbols()
    {
        // "a" => 3 non-ws chars, 2 are symbols (" and ")
        var m = _calc.Compute("\"a\"\n");
        // nonWs = 3 (", a, "), sym = 2 (" and ")
        Assert.Equal(2.0f / 3.0f, m.SymbolDensity, 0.001f);
    }

    [Fact]
    public void SingleQuotesCountAsSymbols()
    {
        // 'x' => 3 non-ws chars, 2 are symbols
        var m = _calc.Compute("'x'\n");
        Assert.Equal(2.0f / 3.0f, m.SymbolDensity, 0.001f);
    }

    [Fact]
    public void EmptyLinesDoNotAffectMaxIndentDepth()
    {
        var text = "        a\n\n    b\n";
        var m = _calc.Compute(text);
        Assert.Equal(2, m.MaxIndentDepth); // 8 spaces = depth 2
    }
}
