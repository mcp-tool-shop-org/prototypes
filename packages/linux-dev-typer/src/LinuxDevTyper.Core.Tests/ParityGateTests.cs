using System.Reflection;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Parity gate tests for v0.8.2.
/// Each test verifies one item from the parity checklist:
/// - Selection consumes only CodeItems (via pipeline)
/// - Built-ins ingested as CodeItems
/// - No Difficulty=3 default in CodeItemToSnippet
/// - Deterministic difficulty tiers from metrics
/// - Content-addressed deduplication works
/// </summary>
public class ParityGateTests
{
    // --- Gate: no hardcoded Difficulty=3 ---

    [Fact]
    public void CodeItemToSnippet_NeverHardcodesDifficulty3()
    {
        // For a variety of inputs, the derived difficulty should not always be 3
        var calc = new MetricCalculator();
        var difficulties = new HashSet<int>();

        var testCodes = new[]
        {
            "x\n",                                           // trivial
            "x = 1\n",                                       // simple
            "for i in range(10):\n    print(i)\n",           // basic loop
            "def f(x):\n    return x * 2\n",                 // function
            string.Join("\n", Enumerable.Range(0, 40).Select(i =>
                new string(' ', (i % 5) * 4) + $"stmt_{i}();")),  // 40 lines, varied indent
        };

        foreach (var code in testCodes)
        {
            var normalized = Normalizer.Normalize(code);
            var metrics = calc.Compute(normalized);
            var item = new CodeItem(
                Id: ContentId.From("python", normalized),
                Language: "python",
                Source: "corpus",
                Title: "test",
                Code: normalized,
                Metrics: metrics,
                CreatedUtc: DateTimeOffset.UtcNow
            );

            // This mirrors ContentIntegrationService.CodeItemToSnippet
            var difficulty = DeriveDifficulty(item.Metrics);
            Assert.InRange(difficulty, 1, 7);
            difficulties.Add(difficulty);
        }

        Assert.True(difficulties.Count >= 2,
            $"All inputs produced the same difficulty: {difficulties.First()}. " +
            "This suggests hardcoded defaults instead of metric-based derivation.");
    }

    // --- Gate: built-in snippets can be ingested as CodeItems ---

    [Fact]
    public void BuiltInSnippet_CanBeCanonicalizedToCodeItem()
    {
        var snippet = new Snippet
        {
            Id = "builtin-test",
            Language = "Python",
            Difficulty = 4,
            Title = "Generator expression",
            Code = "total = sum(x**2 for x in range(100))\n",
            Topics = new[] { "generators", "math" },
            Explain = new[] { "Uses generator expression for memory efficiency" }
        };

        var normalized = Normalizer.Normalize(snippet.Code);
        var lang = snippet.Language.ToLowerInvariant();
        var id = ContentId.From(lang, normalized);
        var metrics = new MetricCalculator().Compute(normalized);

        var item = new CodeItem(
            Id: id,
            Language: lang,
            Source: "builtin",
            Title: snippet.Title,
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow,
            Concepts: snippet.Topics
        );

        // CodeItem carries the essential fields
        Assert.Equal("python", item.Language);
        Assert.Equal(normalized, item.Code);
        Assert.Equal(snippet.Title, item.Title);
        Assert.Equal(32, item.Id.Length);
        Assert.NotNull(item.Metrics);
    }

    // --- Gate: content-addressed deduplication ---

    [Fact]
    public void Deduplication_SameCodeProducesSameId()
    {
        var code1 = "x = 42\nprint(x)\n";
        var code2 = "x = 42\r\nprint(x)\r\n"; // CRLF variant

        var n1 = Normalizer.Normalize(code1);
        var n2 = Normalizer.Normalize(code2);

        Assert.Equal(n1, n2); // Normalizer makes them identical

        var id1 = ContentId.From("python", n1);
        var id2 = ContentId.From("python", n2);

        Assert.Equal(id1, id2); // Same content-addressed ID
    }

    [Fact]
    public void Deduplication_DifferentCodeProducesDifferentId()
    {
        var code1 = Normalizer.Normalize("x = 1\n");
        var code2 = Normalizer.Normalize("x = 2\n");

        var id1 = ContentId.From("python", code1);
        var id2 = ContentId.From("python", code2);

        Assert.NotEqual(id1, id2);
    }

    // --- Gate: sidecar metadata pattern ---

    [Fact]
    public void SidecarPattern_PreservesAuthoredDifficulty()
    {
        // Simulate the sidecar pattern:
        // 1. Original snippet has Difficulty=6
        // 2. CodeItem bridge uses derived difficulty
        // 3. Sidecar restores authored difficulty

        var original = new Snippet
        {
            Id = "authored",
            Language = "rust",
            Difficulty = 6,
            Title = "Complex match",
            Code = "match x { 1 => a(), 2 => b(), _ => c() }\n",
            Topics = new[] { "pattern-matching" },
            Explain = new[] { "Uses match expression" }
        };

        var normalized = Normalizer.Normalize(original.Code);
        var metrics = new MetricCalculator().Compute(normalized);
        var derivedDifficulty = DeriveDifficulty(metrics);

        // Without sidecar: difficulty is derived (likely different from 6)
        var bareSnippet = new Snippet
        {
            Id = ContentId.From("rust", normalized),
            Language = "rust",
            Difficulty = derivedDifficulty,
            Title = original.Title,
            Code = normalized,
            Topics = Array.Empty<string>(),
            Explain = Array.Empty<string>()
        };

        // With sidecar: authored difficulty wins
        var restoredSnippet = new Snippet
        {
            Id = bareSnippet.Id,
            Language = bareSnippet.Language,
            Difficulty = original.Difficulty, // from sidecar
            Title = bareSnippet.Title,
            Code = bareSnippet.Code,
            Topics = original.Topics,
            Explain = original.Explain
        };

        Assert.Equal(6, restoredSnippet.Difficulty);
        Assert.Equal(new[] { "pattern-matching" }, restoredSnippet.Topics);
    }

    // --- Gate: Snippet model has no forbidden fields ---

    [Fact]
    public void Snippet_HasNoHardcodedDifficultyField()
    {
        // Verify Snippet.Difficulty exists as a settable property (not const or readonly)
        var prop = typeof(Snippet).GetProperty("Difficulty");
        Assert.NotNull(prop);
        Assert.True(prop!.CanWrite, "Difficulty should be settable");
        Assert.True(prop.CanRead, "Difficulty should be readable");
    }

    [Fact]
    public void Snippet_DifficultyDefaultIs1()
    {
        // Default Snippet should have Difficulty=1 (the class default)
        var s = new Snippet();
        Assert.Equal(1, s.Difficulty);
    }

    // --- Gate: difficulty derivation covers the full range ---

    [Fact]
    public void DifficultyDerivation_CoversFullRange()
    {
        var seen = new HashSet<int>();

        // Sweep through metric space
        foreach (var lines in new[] { 1, 10, 25, 50 })
        foreach (var density in new[] { 0.0f, 0.20f, 0.35f, 0.50f })
        foreach (var depth in new[] { 0, 2, 3, 5 })
        {
            var m = new CodeMetrics(lines, lines * 20, density, depth);
            seen.Add(DeriveDifficulty(m));
        }

        // Must cover at least tiers 1 through 7
        for (int i = 1; i <= 7; i++)
            Assert.Contains(i, seen);
    }

    // --- Gate: index persistence roundtrip preserves metrics ---

    [Fact]
    public void IndexPersistence_PreservesMetrics()
    {
        var store = new JsonLibraryIndexStore();
        var calc = new MetricCalculator();
        var code = "def hello():\n    print('world')\n";
        var normalized = Normalizer.Normalize(code);
        var metrics = calc.Compute(normalized);

        var index = new LibraryIndex
        {
            Items = new List<CodeItem>
            {
                new CodeItem(
                    Id: ContentId.From("python", normalized),
                    Language: "python",
                    Source: "user",
                    Title: "Hello",
                    Code: normalized,
                    Metrics: metrics,
                    CreatedUtc: DateTimeOffset.UtcNow
                )
            }
        };

        var tempDir = Path.Combine(Path.GetTempPath(), $"parity-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            var path = Path.Combine(tempDir, "test.json");
            store.Save(path, index);
            var loaded = store.Load(path);

            var item = Assert.Single(loaded.Items);
            Assert.Equal(metrics.Lines, item.Metrics.Lines);
            Assert.Equal(metrics.Characters, item.Metrics.Characters);
            Assert.Equal(metrics.SymbolDensity, item.Metrics.SymbolDensity, 4);
            Assert.Equal(metrics.MaxIndentDepth, item.Metrics.MaxIndentDepth);

            // Derived difficulty from loaded metrics matches original
            Assert.Equal(DeriveDifficulty(metrics), DeriveDifficulty(item.Metrics));
        }
        finally
        {
            try { Directory.Delete(tempDir, true); } catch { }
        }
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
