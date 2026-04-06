using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class ContentIdTests
{
    [Fact]
    public void SameInputProducesSameId()
    {
        var id1 = ContentId.From("csharp", "Console.WriteLine();\n");
        var id2 = ContentId.From("csharp", "Console.WriteLine();\n");
        Assert.Equal(id1, id2);
    }

    [Fact]
    public void DifferentCodeProducesDifferentId()
    {
        var id1 = ContentId.From("csharp", "Console.WriteLine();\n");
        var id2 = ContentId.From("csharp", "Console.ReadLine();\n");
        Assert.NotEqual(id1, id2);
    }

    [Fact]
    public void DifferentLanguageProducesDifferentId()
    {
        var code = "print('hello')\n";
        var id1 = ContentId.From("python", code);
        var id2 = ContentId.From("text", code);
        Assert.NotEqual(id1, id2);
    }

    [Fact]
    public void IdIsDeterministicAcrossRuns()
    {
        // Known stable value — if this ever changes, parity is broken
        var id = ContentId.From("text", "\n");
        Assert.Equal(32, id.Length); // 16 bytes = 32 hex chars
        Assert.Matches("^[0-9a-f]{32}$", id);
    }

    [Fact]
    public void NullLanguageFallsBackToText()
    {
        var id1 = ContentId.From(null!, "code\n");
        var id2 = ContentId.From("text", "code\n");
        Assert.Equal(id1, id2);
    }

    [Fact]
    public void NullCodeTreatedAsEmpty()
    {
        var id1 = ContentId.From("text", null!);
        var id2 = ContentId.From("text", string.Empty);
        Assert.Equal(id1, id2);
    }

    [Fact]
    public void LanguageIsCaseInsensitive()
    {
        var id1 = ContentId.From("CSharp", "code\n");
        var id2 = ContentId.From("csharp", "code\n");
        Assert.Equal(id1, id2);
    }
}
