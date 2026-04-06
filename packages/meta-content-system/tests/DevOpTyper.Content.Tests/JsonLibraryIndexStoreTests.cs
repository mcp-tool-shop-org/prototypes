using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class JsonLibraryIndexStoreTests : IDisposable
{
    private readonly string _tempDir;
    private readonly JsonLibraryIndexStore _store = new();

    public JsonLibraryIndexStoreTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "devop_content_tests_" + Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, recursive: true);
    }

    private string TempFile(string name = "test.json") => Path.Combine(_tempDir, name);

    [Fact]
    public void SavePopulatesStats()
    {
        var index = new LibraryIndex
        {
            Items = new List<CodeItem>
            {
                new("id1", "python", "corpus", "a.py", "x = 1\n",
                    new CodeMetrics(2, 6, 0.1f, 0), DateTimeOffset.UtcNow),
                new("id2", "csharp", "user", "b.cs", "class X {}\n",
                    new CodeMetrics(2, 11, 0.3f, 0), DateTimeOffset.UtcNow),
            }
        };

        var path = TempFile();
        _store.Save(path, index);

        Assert.NotNull(index.Stats);
        Assert.Equal(2, index.Stats!.TotalItems);
        Assert.Contains("csharp", index.Stats.Languages);
        Assert.Contains("python", index.Stats.Languages);
    }

    [Fact]
    public void SaveThenLoadRoundTrips()
    {
        var index = new LibraryIndex
        {
            Items = new List<CodeItem>
            {
                new("id1", "python", "corpus", "a.py", "x = 1\n",
                    new CodeMetrics(2, 6, 0.1f, 0), DateTimeOffset.UtcNow),
            }
        };

        var path = TempFile();
        _store.Save(path, index);
        var loaded = _store.Load(path);

        Assert.Single(loaded.Items);
        Assert.Equal("id1", loaded.Items[0].Id);
        Assert.Equal("python", loaded.Items[0].Language);
    }

    [Fact]
    public void LoadMissingFileReturnsEmptyIndex()
    {
        var loaded = _store.Load(TempFile("nonexistent.json"));
        Assert.NotNull(loaded);
        Assert.Empty(loaded.Items);
    }

    [Fact]
    public void LoadCorruptJsonReturnsEmptyIndex()
    {
        var path = TempFile();
        File.WriteAllText(path, "NOT VALID JSON {{{{");
        var loaded = _store.Load(path);
        Assert.NotNull(loaded);
        Assert.Empty(loaded.Items);
    }

    [Fact]
    public void SaveCreatesDirectoryIfNeeded()
    {
        var path = Path.Combine(_tempDir, "subdir", "deep", "index.json");
        var index = new LibraryIndex();
        _store.Save(path, index);
        Assert.True(File.Exists(path));
    }
}
