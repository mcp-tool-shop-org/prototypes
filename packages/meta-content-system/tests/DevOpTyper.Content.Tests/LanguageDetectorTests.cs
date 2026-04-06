using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class LanguageDetectorTests
{
    [Fact]
    public void UsesHintWhenProvided()
    {
        var d = new LanguageDetector();
        Assert.Equal("python", d.Detect("x.unknown", "python", "whatever"));
    }

    [Fact]
    public void UsesExtensionMapping()
    {
        var d = new LanguageDetector();
        Assert.Equal("csharp", d.Detect("file.cs", null, ""));
    }
}
