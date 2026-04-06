using System.Text.Json;
using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Discovers and loads user-authored snippet packs from the user's config directory.
/// Scans ~/.config/linux-dev-typer/packs/*.json with the same format as built-in packs.
/// Gracefully handles missing directory (returns empty results, no crash).
/// </summary>
public sealed class UserPackProvider : IAssetProvider
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    private Dictionary<string, List<Snippet>>? _cache;

    /// <summary>
    /// Returns the path to the user packs directory.
    /// Delegates to AppPaths for cross-platform consistency.
    /// </summary>
    public static string PacksDirectory() => AppPaths.PacksDirectory();

    public IReadOnlyList<string> ListLanguages()
    {
        EnsureLoaded();
        return _cache!.Keys.OrderBy(k => k).ToList();
    }

    public IReadOnlyList<Snippet> LoadSnippets(string language)
    {
        EnsureLoaded();
        var key = language.ToLowerInvariant();
        return _cache!.TryGetValue(key, out var list) ? list : Array.Empty<Snippet>();
    }

    /// <summary>
    /// Returns metadata for all discovered packs (language, file name, snippet count).
    /// </summary>
    public IReadOnlyList<PackMetadata> DiscoverPacks()
    {
        EnsureLoaded();
        return _cache!.Select(kv => new PackMetadata
        {
            FileName = $"{kv.Key}.json",
            Language = kv.Key,
            Enabled = true,
            SnippetCount = kv.Value.Count
        }).OrderBy(p => p.Language).ToList();
    }

    /// <summary>
    /// Clears the cache so the next access re-scans the packs directory.
    /// Call this after the user drops new files into the packs folder.
    /// </summary>
    public void Refresh()
    {
        _cache = null;
    }

    private void EnsureLoaded()
    {
        if (_cache != null) return;

        _cache = new Dictionary<string, List<Snippet>>(StringComparer.OrdinalIgnoreCase);
        var dir = PacksDirectory();

        if (!Directory.Exists(dir)) return;

        string[] files;
        try
        {
            files = Directory.GetFiles(dir, "*.json");
        }
        catch
        {
            return;
        }

        foreach (var file in files)
        {
            var lang = Path.GetFileNameWithoutExtension(file).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(lang)) continue;

            try
            {
                var json = File.ReadAllText(file);
                var snippets = JsonSerializer.Deserialize<List<Snippet>>(json, JsonOpts)
                               ?? new List<Snippet>();

                // Filter out entries with empty code
                snippets = snippets.Where(s => !string.IsNullOrWhiteSpace(s.Code)).ToList();

                if (snippets.Count > 0)
                    _cache[lang] = snippets;
            }
            catch
            {
                // Individual pack failure doesn't affect others
                continue;
            }
        }
    }
}
