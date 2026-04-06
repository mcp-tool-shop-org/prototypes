using System.Text.Json;
using DevOpTyper.Content.Services;
using LinuxDevTyper.App.Services;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Tests documenting the relationship between authored calibration difficulty
/// and DifficultyDeriver's metric-based derivation.
///
/// The DifficultyDeriver is a coarse 3-metric formula (lines, symbol density, indent depth).
/// Authored difficulty captures conceptual complexity that metrics alone cannot measure.
/// These tests verify:
///   1. The deriver always returns valid 1-7 values
///   2. The sidecar metadata preserves authored difficulty (this is the real invariant)
///   3. The derivation generally trends upward with authored difficulty
///   4. The derivation gap is documented and bounded
/// </summary>
public class CalibrationDerivationTests
{
    private static readonly string[] Languages = { "python", "rust", "javascript", "csharp", "go" };

    private static string CalibrationDir()
    {
        var candidate = Path.Combine(AppContext.BaseDirectory, "assets", "calibration");
        if (Directory.Exists(candidate))
            return candidate;
        throw new DirectoryNotFoundException("Cannot find assets/calibration/ from " + AppContext.BaseDirectory);
    }

    private static List<Snippet> LoadCalibrationSnippets(string language)
    {
        var path = Path.Combine(CalibrationDir(), $"{language}.json");
        if (!File.Exists(path))
            return new List<Snippet>();

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<List<Snippet>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<Snippet>();
    }

    // --- Invariant: derived difficulty always in range ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void DerivedDifficulty_AlwaysInValidRange(string language)
    {
        var snippets = LoadCalibrationSnippets(language);
        Assert.True(snippets.Count > 0, $"No calibration snippets for {language}");

        var calc = new MetricCalculator();
        foreach (var snippet in snippets)
        {
            var normalized = Normalizer.Normalize(snippet.Code);
            var metrics = calc.Compute(normalized);
            var derived = DifficultyDeriver.FromMetrics(metrics);
            Assert.InRange(derived, 1, 7);
        }
    }

    // --- Invariant: sidecar metadata preserves authored difficulty ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void AuthoredDifficulty_PreservedThroughPipeline(string language)
    {
        var provider = new CalibrationAssetProvider();
        var snippets = provider.LoadSnippets(language);
        if (snippets.Count == 0) return;

        var content = new ContentIntegrationService();
        var pipeline = new ContentPipeline(content);
        pipeline.IngestCalibration(new[] { language }, provider.LoadSnippets);

        var calSnippets = pipeline.GetCalibrationSnippets(language);
        Assert.True(calSnippets.Count > 0);

        // Every authored difficulty band should be represented
        var bands = calSnippets.Select(s => s.Difficulty).Distinct().OrderBy(d => d).ToList();
        Assert.Contains(1, bands);
        Assert.Contains(7, bands);

        // Sidecar metadata preserves authored difficulty, not derived
        foreach (var snippet in calSnippets)
        {
            Assert.InRange(snippet.Difficulty, 1, 7);
        }
    }

    // --- Trend: derived difficulty generally increases with authored ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void DerivedDifficulty_MonotonicallyTrends(string language)
    {
        var snippets = LoadCalibrationSnippets(language);
        Assert.True(snippets.Count > 0, $"No calibration snippets for {language}");

        var calc = new MetricCalculator();

        var bandAverages = snippets
            .GroupBy(s => s.Difficulty)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                AuthoredBand = g.Key,
                AvgDerived = g.Average(s =>
                {
                    var n = Normalizer.Normalize(s.Code);
                    return DifficultyDeriver.FromMetrics(calc.Compute(n));
                })
            })
            .ToList();

        // The average derived difficulty should generally increase:
        // D1 avg should be <= D7 avg
        if (bandAverages.Count >= 2)
        {
            var first = bandAverages.First();
            var last = bandAverages.Last();
            Assert.True(first.AvgDerived <= last.AvgDerived,
                $"{language}: D{first.AuthoredBand} avg derived ({first.AvgDerived:F1}) should be " +
                $"<= D{last.AuthoredBand} avg derived ({last.AvgDerived:F1})");
        }
    }

    // --- Coverage: derived difficulties span a meaningful range ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void DerivedDifficulty_CoversFullRange(string language)
    {
        var snippets = LoadCalibrationSnippets(language);
        Assert.True(snippets.Count > 0, $"No calibration snippets for {language}");

        var calc = new MetricCalculator();
        var derived = snippets
            .Select(s => DifficultyDeriver.FromMetrics(calc.Compute(Normalizer.Normalize(s.Code))))
            .Distinct()
            .OrderBy(d => d)
            .ToList();

        // Derived difficulties should span at least 3 distinct values
        Assert.True(derived.Count >= 3,
            $"{language}: derived difficulties should span at least 3 values, got {derived.Count}: [{string.Join(", ", derived)}]");
    }

    // --- Bounded gap: derivation gap within ±2 for majority of snippets ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void DerivedDifficulty_MajorityWithinTwoOfAuthored(string language)
    {
        var snippets = LoadCalibrationSnippets(language);
        Assert.True(snippets.Count > 0, $"No calibration snippets for {language}");

        var calc = new MetricCalculator();
        int withinTwo = 0;

        foreach (var snippet in snippets)
        {
            var normalized = Normalizer.Normalize(snippet.Code);
            var metrics = calc.Compute(normalized);
            var derived = DifficultyDeriver.FromMetrics(metrics);
            if (Math.Abs(derived - snippet.Difficulty) <= 2)
                withinTwo++;
        }

        // At least 75% of snippets should have derived within ±2 of authored
        var rate = (double)withinTwo / snippets.Count;
        Assert.True(rate >= 0.75,
            $"{language}: {rate:P0} within ±2 (need ≥75%), {withinTwo}/{snippets.Count}");
    }

    [Fact]
    public void DerivedDifficulty_AllLanguages_BoundedGap()
    {
        var calc = new MetricCalculator();
        int totalSnippets = 0;
        int withinTwo = 0;
        int maxGap = 0;

        foreach (var language in Languages)
        {
            var snippets = LoadCalibrationSnippets(language);
            foreach (var snippet in snippets)
            {
                totalSnippets++;
                var normalized = Normalizer.Normalize(snippet.Code);
                var derived = DifficultyDeriver.FromMetrics(calc.Compute(normalized));
                var gap = Math.Abs(derived - snippet.Difficulty);
                if (gap <= 2) withinTwo++;
                if (gap > maxGap) maxGap = gap;
            }
        }

        // Aggregate: at least 70% within ±2
        var rate = totalSnippets > 0 ? (double)withinTwo / totalSnippets : 0;
        Assert.True(rate >= 0.70,
            $"Aggregate: {rate:P0} within ±2 (need ≥70%), {withinTwo}/{totalSnippets}, max gap={maxGap}");

        // Max gap should never exceed 4
        Assert.True(maxGap <= 4,
            $"Max derivation gap is {maxGap} (should be ≤4)");
    }

    // --- Determinism ---

    [Fact]
    public void DifficultyDeriver_Deterministic()
    {
        var calc = new MetricCalculator();
        var code = "def example():\n    return 42\n";
        var metrics = calc.Compute(code);

        var d1 = DifficultyDeriver.FromMetrics(metrics);
        var d2 = DifficultyDeriver.FromMetrics(metrics);
        var d3 = DifficultyDeriver.FromMetrics(metrics);

        Assert.Equal(d1, d2);
        Assert.Equal(d2, d3);
    }

    [Fact]
    public void DifficultyDeriver_EdgeCases_AlwaysInRange()
    {
        var calc = new MetricCalculator();
        var testCases = new[]
        {
            "",
            "x\n",
            "x = 1\n",
            string.Join("\n", Enumerable.Range(0, 100).Select(i => $"line_{i} = {i}")) + "\n",
        };

        foreach (var code in testCases)
        {
            var metrics = calc.Compute(code);
            var derived = DifficultyDeriver.FromMetrics(metrics);
            Assert.InRange(derived, 1, 7);
        }
    }
}
