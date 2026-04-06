using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Merges built-in snippets (LocalAssetProvider) with user-authored packs (UserPackProvider).
/// Languages are the union of both sources. Snippets are concatenated for shared languages.
/// Respects PackRegistry enabled/disabled state for user packs.
/// </summary>
public sealed class CompositeAssetProvider : IAssetProvider
{
    private readonly IAssetProvider _builtIn;
    private readonly UserPackProvider _userPacks;
    private readonly IReadOnlyList<PackMetadata> _packRegistry;

    public CompositeAssetProvider(
        IAssetProvider builtIn,
        UserPackProvider userPacks,
        IReadOnlyList<PackMetadata> packRegistry)
    {
        _builtIn = builtIn;
        _userPacks = userPacks;
        _packRegistry = packRegistry;
    }

    public IReadOnlyList<string> ListLanguages()
    {
        var builtInLangs = _builtIn.ListLanguages();

        IEnumerable<string> userLangs;
        try
        {
            userLangs = _userPacks.ListLanguages()
                .Where(lang => IsPackEnabled(lang));
        }
        catch
        {
            // User packs failure doesn't affect built-in packs
            userLangs = Enumerable.Empty<string>();
        }

        return builtInLangs
            .Concat(userLangs)
            .Select(l => l.ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();
    }

    public IReadOnlyList<Snippet> LoadSnippets(string language)
    {
        var builtIn = _builtIn.LoadSnippets(language);

        if (!IsPackEnabled(language))
            return builtIn;

        IReadOnlyList<Snippet> userSnippets;
        try
        {
            userSnippets = _userPacks.LoadSnippets(language);
        }
        catch
        {
            // User pack failure doesn't affect built-in snippets
            return builtIn;
        }

        if (userSnippets.Count == 0) return builtIn;
        if (builtIn.Count == 0) return userSnippets;

        // Concatenate both sources
        var combined = new List<Snippet>(builtIn.Count + userSnippets.Count);
        combined.AddRange(builtIn);
        combined.AddRange(userSnippets);
        return combined;
    }

    /// <summary>
    /// Checks whether a user pack for the given language is enabled.
    /// Packs not in the registry are enabled by default (new, undiscovered packs).
    /// </summary>
    private bool IsPackEnabled(string language)
    {
        var entry = _packRegistry.FirstOrDefault(
            p => string.Equals(p.Language, language, StringComparison.OrdinalIgnoreCase));

        // If not in registry, treat as enabled (newly dropped pack)
        return entry?.Enabled ?? true;
    }
}
