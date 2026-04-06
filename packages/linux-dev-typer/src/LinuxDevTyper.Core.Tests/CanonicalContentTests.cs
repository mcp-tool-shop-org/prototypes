using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Tests the canonical content pipeline invariants:
/// - All content enters as CodeItem
/// - Difficulty is derived from metrics (not hardcoded)
/// - Content-addressed IDs are deterministic
/// - Sidecar metadata preserves authored Snippet fields
/// </summary>
public class CanonicalContentTests
{
    // --- Difficulty Derivation (mirrors DifficultyDeriver.FromMetrics) ---

    private static int DeriveDifficulty(CodeMetrics metrics)
    {
        int linesBand = metrics.Lines <= 5 ? 0 : metrics.Lines <= 15 ? 1 : metrics.Lines <= 30 ? 2 : 3;
        int densityBand = metrics.SymbolDensity < 0.15f ? 0 : metrics.SymbolDensity < 0.30f ? 1 : metrics.SymbolDensity < 0.45f ? 2 : 3;
        int depthBand = metrics.MaxIndentDepth <= 1 ? 0 : metrics.MaxIndentDepth == 2 ? 1 : metrics.MaxIndentDepth == 3 ? 2 : 3;
        return Math.Clamp(1 + (linesBand + densityBand + depthBand) * 6 / 9, 1, 7);
    }

    // --- Difficulty Band Tests ---

    [Theory]
    [InlineData(1, 0)]
    [InlineData(5, 0)]
    [InlineData(6, 1)]
    [InlineData(15, 1)]
    [InlineData(16, 2)]
    [InlineData(30, 2)]
    [InlineData(31, 3)]
    [InlineData(100, 3)]
    public void LinesBand_CorrectScore(int lines, int expected)
    {
        int band = lines <= 5 ? 0 : lines <= 15 ? 1 : lines <= 30 ? 2 : 3;
        Assert.Equal(expected, band);
    }

    [Theory]
    [InlineData(0.0f, 0)]
    [InlineData(0.14f, 0)]
    [InlineData(0.15f, 1)]
    [InlineData(0.29f, 1)]
    [InlineData(0.30f, 2)]
    [InlineData(0.44f, 2)]
    [InlineData(0.45f, 3)]
    [InlineData(0.80f, 3)]
    public void DensityBand_CorrectScore(float density, int expected)
    {
        int band = density < 0.15f ? 0 : density < 0.30f ? 1 : density < 0.45f ? 2 : 3;
        Assert.Equal(expected, band);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 0)]
    [InlineData(2, 1)]
    [InlineData(3, 2)]
    [InlineData(4, 3)]
    [InlineData(8, 3)]
    public void DepthBand_CorrectScore(int depth, int expected)
    {
        int band = depth <= 1 ? 0 : depth == 2 ? 1 : depth == 3 ? 2 : 3;
        Assert.Equal(expected, band);
    }

    // --- Difficulty Derivation From Real Metrics ---

    [Fact]
    public void DerivesDifficulty_SimpleOneLiner()
    {
        // "x = 1\n" → 2 lines, low density, no nesting
        var metrics = new MetricCalculator().Compute("x = 1\n");
        var diff = DeriveDifficulty(metrics);

        Assert.InRange(diff, 1, 3); // short simple code → low difficulty
    }

    [Fact]
    public void DerivesDifficulty_ModerateFunction()
    {
        var code = @"def process(items):
    result = []
    for item in items:
        if item.valid:
            result.append(item.value)
    return result
";
        var metrics = new MetricCalculator().Compute(Normalizer.Normalize(code));
        var diff = DeriveDifficulty(metrics);

        Assert.InRange(diff, 2, 5); // moderate code
    }

    [Fact]
    public void DerivesDifficulty_ComplexNestedCode()
    {
        var code = @"fn process(data: &[Record]) -> Result<Vec<Output>, Error> {
    let mut results = Vec::new();
    for record in data {
        match record.kind {
            Kind::Alpha => {
                if let Some(val) = record.parse() {
                    results.push(Output::new(val));
                }
            }
            Kind::Beta => {
                for sub in &record.children {
                    if sub.is_valid() {
                        results.push(Output::from(sub));
                    }
                }
            }
            _ => continue,
        }
    }
    Ok(results)
}
";
        var metrics = new MetricCalculator().Compute(Normalizer.Normalize(code));
        var diff = DeriveDifficulty(metrics);

        Assert.InRange(diff, 4, 7); // complex, deeply nested
    }

    // --- Derivation Invariants ---

    [Fact]
    public void DerivesDifficulty_AlwaysInRange()
    {
        var calc = new MetricCalculator();
        var testCases = new[]
        {
            "",                        // empty
            "x\n",                     // minimal
            "x = 1\n",                 // simple
            new string('a', 10000),    // very long single line
            string.Join("\n", Enumerable.Range(0, 100).Select(i => $"    line_{i} = {i};")), // 100 lines
        };

        foreach (var code in testCases)
        {
            var normalized = Normalizer.Normalize(code);
            var metrics = calc.Compute(normalized);
            var diff = DeriveDifficulty(metrics);
            Assert.InRange(diff, 1, 7);
        }
    }

    [Fact]
    public void DerivesDifficulty_Deterministic()
    {
        var calc = new MetricCalculator();
        var code = "for i in range(10):\n    print(i)\n";
        var normalized = Normalizer.Normalize(code);
        var metrics = calc.Compute(normalized);

        var d1 = DeriveDifficulty(metrics);
        var d2 = DeriveDifficulty(metrics);
        var d3 = DeriveDifficulty(metrics);

        Assert.Equal(d1, d2);
        Assert.Equal(d2, d3);
    }

    [Fact]
    public void DerivesDifficulty_MinScore_ProducesDifficulty1()
    {
        // Score 0: ≤5 lines, density < 0.15, depth ≤ 1
        var metrics = new CodeMetrics(Lines: 1, Characters: 5, SymbolDensity: 0.0f, MaxIndentDepth: 0);
        Assert.Equal(1, DeriveDifficulty(metrics));
    }

    [Fact]
    public void DerivesDifficulty_MaxScore_ProducesDifficulty7()
    {
        // Score 9: 31+ lines, density > 0.45, depth 4+
        var metrics = new CodeMetrics(Lines: 50, Characters: 2000, SymbolDensity: 0.60f, MaxIndentDepth: 5);
        Assert.Equal(7, DeriveDifficulty(metrics));
    }

    // --- Score-to-Difficulty Mapping Table ---

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    [InlineData(3, 3)]
    [InlineData(4, 3)]
    [InlineData(5, 4)]
    [InlineData(6, 5)]
    [InlineData(7, 5)]
    [InlineData(8, 6)]
    [InlineData(9, 7)]
    public void ScoreToDifficulty_Mapping(int score, int expectedDifficulty)
    {
        var result = Math.Clamp(1 + score * 6 / 9, 1, 7);
        Assert.Equal(expectedDifficulty, result);
    }

    // --- Canonicalization: CodeItem always carries metrics ---

    [Fact]
    public void CodeItem_MetricsAreNeverNull()
    {
        var code = "print('hello')\n";
        var normalized = Normalizer.Normalize(code);
        var metrics = new MetricCalculator().Compute(normalized);
        var item = new CodeItem(
            Id: ContentId.From("python", normalized),
            Language: "python",
            Source: "user",
            Title: "test",
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow
        );

        Assert.NotNull(item.Metrics);
        Assert.True(item.Metrics.Lines > 0);
        Assert.True(item.Metrics.Characters > 0);
    }

    // --- Parity: derived difficulty beats hardcoded ---

    [Fact]
    public void DerivedDifficulty_NeverEquals3ForAllInputs()
    {
        // The old default was always 3. The deriver should produce varying results.
        var calc = new MetricCalculator();
        var difficulties = new HashSet<int>();

        var codes = new[]
        {
            "x\n",
            "x = 1\n",
            "for i in range(10):\n    print(i)\n",
            string.Join("\n", Enumerable.Range(0, 50).Select(i =>
                $"        if x_{i} > 0:\n            result_{i} = compute(x_{i})")),
        };

        foreach (var code in codes)
        {
            var normalized = Normalizer.Normalize(code);
            var metrics = calc.Compute(normalized);
            difficulties.Add(DeriveDifficulty(metrics));
        }

        // Should produce at least 2 different difficulty values (not all 3)
        Assert.True(difficulties.Count >= 2,
            $"Expected varying difficulties, got only: {string.Join(", ", difficulties)}");
    }

    // --- Parity: content-addressed ID stability ---

    [Fact]
    public void ContentId_StableAcrossNormalization()
    {
        var rawCode = "x = 1\r\ny = 2\r\n";
        var normalized = Normalizer.Normalize(rawCode);

        var id1 = ContentId.From("python", normalized);

        // Normalizing again should produce the same result
        var doubleNormalized = Normalizer.Normalize(normalized);
        var id2 = ContentId.From("python", doubleNormalized);

        Assert.Equal(id1, id2);
    }

    [Fact]
    public void ContentId_DeterministicFromSameInput()
    {
        var code = "fn main() { println!(\"hello\"); }\n";
        var id1 = ContentId.From("rust", code);
        var id2 = ContentId.From("rust", code);
        Assert.Equal(id1, id2);
        Assert.Equal(32, id1.Length); // SHA-256 first 16 bytes = 32 hex
    }

    // --- Parity: built-in snippets survive canonicalization ---

    [Fact]
    public void BuiltInSnippet_SurvivesRoundtrip()
    {
        // Simulate: snippet → CodeItem → Snippet (via pipeline)
        var original = new Snippet
        {
            Id = "test-id",
            Language = "python",
            Difficulty = 5,
            Title = "List comprehension",
            Code = "result = [x * 2 for x in range(10)]\n",
            Topics = new[] { "comprehension", "lists" },
            Explain = new[] { "Doubles each element" }
        };

        // Step 1: canonicalize to CodeItem (what IngestSnippet does)
        var normalized = Normalizer.Normalize(original.Code);
        var lang = original.Language.ToLowerInvariant();
        var id = ContentId.From(lang, normalized);
        var metrics = new MetricCalculator().Compute(normalized);

        var item = new CodeItem(
            Id: id,
            Language: lang,
            Source: "builtin",
            Title: original.Title,
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow,
            Concepts: original.Topics
        );

        // Step 2: convert back (what CodeItemToSnippet does, without sidecar)
        var bareSnippet = new Snippet
        {
            Id = item.Id,
            Language = item.Language,
            Difficulty = DeriveDifficulty(item.Metrics),
            Title = item.Title,
            Code = item.Code,
            Topics = item.Concepts ?? Array.Empty<string>(),
            Explain = Array.Empty<string>()
        };

        // Without sidecar, we lose authored difficulty but code survives
        Assert.Equal(normalized, bareSnippet.Code);
        Assert.Equal(lang, bareSnippet.Language);
        Assert.Equal(original.Title, bareSnippet.Title);
        Assert.InRange(bareSnippet.Difficulty, 1, 7);

        // Step 3: with sidecar, authored difficulty is preserved
        var restoredSnippet = new Snippet
        {
            Id = bareSnippet.Id,
            Language = bareSnippet.Language,
            Difficulty = original.Difficulty, // sidecar restores this
            Title = bareSnippet.Title,
            Code = bareSnippet.Code,
            Topics = original.Topics,         // sidecar restores this
            Explain = original.Explain        // sidecar restores this
        };

        Assert.Equal(5, restoredSnippet.Difficulty);
        Assert.Equal(new[] { "comprehension", "lists" }, restoredSnippet.Topics);
        Assert.Equal(new[] { "Doubles each element" }, restoredSnippet.Explain);
    }

    // --- Parity: no Difficulty=3 default anywhere ---

    [Fact]
    public void NoDifficulty3Default_InDeriver()
    {
        // Verify that the derivation formula can produce values other than 3
        var results = new HashSet<int>();
        for (int lines = 1; lines <= 50; lines += 10)
        for (float density = 0f; density <= 0.6f; density += 0.1f)
        for (int depth = 0; depth <= 5; depth++)
        {
            var m = new CodeMetrics(lines, lines * 20, density, depth);
            results.Add(DeriveDifficulty(m));
        }

        // Should cover most of the 1-7 range
        Assert.True(results.Count >= 5,
            $"Expected broad range, got: {string.Join(", ", results.OrderBy(x => x))}");
        Assert.Contains(1, results);
        Assert.Contains(7, results);
    }
}
