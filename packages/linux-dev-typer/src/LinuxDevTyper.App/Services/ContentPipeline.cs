using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Unified content pipeline. All content — built-in snippets, user packs, pasted code,
/// imported files — enters as CodeItem. Selection only ever sees items from this pipeline.
///
/// Rich Snippet metadata (Difficulty, Topics, Explain, Notes, Scaffold, Variants,
/// CommunityDifficulty) is preserved in a sidecar map keyed by CodeItem.Id.
/// Items without sidecar metadata get default values (Difficulty derived from metrics).
/// </summary>
public sealed class ContentPipeline
{
    private readonly ContentIntegrationService _content;
    private readonly Dictionary<string, SnippetMetadata> _sidecar = new();
    private readonly HashSet<string> _calibrationIds = new();

    public ContentPipeline(ContentIntegrationService content)
    {
        _content = content;
    }

    /// <summary>
    /// Ingests built-in snippets into the pipeline. Converts each Snippet to a CodeItem
    /// and stores the rich metadata in the sidecar map.
    /// </summary>
    public void IngestBuiltIns(IReadOnlyList<string> languages, Func<string, IReadOnlyList<Snippet>> loader)
    {
        foreach (var lang in languages)
        {
            var snippets = loader(lang);
            foreach (var snippet in snippets)
            {
                IngestSnippet(snippet, "builtin", "builtin-pack");
            }
        }
    }

    /// <summary>
    /// Ingests calibration snippets into the pipeline with source=CalibrationTag.Source, origin=CalibrationTag.Origin.
    /// Calibration content is engine ground truth — used for session planning, not user practice stats.
    /// </summary>
    public void IngestCalibration(IReadOnlyList<string> languages, Func<string, IReadOnlyList<Snippet>> loader)
    {
        foreach (var lang in languages)
        {
            var snippets = loader(lang);
            foreach (var snippet in snippets)
            {
                var normalized = Normalizer.Normalize(snippet.Code);
                var langKey = snippet.Language.ToLowerInvariant();
                var id = ContentId.From(langKey, normalized);
                _calibrationIds.Add(id);
                IngestSnippet(snippet, CalibrationTag.Source, CalibrationTag.Origin);
            }
        }
    }

    /// <summary>
    /// Ingests user pack snippets into the pipeline. Same as built-ins but with source=user.
    /// </summary>
    public void IngestUserPacks(IReadOnlyList<string> languages, Func<string, IReadOnlyList<Snippet>> loader)
    {
        foreach (var lang in languages)
        {
            var snippets = loader(lang);
            foreach (var snippet in snippets)
            {
                IngestSnippet(snippet, "user", $"pack:{lang}");
            }
        }
    }

    /// <summary>
    /// Returns practice snippets for a language, with sidecar metadata applied.
    /// Excludes calibration content — calibration is for engine ground truth, not practice.
    /// This is the single entry point for selection — no other source should be consulted.
    /// </summary>
    public IReadOnlyList<Snippet> GetSnippets(string language)
    {
        var query = new ContentQuery { Language = language };
        var items = _content.QueryAsSnippets(query);

        // Apply sidecar metadata where available, excluding calibration items
        var result = new List<Snippet>(items.Count);
        foreach (var snippet in items)
        {
            if (_calibrationIds.Contains(snippet.Id))
                continue;

            if (_sidecar.TryGetValue(snippet.Id, out var meta))
            {
                result.Add(ApplyMetadata(snippet, meta));
            }
            else
            {
                result.Add(snippet);
            }
        }

        // Fallback: if no non-calibration snippets exist, promote calibration
        // content for practice so the user isn't left with an empty screen.
        if (result.Count == 0)
        {
            return GetCalibrationSnippets(language);
        }

        return result;
    }

    /// <summary>
    /// Returns calibration snippets for a language, with sidecar metadata applied.
    /// Used by the session planner for difficulty calibration — not for normal practice.
    /// </summary>
    public IReadOnlyList<Snippet> GetCalibrationSnippets(string language)
    {
        var query = new ContentQuery { Language = language, Source = CalibrationTag.Source };
        var items = _content.QueryAsSnippets(query);

        var result = new List<Snippet>(items.Count);
        foreach (var snippet in items)
        {
            if (_sidecar.TryGetValue(snippet.Id, out var meta))
                result.Add(ApplyMetadata(snippet, meta));
            else
                result.Add(snippet);
        }

        return result;
    }

    /// <summary>
    /// Returns all languages across all ingested content.
    /// </summary>
    public IReadOnlyList<string> Languages() => _content.Languages();

    /// <summary>
    /// Total item count across all sources.
    /// </summary>
    public int ItemCount => _content.ItemCount;

    /// <summary>
    /// Item counts by source.
    /// </summary>
    public Dictionary<string, int> CountBySource() => _content.CountBySource();

    /// <summary>
    /// Delegates to ContentIntegrationService for paste flow.
    /// </summary>
    public CodeItem? PasteCode(string title, string code, string? languageHint)
        => _content.PasteCode(title, code, languageHint);

    /// <summary>
    /// Delegates to ContentIntegrationService for file import.
    /// </summary>
    public Task<int> ImportFileAsync(string filePath, CancellationToken ct = default)
        => _content.ImportFileAsync(filePath, ct);

    /// <summary>
    /// Delegates to ContentIntegrationService for folder import.
    /// </summary>
    public Task<int> ImportFolderAsync(string folderPath, CancellationToken ct = default)
        => _content.ImportFolderAsync(folderPath, ct);

    private void IngestSnippet(Snippet snippet, string source, string origin)
    {
        var normalized = Normalizer.Normalize(snippet.Code);
        var lang = snippet.Language.ToLowerInvariant();
        var id = ContentId.From(lang, normalized);
        var metrics = new MetricCalculator().Compute(normalized);

        // Store the rich metadata in the sidecar, keyed by content-addressed ID
        _sidecar[id] = new SnippetMetadata
        {
            Difficulty = snippet.Difficulty,
            Topics = snippet.Topics,
            Explain = snippet.Explain,
            Notes = snippet.Notes,
            CommunityDifficulty = snippet.CommunityDifficulty,
            Scaffold = snippet.Scaffold,
            Variants = snippet.Variants
        };

        // Add to the content index (deduplication by ID is handled inside)
        var item = new CodeItem(
            Id: id,
            Language: lang,
            Source: source,
            Title: string.IsNullOrWhiteSpace(snippet.Title) ? snippet.Id : snippet.Title,
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow,
            Origin: origin,
            Concepts: snippet.Topics.Length > 0 ? snippet.Topics : null
        );

        _content.AddItem(item);
    }

    private static Snippet ApplyMetadata(Snippet snippet, SnippetMetadata meta)
    {
        return new Snippet
        {
            Id = snippet.Id,
            Language = snippet.Language,
            Difficulty = meta.Difficulty,
            Title = snippet.Title,
            Code = snippet.Code,
            Topics = meta.Topics,
            Explain = meta.Explain,
            Notes = meta.Notes,
            CommunityDifficulty = meta.CommunityDifficulty,
            Scaffold = meta.Scaffold,
            Variants = meta.Variants
        };
    }
}

/// <summary>
/// Sidecar storage for rich Snippet fields that CodeItem doesn't carry.
/// </summary>
internal sealed class SnippetMetadata
{
    public int Difficulty { get; init; }
    public string[] Topics { get; init; } = Array.Empty<string>();
    public string[] Explain { get; init; } = Array.Empty<string>();
    public string[]? Notes { get; init; }
    public double? CommunityDifficulty { get; init; }
    public string[]? Scaffold { get; init; }
    public string[]? Variants { get; init; }
}
