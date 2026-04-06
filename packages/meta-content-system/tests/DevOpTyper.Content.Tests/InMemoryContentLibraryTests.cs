using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class InMemoryContentLibraryTests
{
    private static readonly CodeItem[] SampleItems = new[]
    {
        new CodeItem("1", "python", "corpus", "a.py", "x = 1\n",
            new CodeMetrics(2, 6, 0.17f, 0), DateTimeOffset.UtcNow),
        new CodeItem("2", "csharp", "user", "b.cs", "class X {}\n",
            new CodeMetrics(2, 11, 0.36f, 0), DateTimeOffset.UtcNow),
        new CodeItem("3", "python", "builtin", "c.py", "for i in range(10):\n    print(i)\n",
            new CodeMetrics(3, 33, 0.25f, 1), DateTimeOffset.UtcNow),
        new CodeItem("4", "javascript", "corpus", "d.js", "const f = () => {};\n",
            new CodeMetrics(2, 20, 0.50f, 0), DateTimeOffset.UtcNow),
    };

    private readonly InMemoryContentLibrary _lib = new(SampleItems);

    [Fact]
    public void QueryAllReturnsEverything()
    {
        var results = _lib.Query(new ContentQuery());
        Assert.Equal(4, results.Count);
    }

    [Fact]
    public void FiltersByLanguage()
    {
        var results = _lib.Query(new ContentQuery { Language = "python" });
        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal("python", r.Language));
    }

    [Fact]
    public void FiltersByLanguageCaseInsensitive()
    {
        var results = _lib.Query(new ContentQuery { Language = "Python" });
        Assert.Equal(2, results.Count);
    }

    [Fact]
    public void FiltersBySource()
    {
        var results = _lib.Query(new ContentQuery { Source = "corpus" });
        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal("corpus", r.Source));
    }

    [Fact]
    public void FiltersByMinLines()
    {
        var results = _lib.Query(new ContentQuery { MinLines = 3 });
        Assert.Single(results);
        Assert.Equal("3", results[0].Id);
    }

    [Fact]
    public void FiltersByMaxLines()
    {
        var results = _lib.Query(new ContentQuery { MaxLines = 2 });
        Assert.Equal(3, results.Count);
    }

    [Fact]
    public void FiltersByMinSymbolDensity()
    {
        var results = _lib.Query(new ContentQuery { MinSymbolDensity = 0.30f });
        Assert.Equal(2, results.Count); // csharp 0.36 + javascript 0.50
    }

    [Fact]
    public void FiltersByMaxSymbolDensity()
    {
        var results = _lib.Query(new ContentQuery { MaxSymbolDensity = 0.20f });
        Assert.Single(results); // python 0.17
    }

    [Fact]
    public void CombinesMultipleFilters()
    {
        var results = _lib.Query(new ContentQuery { Language = "python", Source = "corpus" });
        Assert.Single(results);
        Assert.Equal("1", results[0].Id);
    }

    [Fact]
    public void LanguagesReturnsSortedDistinctList()
    {
        var langs = _lib.Languages();
        Assert.Equal(3, langs.Count);
        Assert.Equal("csharp", langs[0]);
        Assert.Equal("javascript", langs[1]);
        Assert.Equal("python", langs[2]);
    }
}
