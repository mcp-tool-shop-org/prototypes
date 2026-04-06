using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class DefaultExtractorTests
{
    private readonly DefaultExtractor _extractor = new();

    private static RawContent MakeRaw(string text, string title = "test")
        => new(Path: null, LanguageHint: null, Title: title, Text: text, Source: "user", Origin: null);

    [Fact]
    public void SmallFileReturnsSingleUnit()
    {
        var text = new string('x', 100);
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        Assert.Single(units);
        Assert.Equal(text, units[0].Text);
    }

    [Fact]
    public void FileAtThresholdReturnsSingleUnit()
    {
        var text = new string('x', 4000);
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        Assert.Single(units);
    }

    [Fact]
    public void LargeFileSplitsByBlankLines()
    {
        // 3 blocks of 1500 chars each = 4504 total (> 4000 threshold)
        var block = new string('a', 1500);
        var text = $"{block}\n\n{block}\n\n{block}";
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        Assert.Equal(3, units.Count);
    }

    [Fact]
    public void BlocksSmallerThanMinAreSkipped()
    {
        var small = new string('a', 50);   // below 200 min
        var good = new string('b', 500);   // within range
        var text = $"{small}\n\n{good}\n\n{small}\n\n{good}";
        // total > 4000? Let's make sure: 50 + 2 + 500 + 2 + 50 + 2 + 500 = 1106, not > 4000
        // Need total > 4000 to trigger block extraction
        var padding = new string('c', 3000);
        text = $"{small}\n\n{good}\n\n{small}\n\n{good}\n\n{padding}";
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        // good blocks (500) kept, small (50) skipped, padding (3000) > 2000 so skipped
        Assert.Equal(2, units.Count);
    }

    [Fact]
    public void BlocksLargerThanMaxAreSkipped()
    {
        var big = new string('a', 2500);   // above 2000 max
        var good = new string('b', 500);   // within range
        var text = $"{big}\n\n{good}\n\n{big}";
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        Assert.Single(units);
        Assert.Contains("b", units[0].Text);
    }

    [Fact]
    public void FallbackToWholeFileWhenNoBlocksQualify()
    {
        // All blocks outside 200..2000 range
        var tiny = new string('a', 10);
        var huge = new string('b', 2500);
        var text = $"{tiny}\n\n{huge}\n\n{tiny}\n\n{huge}";
        var units = _extractor.Extract(MakeRaw(text)).ToList();
        Assert.Single(units);
        Assert.Equal(text, units[0].Text); // fallback = whole file
    }

    [Fact]
    public void PreservesTitleFromInput()
    {
        var units = _extractor.Extract(MakeRaw("hello", "MyTitle")).ToList();
        Assert.Equal("MyTitle", units[0].Title);
    }

    [Fact]
    public void NullTextTreatedAsEmpty()
    {
        var raw = new RawContent(null, null, "test", null!, "user", null);
        var units = _extractor.Extract(raw).ToList();
        Assert.Single(units);
        Assert.Equal(string.Empty, units[0].Text);
    }
}
