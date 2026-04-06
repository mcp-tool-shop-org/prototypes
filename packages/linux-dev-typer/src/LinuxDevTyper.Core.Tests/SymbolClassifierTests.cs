using LinuxDevTyper.Core.Mistakes;

namespace LinuxDevTyper.Core.Tests;

public class SymbolClassifierTests
{
    [Theory]
    [InlineData('{', SymbolCategoryKind.CurlyBraces)]
    [InlineData('}', SymbolCategoryKind.CurlyBraces)]
    public void CurlyBraces_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));

    [Theory]
    [InlineData('(', SymbolCategoryKind.Parentheses)]
    [InlineData(')', SymbolCategoryKind.Parentheses)]
    public void Parentheses_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));

    [Theory]
    [InlineData('"', SymbolCategoryKind.Quotes)]
    [InlineData('\'', SymbolCategoryKind.Quotes)]
    [InlineData('`', SymbolCategoryKind.Quotes)]
    public void Quotes_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));

    [Theory]
    [InlineData('=', SymbolCategoryKind.Operators)]
    [InlineData('!', SymbolCategoryKind.Operators)]
    [InlineData('+', SymbolCategoryKind.Operators)]
    public void Operators_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));

    [Theory]
    [InlineData('a', SymbolCategoryKind.Alphanumeric)]
    [InlineData('Z', SymbolCategoryKind.Alphanumeric)]
    [InlineData('5', SymbolCategoryKind.Alphanumeric)]
    public void Alphanumeric_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));

    [Theory]
    [InlineData(' ', SymbolCategoryKind.Whitespace)]
    [InlineData('\t', SymbolCategoryKind.Whitespace)]
    public void Whitespace_Classified(char c, SymbolCategoryKind expected)
        => Assert.Equal(expected, SymbolClassifier.Classify(c));
}
