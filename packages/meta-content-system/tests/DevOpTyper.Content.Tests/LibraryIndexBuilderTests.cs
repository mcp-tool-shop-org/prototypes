using System.Runtime.CompilerServices;
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class LibraryIndexBuilderTests
{
    private static LibraryIndexBuilder MakeBuilder()
        => new(new DefaultExtractor(), new MetricCalculator());

    [Fact]
    public async Task BuildsExpectedItemCount()
    {
        var source = new TestSource(
            new RawContent("a.py", null, "a.py", "def foo():\n    pass\n", "corpus", null),
            new RawContent("b.cs", null, "b.cs", "class X {}\n", "corpus", null)
        );

        var index = await MakeBuilder().BuildAsync(source);
        Assert.Equal(2, index.Items.Count);
    }

    [Fact]
    public async Task DedupesByContentId()
    {
        var code = "def foo():\n    pass\n";
        var source = new TestSource(
            new RawContent("a.py", null, "a.py", code, "corpus", null),
            new RawContent("b.py", null, "b.py", code, "corpus", null) // same code, same detected language
        );

        var index = await MakeBuilder().BuildAsync(source);
        Assert.Single(index.Items); // deduplicated
    }

    [Fact]
    public async Task OrdersByLanguageThenTitle()
    {
        var source = new TestSource(
            new RawContent("z.py", null, "z.py", "x = 1\n", "corpus", null),
            new RawContent("a.cs", null, "a.cs", "class A {}\n", "corpus", null),
            new RawContent("b.py", null, "b.py", "y = 2\n", "corpus", null)
        );

        var index = await MakeBuilder().BuildAsync(source);
        Assert.Equal("csharp", index.Items[0].Language);
        Assert.Equal("python", index.Items[1].Language);
        Assert.Equal("python", index.Items[2].Language);
        Assert.True(string.Compare(index.Items[1].Title, index.Items[2].Title, StringComparison.Ordinal) <= 0);
    }

    [Fact]
    public async Task SetsVersionToOne()
    {
        var source = new TestSource(
            new RawContent("a.txt", null, "a.txt", "hello\n", "user", null)
        );

        var index = await MakeBuilder().BuildAsync(source);
        Assert.Equal(1, index.Version);
    }

    [Fact]
    public async Task EmptySourceProducesEmptyIndex()
    {
        var source = new TestSource();
        var index = await MakeBuilder().BuildAsync(source);
        Assert.Empty(index.Items);
    }

    private sealed class TestSource : IContentSource
    {
        private readonly RawContent[] _items;

        public TestSource(params RawContent[] items) => _items = items;

        public async IAsyncEnumerable<RawContent> EnumerateAsync(
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            foreach (var item in _items)
            {
                await Task.Yield();
                yield return item;
            }
        }
    }
}
