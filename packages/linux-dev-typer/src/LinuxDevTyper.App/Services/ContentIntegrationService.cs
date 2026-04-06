using System.Runtime.CompilerServices;
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Thin wrapper over DevOpTyper.Content that owns:
/// - Loading/saving the LibraryIndex from disk
/// - Building InMemoryContentLibrary for querying
/// - Converting CodeItem → Snippet (bridge)
/// - Paste/import flows that add content and persist
/// </summary>
public sealed class ContentIntegrationService
{
    private readonly JsonLibraryIndexStore _store = new();
    private readonly DefaultExtractor _extractor = new();
    private readonly MetricCalculator _metrics = new();
    private readonly LanguageDetector _langDetector = new();

    private LibraryIndex _index = new();
    private InMemoryContentLibrary _library = new(Array.Empty<CodeItem>());

    /// <summary>
    /// Loads the library index from disk. Returns empty library on missing/corrupt file.
    /// </summary>
    public void LoadIndex()
    {
        var path = AppPaths.LibraryIndexFile();
        _index = _store.Load(path);
        _library = new InMemoryContentLibrary(_index.Items);
    }

    /// <summary>
    /// Saves the current index to disk and rebuilds the in-memory library.
    /// </summary>
    public void SaveIndex()
    {
        var path = AppPaths.LibraryIndexFile();
        _store.Save(path, _index);
        _library = new InMemoryContentLibrary(_index.Items);
    }

    /// <summary>
    /// Adds pasted code as a user content item. Returns null if the item already exists.
    /// </summary>
    public CodeItem? PasteCode(string title, string code, string? languageHint)
    {
        var normalized = Normalizer.Normalize(code);
        var lang = _langDetector.Detect(null, languageHint, normalized);
        var id = ContentId.From(lang, normalized);

        // Deduplication: content-addressed ID prevents duplicates
        if (_index.Items.Any(i => i.Id == id))
            return null;

        var metrics = _metrics.Compute(normalized);
        var item = new CodeItem(
            Id: id,
            Language: lang,
            Source: "user",
            Title: string.IsNullOrWhiteSpace(title) ? "Pasted snippet" : title.Trim(),
            Code: normalized,
            Metrics: metrics,
            CreatedUtc: DateTimeOffset.UtcNow
        );

        _index.Items.Add(item);
        SaveIndex();
        return item;
    }

    /// <summary>
    /// Imports a single file as corpus content. Returns the number of items added.
    /// </summary>
    public async Task<int> ImportFileAsync(string filePath, CancellationToken ct = default)
    {
        var source = new SingleFileSource(filePath);
        return await ImportFromSourceAsync(source, ct);
    }

    /// <summary>
    /// Imports all files from a folder as corpus content. Returns the number of items added.
    /// </summary>
    public async Task<int> ImportFolderAsync(string folderPath, CancellationToken ct = default)
    {
        var source = new FolderSource(folderPath);
        return await ImportFromSourceAsync(source, ct);
    }

    /// <summary>
    /// Queries the content library and converts results to Snippets for the typing engine.
    /// </summary>
    public IReadOnlyList<Snippet> QueryAsSnippets(ContentQuery? query = null)
    {
        var items = _library.Query(query ?? new ContentQuery());
        return items.Select(CodeItemToSnippet).ToList();
    }

    /// <summary>
    /// Returns all languages present in the content library.
    /// </summary>
    public IReadOnlyList<string> Languages() => _library.Languages();

    /// <summary>
    /// Returns the total number of items in the index.
    /// </summary>
    public int ItemCount => _index.Items.Count;

    /// <summary>
    /// Adds a CodeItem to the index if it doesn't already exist (deduplication by ID).
    /// Does NOT save to disk — call SaveIndex() after batch ingestion.
    /// </summary>
    public void AddItem(CodeItem item)
    {
        if (_index.Items.Any(i => i.Id == item.Id))
            return;
        _index.Items.Add(item);
        _library = new InMemoryContentLibrary(_index.Items);
    }

    /// <summary>
    /// Returns item counts grouped by source (builtin/corpus/user).
    /// </summary>
    public Dictionary<string, int> CountBySource()
    {
        return _index.Items
            .GroupBy(i => i.Source)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    /// <summary>
    /// Converts a CodeItem to a Snippet for use by the existing typing engine.
    /// Difficulty is derived deterministically from CodeMetrics via DifficultyDeriver.
    /// </summary>
    public static Snippet CodeItemToSnippet(CodeItem item)
    {
        return new Snippet
        {
            Id = item.Id,
            Language = item.Language,
            Difficulty = DifficultyDeriver.FromMetrics(item.Metrics),
            Title = item.Title,
            Code = item.Code,
            Topics = item.Concepts ?? Array.Empty<string>(),
            Explain = Array.Empty<string>()
        };
    }

    private async Task<int> ImportFromSourceAsync(IContentSource source, CancellationToken ct)
    {
        var existingIds = new HashSet<string>(_index.Items.Select(i => i.Id));
        var added = 0;

        await foreach (var raw in source.EnumerateAsync(ct))
        {
            foreach (var unit in _extractor.Extract(raw))
            {
                var normalized = Normalizer.Normalize(unit.Text);
                var lang = _langDetector.Detect(raw.Path, raw.LanguageHint, normalized);
                var id = ContentId.From(lang, normalized);

                if (existingIds.Contains(id))
                    continue;

                var metrics = _metrics.Compute(normalized);
                var item = new CodeItem(
                    Id: id,
                    Language: lang,
                    Source: raw.Source,
                    Title: unit.Title,
                    Code: normalized,
                    Metrics: metrics,
                    CreatedUtc: DateTimeOffset.UtcNow,
                    Origin: raw.Origin
                );

                _index.Items.Add(item);
                existingIds.Add(id);
                added++;
            }
        }

        if (added > 0)
            SaveIndex();

        return added;
    }

    /// <summary>
    /// Reads a single file and yields it as corpus content.
    /// </summary>
    private sealed class SingleFileSource : IContentSource
    {
        private readonly string _path;
        public SingleFileSource(string path) => _path = path;

        public async IAsyncEnumerable<RawContent> EnumerateAsync(
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            string text;
            try
            {
                text = await File.ReadAllTextAsync(_path, ct);
            }
            catch
            {
                yield break;
            }

            yield return new RawContent(
                Path: _path,
                LanguageHint: null,
                Title: Path.GetFileName(_path),
                Text: text,
                Source: "corpus",
                Origin: Path.GetDirectoryName(_path)
            );
        }
    }

    /// <summary>
    /// Recursively scans a folder, yielding each file as corpus content.
    /// Skips files larger than 2MB.
    /// </summary>
    private sealed class FolderSource : IContentSource
    {
        private readonly string _root;
        public FolderSource(string root) => _root = root;

        public async IAsyncEnumerable<RawContent> EnumerateAsync(
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            IEnumerable<string> files;
            try
            {
                files = Directory.EnumerateFiles(_root, "*.*", SearchOption.AllDirectories);
            }
            catch
            {
                yield break;
            }

            foreach (var f in files)
            {
                ct.ThrowIfCancellationRequested();

                var fi = new FileInfo(f);
                if (fi.Length > 2_000_000) continue;

                string text;
                try
                {
                    text = await File.ReadAllTextAsync(f, ct);
                }
                catch
                {
                    continue;
                }

                yield return new RawContent(
                    Path: f,
                    LanguageHint: null,
                    Title: Path.GetFileName(f),
                    Text: text,
                    Source: "corpus",
                    Origin: _root
                );
            }
        }
    }

    /// <summary>
    /// Yields a single pasted text as user content.
    /// </summary>
    private sealed class SingleTextSource : IContentSource
    {
        private readonly string _title;
        private readonly string _text;
        private readonly string _lang;

        public SingleTextSource(string title, string text, string lang)
        {
            _title = title;
            _text = text;
            _lang = lang;
        }

        public async IAsyncEnumerable<RawContent> EnumerateAsync(
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            await Task.Yield();
            yield return new RawContent(
                Path: null,
                LanguageHint: _lang,
                Title: _title,
                Text: _text,
                Source: "user",
                Origin: null
            );
        }
    }
}
