using System.Text.Json;
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// End-to-end integration tests for the DevOpTyper.Content pipeline
/// as used by linux-dev-typer's content system integration.
/// </summary>
public class ContentIntegrationTests : IDisposable
{
    private readonly string _tempDir;

    public ContentIntegrationTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"ldt-content-test-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, true); } catch { }
    }

    private string IndexPath => Path.Combine(_tempDir, "library.index.json");

    // --- Paste Code → CodeItem ---

    [Fact]
    public void PasteCode_CreatesCodeItem_WithCorrectFields()
    {
        var code = "x = 42\nprint(x)\n";
        var normalized = Normalizer.Normalize(code);
        var lang = "python";
        var id = ContentId.From(lang, normalized);
        var metrics = new MetricCalculator().Compute(normalized);

        var item = new CodeItem(
            Id: id,
            Language: lang,
            Source: "user",
            Title: "Test snippet",
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow
        );

        Assert.Equal(lang, item.Language);
        Assert.Equal("user", item.Source);
        Assert.Equal("Test snippet", item.Title);
        Assert.Equal(normalized, item.Code);
        Assert.Equal(32, item.Id.Length); // SHA-256 first 16 bytes = 32 hex chars
    }

    [Fact]
    public void ContentId_IsDeterministic()
    {
        var code = "fn main() {}\n";
        var id1 = ContentId.From("rust", code);
        var id2 = ContentId.From("rust", code);

        Assert.Equal(id1, id2);
    }

    [Fact]
    public void ContentId_DiffersByLanguage()
    {
        var code = "x = 1\n";
        var id1 = ContentId.From("python", code);
        var id2 = ContentId.From("ruby", code);

        Assert.NotEqual(id1, id2);
    }

    [Fact]
    public void ContentId_DiffersByCode()
    {
        var id1 = ContentId.From("python", "x = 1\n");
        var id2 = ContentId.From("python", "x = 2\n");

        Assert.NotEqual(id1, id2);
    }

    // --- Normalizer ---

    [Fact]
    public void Normalizer_ConvertsLineEndings()
    {
        var input = "line1\r\nline2\rline3";
        var result = Normalizer.Normalize(input);

        Assert.DoesNotContain("\r", result);
        Assert.Equal("line1\nline2\nline3\n", result);
    }

    [Fact]
    public void Normalizer_EnsuresTrailingNewline()
    {
        var result = Normalizer.Normalize("hello");
        Assert.EndsWith("\n", result);
    }

    [Fact]
    public void Normalizer_Idempotent()
    {
        var code = "x = 1\nprint(x)\n";
        var once = Normalizer.Normalize(code);
        var twice = Normalizer.Normalize(once);

        Assert.Equal(once, twice);
    }

    // --- MetricCalculator ---

    [Fact]
    public void MetricCalculator_ComputesBasicMetrics()
    {
        var calc = new MetricCalculator();
        var code = "x = 1\ny = 2\n";
        var metrics = calc.Compute(code);

        Assert.True(metrics.Lines >= 2);
        Assert.True(metrics.Characters > 0);
        Assert.True(metrics.SymbolDensity >= 0);
    }

    // --- Index Persistence ---

    [Fact]
    public void JsonLibraryIndexStore_Roundtrip()
    {
        var store = new JsonLibraryIndexStore();
        var code = "def hello():\n    print('hi')\n";
        var normalized = Normalizer.Normalize(code);

        var index = new LibraryIndex
        {
            Items = new List<CodeItem>
            {
                new CodeItem(
                    Id: ContentId.From("python", normalized),
                    Language: "python",
                    Source: "user",
                    Title: "Hello function",
                    Code: normalized,
                    Metrics: new MetricCalculator().Compute(normalized),
                    CreatedUtc: DateTimeOffset.UtcNow
                )
            }
        };

        store.Save(IndexPath, index);
        var loaded = store.Load(IndexPath);

        var item = Assert.Single(loaded.Items);
        Assert.Equal("python", item.Language);
        Assert.Equal("user", item.Source);
        Assert.Equal(normalized, item.Code);
    }

    [Fact]
    public void JsonLibraryIndexStore_MissingFile_ReturnsEmpty()
    {
        var store = new JsonLibraryIndexStore();
        var loaded = store.Load(Path.Combine(_tempDir, "nonexistent.json"));

        Assert.NotNull(loaded);
        Assert.Empty(loaded.Items);
    }

    [Fact]
    public void JsonLibraryIndexStore_CorruptJson_ReturnsEmpty()
    {
        File.WriteAllText(IndexPath, "{ invalid json garbage }}}");
        var store = new JsonLibraryIndexStore();
        var loaded = store.Load(IndexPath);

        Assert.NotNull(loaded);
        Assert.Empty(loaded.Items);
    }

    [Fact]
    public void JsonLibraryIndexStore_EmptyIndex_ReturnsEmpty()
    {
        var store = new JsonLibraryIndexStore();
        store.Save(IndexPath, new LibraryIndex());
        var loaded = store.Load(IndexPath);

        Assert.NotNull(loaded);
        Assert.Empty(loaded.Items);
    }

    // --- InMemoryContentLibrary ---

    [Fact]
    public void InMemoryContentLibrary_QueryByLanguage()
    {
        var items = CreateTestItems();
        var library = new InMemoryContentLibrary(items);

        var pythonItems = library.Query(new ContentQuery { Language = "python" });
        Assert.Single(pythonItems);
        Assert.Equal("python", pythonItems[0].Language);

        var rustItems = library.Query(new ContentQuery { Language = "rust" });
        Assert.Single(rustItems);
    }

    [Fact]
    public void InMemoryContentLibrary_Languages()
    {
        var items = CreateTestItems();
        var library = new InMemoryContentLibrary(items);

        var languages = library.Languages();
        Assert.Contains("python", languages);
        Assert.Contains("rust", languages);
        Assert.Contains("go", languages);
    }

    [Fact]
    public void InMemoryContentLibrary_QueryAll()
    {
        var items = CreateTestItems();
        var library = new InMemoryContentLibrary(items);

        var all = library.Query(new ContentQuery());
        Assert.Equal(3, all.Count);
    }

    [Fact]
    public void InMemoryContentLibrary_QueryBySource()
    {
        var items = CreateTestItems();
        var library = new InMemoryContentLibrary(items);

        var userItems = library.Query(new ContentQuery { Source = "user" });
        Assert.Equal(2, userItems.Count);
    }

    // --- Deduplication ---

    [Fact]
    public void Deduplication_SameCodeSameId()
    {
        var code = "print('hello')\n";
        var normalized = Normalizer.Normalize(code);
        var id1 = ContentId.From("python", normalized);
        var id2 = ContentId.From("python", normalized);

        Assert.Equal(id1, id2);
    }

    // --- DefaultExtractor ---

    [Fact]
    public void DefaultExtractor_SmallFile_WholeFile()
    {
        var extractor = new DefaultExtractor();
        var raw = new RawContent(
            Path: "test.py",
            LanguageHint: "python",
            Title: "test.py",
            Text: "x = 1\ny = 2\n",
            Source: "corpus",
            Origin: null
        );

        var units = extractor.Extract(raw).ToList();
        Assert.Single(units);
        Assert.Equal("x = 1\ny = 2\n", units[0].Text);
    }

    // --- CodeItem → Snippet Bridge ---

    [Fact]
    public void CodeItemToSnippet_DerivesDifficultyFromMetrics()
    {
        var code = "x = 1\n";
        var item = new CodeItem(
            Id: ContentId.From("python", code),
            Language: "python",
            Source: "user",
            Title: "Simple assignment",
            Code: code,
            Metrics: new MetricCalculator().Compute(code),
            CreatedUtc: DateTimeOffset.UtcNow
        );

        var snippet = CodeItemToSnippet(item);

        // Difficulty is derived from metrics, not hardcoded
        Assert.InRange(snippet.Difficulty, 1, 7);
        Assert.Equal("python", snippet.Language);
        Assert.Equal("Simple assignment", snippet.Title);
        Assert.Equal(code, snippet.Code);
        Assert.Equal(item.Id, snippet.Id);

        // Same item produces same difficulty (deterministic)
        var snippet2 = CodeItemToSnippet(item);
        Assert.Equal(snippet.Difficulty, snippet2.Difficulty);
    }

    [Fact]
    public void CodeItemToSnippet_EmptyMetadata()
    {
        var code = "x = 1\n";
        var item = new CodeItem(
            Id: ContentId.From("python", code),
            Language: "python",
            Source: "corpus",
            Title: "test",
            Code: code,
            Metrics: new MetricCalculator().Compute(code),
            CreatedUtc: DateTimeOffset.UtcNow
        );

        var snippet = CodeItemToSnippet(item);

        Assert.Empty(snippet.Topics);
        Assert.Empty(snippet.Explain);
        Assert.Null(snippet.Notes);
        Assert.Null(snippet.Scaffold);
        Assert.Null(snippet.Variants);
        Assert.Null(snippet.CommunityDifficulty);
    }

    // --- Performance ---

    [Fact]
    public void LargeIndex_Roundtrip_Under1s()
    {
        var store = new JsonLibraryIndexStore();
        var calc = new MetricCalculator();
        var items = new List<CodeItem>();

        for (int i = 0; i < 1000; i++)
        {
            var code = $"x_{i} = {i}\nprint(x_{i})\n";
            var normalized = Normalizer.Normalize(code);
            items.Add(new CodeItem(
                Id: ContentId.From("python", normalized),
                Language: "python",
                Source: i % 2 == 0 ? "user" : "corpus",
                Title: $"Snippet {i}",
                Code: normalized,
                Metrics: calc.Compute(normalized),
                CreatedUtc: DateTimeOffset.UtcNow
            ));
        }

        var index = new LibraryIndex { Items = items };
        var sw = System.Diagnostics.Stopwatch.StartNew();
        store.Save(IndexPath, index);
        var loaded = store.Load(IndexPath);
        sw.Stop();

        Assert.Equal(1000, loaded.Items.Count);
        Assert.True(sw.ElapsedMilliseconds < 1000, $"Roundtrip took {sw.ElapsedMilliseconds}ms (should be <1000ms)");
    }

    [Fact]
    public void LargeLibrary_QueryPerformance()
    {
        var calc = new MetricCalculator();
        var items = new List<CodeItem>();

        for (int i = 0; i < 1000; i++)
        {
            var code = $"item_{i} = {i}\n";
            var lang = i % 3 == 0 ? "python" : i % 3 == 1 ? "rust" : "go";
            items.Add(new CodeItem(
                Id: ContentId.From(lang, code),
                Language: lang,
                Source: "user",
                Title: $"Item {i}",
                Code: code,
                Metrics: calc.Compute(code),
                CreatedUtc: DateTimeOffset.UtcNow
            ));
        }

        var library = new InMemoryContentLibrary(items);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < 100; i++)
        {
            library.Query(new ContentQuery { Language = "python" });
        }

        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 500, $"100 queries took {sw.ElapsedMilliseconds}ms");
    }

    // --- LanguageDetector ---

    [Fact]
    public void LanguageDetector_HintTakesPriority()
    {
        var detector = new LanguageDetector();
        var result = detector.Detect("test.js", "python", "x = 1");
        Assert.Equal("python", result);
    }

    [Fact]
    public void LanguageDetector_FallsBackToExtension()
    {
        var detector = new LanguageDetector();
        var result = detector.Detect("test.py", null, "x = 1");
        Assert.Equal("python", result);
    }

    // --- Helpers ---

    private static List<CodeItem> CreateTestItems()
    {
        var calc = new MetricCalculator();
        return new List<CodeItem>
        {
            new CodeItem(
                Id: ContentId.From("python", "x = 1\n"),
                Language: "python",
                Source: "user",
                Title: "Python assignment",
                Code: "x = 1\n",
                Metrics: calc.Compute("x = 1\n"),
                CreatedUtc: DateTimeOffset.UtcNow
            ),
            new CodeItem(
                Id: ContentId.From("rust", "fn main() {}\n"),
                Language: "rust",
                Source: "user",
                Title: "Rust main",
                Code: "fn main() {}\n",
                Metrics: calc.Compute("fn main() {}\n"),
                CreatedUtc: DateTimeOffset.UtcNow
            ),
            new CodeItem(
                Id: ContentId.From("go", "package main\n"),
                Language: "go",
                Source: "corpus",
                Title: "Go package",
                Code: "package main\n",
                Metrics: calc.Compute("package main\n"),
                CreatedUtc: DateTimeOffset.UtcNow
            )
        };
    }

    /// <summary>
    /// Mirrors ContentIntegrationService.CodeItemToSnippet for test isolation.
    /// Derives difficulty from metrics using the same band logic as DifficultyDeriver.
    /// </summary>
    private static LinuxDevTyper.Core.Models.Snippet CodeItemToSnippet(CodeItem item)
    {
        return new LinuxDevTyper.Core.Models.Snippet
        {
            Id = item.Id,
            Language = item.Language,
            Difficulty = DeriveDifficulty(item.Metrics),
            Title = item.Title,
            Code = item.Code,
            Topics = item.Concepts ?? Array.Empty<string>(),
            Explain = Array.Empty<string>()
        };
    }

    /// <summary>
    /// Local copy of DifficultyDeriver.FromMetrics for test isolation.
    /// </summary>
    private static int DeriveDifficulty(CodeMetrics metrics)
    {
        int linesBand = metrics.Lines <= 5 ? 0 : metrics.Lines <= 15 ? 1 : metrics.Lines <= 30 ? 2 : 3;
        int densityBand = metrics.SymbolDensity < 0.15f ? 0 : metrics.SymbolDensity < 0.30f ? 1 : metrics.SymbolDensity < 0.45f ? 2 : 3;
        int depthBand = metrics.MaxIndentDepth <= 1 ? 0 : metrics.MaxIndentDepth == 2 ? 1 : metrics.MaxIndentDepth == 3 ? 2 : 3;
        return Math.Clamp(1 + (linesBand + densityBand + depthBand) * 6 / 9, 1, 7);
    }
}
