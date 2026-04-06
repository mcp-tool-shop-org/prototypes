using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class NormalizationTests
{
    [Fact]
    public void NormalizesLineEndingsToLF()
    {
        var input = "a\r\nb\rc\n";
        var norm = Normalizer.Normalize(input, ensureTrailingNewline: false);
        Assert.Equal("a\nb\nc\n", norm);
    }

    [Fact]
    public void AddsTrailingNewlineWhenEnabled()
    {
        var norm = Normalizer.Normalize("abc", ensureTrailingNewline: true);
        Assert.Equal("abc\n", norm);
    }
}
