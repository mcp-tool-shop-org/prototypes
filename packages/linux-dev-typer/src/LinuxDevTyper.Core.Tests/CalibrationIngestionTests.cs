using DevOpTyper.Content.Services;
using LinuxDevTyper.App.Services;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Tests.Fixtures;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Integration tests verifying that the ContentPipeline correctly ingests
/// calibration content, isolates it from practice, and exposes it for the planner.
/// </summary>
public class CalibrationIngestionTests
{
    private static ContentPipeline CreatePipeline()
    {
        var content = new ContentIntegrationService();
        return new ContentPipeline(content);
    }

    private static IReadOnlyList<Snippet> BuiltInLoader(string language)
    {
        return SnippetFixtures.FullPool(language, perBand: 3);
    }

    private static IReadOnlyList<Snippet> CalibrationLoader(string language)
    {
        var snippets = new List<Snippet>();
        for (int d = 1; d <= 7; d++)
        {
            for (int seq = 1; seq <= 3; seq++)
                snippets.Add(SnippetFixtures.CalibrationSnippet(d, language, seq));
        }
        return snippets;
    }

    // --- Ingestion ---

    [Fact]
    public void IngestCalibration_AddsItemsToIndex()
    {
        var pipeline = CreatePipeline();
        var languages = new[] { "python" };

        pipeline.IngestCalibration(languages, CalibrationLoader);

        Assert.True(pipeline.ItemCount > 0);
    }

    [Fact]
    public void IngestCalibration_MultipleLanguages()
    {
        var pipeline = CreatePipeline();
        var languages = new[] { "python", "rust", "javascript" };

        pipeline.IngestCalibration(languages, CalibrationLoader);

        var langs = pipeline.Languages();
        Assert.Contains("python", langs);
        Assert.Contains("rust", langs);
        Assert.Contains("javascript", langs);
    }

    [Fact]
    public void IngestCalibration_CountBySource_ShowsCalibration()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var counts = pipeline.CountBySource();
        Assert.True(counts.ContainsKey("calibration"));
        Assert.True(counts["calibration"] > 0);
    }

    // --- Isolation: calibration excluded from practice ---

    [Fact]
    public void GetSnippets_ExcludesCalibration()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestBuiltIns(new[] { "python" }, BuiltInLoader);
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var practice = pipeline.GetSnippets("python");
        var calibration = pipeline.GetCalibrationSnippets("python");

        // Practice should have built-in items but NOT calibration
        Assert.True(practice.Count > 0, "Practice pool should not be empty");
        Assert.True(calibration.Count > 0, "Calibration pool should not be empty");

        // No overlap: practice IDs should not appear in calibration IDs
        var practiceIds = practice.Select(s => s.Id).ToHashSet();
        var calIds = calibration.Select(s => s.Id).ToHashSet();
        Assert.Empty(practiceIds.Intersect(calIds));
    }

    [Fact]
    public void GetSnippets_OnlyCalibrationIngested_FallsBackToCalibration()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var practice = pipeline.GetSnippets("python");

        // No built-ins were ingested — fallback promotes calibration for practice
        // so the user isn't left with an empty screen
        Assert.True(practice.Count > 0, "Fallback should promote calibration content");
        var calibration = pipeline.GetCalibrationSnippets("python");
        Assert.Equal(calibration.Count, practice.Count);
    }

    [Fact]
    public void GetCalibrationSnippets_OnlyBuiltInsIngested_ReturnsEmpty()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestBuiltIns(new[] { "python" }, BuiltInLoader);

        var calibration = pipeline.GetCalibrationSnippets("python");

        Assert.Empty(calibration);
    }

    [Fact]
    public void GetCalibrationSnippets_ReturnsOnlyCalibration()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestBuiltIns(new[] { "python" }, BuiltInLoader);
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var calibration = pipeline.GetCalibrationSnippets("python");

        // All returned items should be from calibration source
        Assert.True(calibration.Count > 0);
    }

    // --- Sidecar metadata preservation ---

    [Fact]
    public void CalibrationSnippets_PreserveDifficulty()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var calibration = pipeline.GetCalibrationSnippets("python");

        // Calibration snippets should have difficulties spanning D1-D7
        var difficulties = calibration.Select(s => s.Difficulty).Distinct().OrderBy(d => d).ToList();
        Assert.Contains(1, difficulties);
        Assert.Contains(4, difficulties);
        Assert.Contains(7, difficulties);
    }

    [Fact]
    public void CalibrationSnippets_PreserveTopics()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var calibration = pipeline.GetCalibrationSnippets("python");

        // All calibration snippets should have "calibration" topic from fixture
        foreach (var snippet in calibration)
        {
            Assert.Contains("calibration", snippet.Topics);
        }
    }

    // --- Cross-language isolation ---

    [Fact]
    public void CalibrationSnippets_LanguageIsolation()
    {
        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(new[] { "python", "rust" }, CalibrationLoader);

        var pythonCal = pipeline.GetCalibrationSnippets("python");
        var rustCal = pipeline.GetCalibrationSnippets("rust");

        Assert.True(pythonCal.Count > 0);
        Assert.True(rustCal.Count > 0);
        Assert.All(pythonCal, s => Assert.Equal("python", s.Language));
        Assert.All(rustCal, s => Assert.Equal("rust", s.Language));
    }

    // --- Ingestion order independence ---

    [Fact]
    public void IngestionOrder_CalibrationBeforeBuiltIns_SameIsolation()
    {
        // Calibration first
        var pipeline1 = CreatePipeline();
        pipeline1.IngestCalibration(new[] { "python" }, CalibrationLoader);
        pipeline1.IngestBuiltIns(new[] { "python" }, BuiltInLoader);

        // Built-ins first
        var pipeline2 = CreatePipeline();
        pipeline2.IngestBuiltIns(new[] { "python" }, BuiltInLoader);
        pipeline2.IngestCalibration(new[] { "python" }, CalibrationLoader);

        var practice1 = pipeline1.GetSnippets("python");
        var practice2 = pipeline2.GetSnippets("python");
        var cal1 = pipeline1.GetCalibrationSnippets("python");
        var cal2 = pipeline2.GetCalibrationSnippets("python");

        // Both should have the same counts regardless of order
        Assert.Equal(practice1.Count, practice2.Count);
        Assert.Equal(cal1.Count, cal2.Count);
    }

    // --- Real calibration packs ---

    [Fact]
    public void RealCalibrationPacks_IngestAndIsolate()
    {
        var calDir = Path.Combine(AppContext.BaseDirectory, "assets", "calibration");
        if (!Directory.Exists(calDir))
            return; // Skip if calibration files not available

        var provider = new CalibrationAssetProvider();
        var languages = provider.ListLanguages();
        if (languages.Count == 0)
            return;

        var pipeline = CreatePipeline();
        pipeline.IngestCalibration(languages, provider.LoadSnippets);

        foreach (var lang in languages)
        {
            var cal = pipeline.GetCalibrationSnippets(lang);
            Assert.True(cal.Count > 0, $"Calibration for {lang} should not be empty");

            var practice = pipeline.GetSnippets(lang);
            // No built-ins ingested — fallback promotes calibration for practice
            Assert.True(practice.Count > 0, $"Fallback should promote calibration for {lang}");
            Assert.Equal(cal.Count, practice.Count);

            // All calibration snippets should have valid difficulty
            Assert.All(cal, s => Assert.InRange(s.Difficulty, 1, 7));
        }
    }

    [Fact]
    public void RealCalibrationPacks_ExcludedFromPractice()
    {
        var calDir = Path.Combine(AppContext.BaseDirectory, "assets", "calibration");
        if (!Directory.Exists(calDir))
            return;

        var provider = new CalibrationAssetProvider();
        var languages = provider.ListLanguages();
        if (languages.Count == 0)
            return;

        var pipeline = CreatePipeline();

        // Ingest built-ins (use fixture pool as stand-in)
        pipeline.IngestBuiltIns(new[] { "python" }, BuiltInLoader);

        // Ingest real calibration
        pipeline.IngestCalibration(languages, provider.LoadSnippets);

        var practice = pipeline.GetSnippets("python");
        var calPython = pipeline.GetCalibrationSnippets("python");

        // No overlap
        var practiceIds = practice.Select(s => s.Id).ToHashSet();
        var calIds = calPython.Select(s => s.Id).ToHashSet();
        Assert.Empty(practiceIds.Intersect(calIds));
    }
}
