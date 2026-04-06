using System.Text.Json;
using System.Text.RegularExpressions;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Validates calibration pack structure, coverage, and invariants.
/// These tests load the actual JSON files from assets/calibration/ and verify
/// they conform to the calibration corpus specification (v0.9.0-calibration-spec.md).
/// </summary>
public class CalibrationPackTests
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true
    };

    private static readonly string[] CalibrationLanguages = { "python", "rust", "javascript", "csharp", "go" };

    /// <summary>Minimum items per difficulty band: D1=5, D2=5, D3=5, D4=5, D5=5, D6=5, D7=3.</summary>
    private static readonly Dictionary<int, int> MinPerBand = new()
    {
        [1] = 5, [2] = 5, [3] = 5, [4] = 5, [5] = 5, [6] = 5, [7] = 3
    };

    private static string CalibrationDir()
    {
        // Calibration files are copied to output via csproj <None> item
        var candidate = Path.Combine(AppContext.BaseDirectory, "assets", "calibration");
        if (Directory.Exists(candidate))
            return candidate;
        throw new DirectoryNotFoundException("Cannot find assets/calibration/ from " + AppContext.BaseDirectory);
    }

    private static List<Snippet> LoadPack(string language)
    {
        var path = Path.Combine(CalibrationDir(), $"{language}.json");
        Assert.True(File.Exists(path), $"Calibration pack not found: {path}");
        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<List<Snippet>>(json, JsonOpts) ?? new List<Snippet>();
    }

    // --- File Existence ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_Exists(string language)
    {
        var path = Path.Combine(CalibrationDir(), $"{language}.json");
        Assert.True(File.Exists(path), $"Missing calibration pack: {language}.json");
    }

    // --- Minimum Item Count ---

    [Theory]
    [InlineData("python", 33)]
    [InlineData("rust", 33)]
    [InlineData("javascript", 33)]
    [InlineData("csharp", 33)]
    [InlineData("go", 33)]
    public void CalibrationPack_HasMinimumItems(string language, int minItems)
    {
        var snippets = LoadPack(language);
        Assert.True(snippets.Count >= minItems,
            $"{language}: expected >= {minItems} items, got {snippets.Count}");
    }

    // --- Difficulty Band Coverage ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_CoversAllDifficultyBands(string language)
    {
        var snippets = LoadPack(language);
        var bandCounts = snippets
            .GroupBy(s => s.Difficulty)
            .ToDictionary(g => g.Key, g => g.Count());

        foreach (var (band, min) in MinPerBand)
        {
            bandCounts.TryGetValue(band, out int actual);
            Assert.True(actual >= min,
                $"{language} D{band}: expected >= {min} items, got {actual}");
        }
    }

    // --- ID Format ---

    [Theory]
    [InlineData("python", "py")]
    [InlineData("rust", "rs")]
    [InlineData("javascript", "js")]
    [InlineData("csharp", "cs")]
    [InlineData("go", "go")]
    public void CalibrationPack_AllIdsFollowConvention(string language, string expectedPrefix)
    {
        var snippets = LoadPack(language);
        var pattern = new Regex($@"^cal-{expectedPrefix}-d[1-7]-\d{{3}}$");

        foreach (var snippet in snippets)
        {
            Assert.Matches(pattern, snippet.Id);
        }
    }

    // --- Unique IDs Within Pack ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_AllIdsUnique(string language)
    {
        var snippets = LoadPack(language);
        var ids = snippets.Select(s => s.Id).ToList();
        Assert.Equal(ids.Count, ids.Distinct().Count());
    }

    // --- Required Fields ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_AllSnippetsHaveRequiredFields(string language)
    {
        var snippets = LoadPack(language);

        foreach (var s in snippets)
        {
            Assert.False(string.IsNullOrWhiteSpace(s.Id), $"{language}: snippet has empty Id");
            Assert.False(string.IsNullOrWhiteSpace(s.Language), $"{s.Id}: empty Language");
            Assert.InRange(s.Difficulty, 1, 7);
            Assert.False(string.IsNullOrWhiteSpace(s.Title), $"{s.Id}: empty Title");
            Assert.False(string.IsNullOrWhiteSpace(s.Code), $"{s.Id}: empty Code");
            Assert.NotNull(s.Topics);
            Assert.NotEmpty(s.Topics);
            Assert.NotNull(s.Explain);
            Assert.NotEmpty(s.Explain);
        }
    }

    // --- Language Field Consistency ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_LanguageFieldMatchesFile(string language)
    {
        var snippets = LoadPack(language);

        foreach (var s in snippets)
        {
            Assert.Equal(language, s.Language);
        }
    }

    // --- Difficulty Matches ID Band ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_DifficultyMatchesIdBand(string language)
    {
        var snippets = LoadPack(language);

        foreach (var s in snippets)
        {
            // Extract band number from ID: cal-xx-dN-seq → N
            var match = Regex.Match(s.Id, @"-d(\d)-");
            Assert.True(match.Success, $"{s.Id}: cannot extract band from ID");
            int idBand = int.Parse(match.Groups[1].Value);
            Assert.Equal(idBand, s.Difficulty);
        }
    }

    // --- Cross-Pack ID Uniqueness ---

    [Fact]
    public void CalibrationPacks_AllIdsGloballyUnique()
    {
        var allIds = new List<string>();
        foreach (var lang in CalibrationLanguages)
        {
            allIds.AddRange(LoadPack(lang).Select(s => s.Id));
        }
        Assert.Equal(allIds.Count, allIds.Distinct().Count());
    }

    // --- Total Item Count ---

    [Fact]
    public void CalibrationPacks_TotalItemCount()
    {
        int total = 0;
        foreach (var lang in CalibrationLanguages)
        {
            total += LoadPack(lang).Count;
        }
        // 5 languages × 33 minimum = 165 minimum total
        Assert.True(total >= 165, $"Total calibration items: {total}, expected >= 165");
    }

    // --- No Community/Pedagogy Fields in Calibration ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_NoCommunityOrPedagogyFields(string language)
    {
        var snippets = LoadPack(language);

        foreach (var s in snippets)
        {
            Assert.Null(s.Notes);
            Assert.Null(s.CommunityDifficulty);
            Assert.Null(s.Scaffold);
            Assert.Null(s.Variants);
        }
    }

    // --- Code Non-Empty After Trim ---

    [Theory]
    [InlineData("python")]
    [InlineData("rust")]
    [InlineData("javascript")]
    [InlineData("csharp")]
    [InlineData("go")]
    public void CalibrationPack_CodeIsNonTrivial(string language)
    {
        var snippets = LoadPack(language);

        foreach (var s in snippets)
        {
            var trimmed = s.Code.Trim();
            Assert.True(trimmed.Length > 0, $"{s.Id}: Code is only whitespace");
        }
    }
}
