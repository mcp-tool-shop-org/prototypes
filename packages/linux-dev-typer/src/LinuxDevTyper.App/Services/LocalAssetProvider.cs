using System.Text.Json;
using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

public sealed class LocalAssetProvider : IAssetProvider
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    private readonly Dictionary<string, List<Snippet>> _cache = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<string> ListLanguages()
    {
        var dir = SnippetDir();
        if (!Directory.Exists(dir)) return Array.Empty<string>();

        try
        {
            return Directory.GetFiles(dir, "*.json")
                .Select(f => Path.GetFileNameWithoutExtension(f).ToLowerInvariant())
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .OrderBy(x => x)
                .ToList();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    public IReadOnlyList<Snippet> LoadSnippets(string language)
    {
        if (_cache.TryGetValue(language, out var cached)) return cached;

        var path = Path.Combine(SnippetDir(), $"{language.ToLowerInvariant()}.json");
        if (!File.Exists(path))
        {
            _cache[language] = new List<Snippet>();
            return _cache[language];
        }

        try
        {
            var json = File.ReadAllText(path);
            var list = JsonSerializer.Deserialize<List<Snippet>>(json, JsonOpts) ?? new List<Snippet>();

            // Filter out invalid entries
            list = list.Where(s => !string.IsNullOrWhiteSpace(s.Code)).ToList();

            _cache[language] = list;
            return list;
        }
        catch
        {
            _cache[language] = new List<Snippet>();
            return _cache[language];
        }
    }

    private static string SnippetDir() => Path.Combine(AppContext.BaseDirectory, "Assets", "snippets");
}
