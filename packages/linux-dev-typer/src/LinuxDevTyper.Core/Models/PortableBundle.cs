namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Import/export envelope for user-authored content.
/// Contains snippet packs and practice profiles — never state or history.
/// Serialized as JSON with .ldtpack extension.
/// </summary>
public sealed class PortableBundle
{
    /// <summary>Bundle format version for future-proofing.</summary>
    /// <summary>
    /// Format v3 adds Scaffold and Variants on Snippet.
    /// v1 bundles import cleanly — missing fields default to null.
    /// v2 bundles import cleanly — Scaffold and Variants default to null.
    /// </summary>
    public string FormatVersion { get; set; } = "3";

    /// <summary>When this bundle was exported.</summary>
    public DateTimeOffset ExportedAt { get; set; }

    /// <summary>Named practice profiles (excluding "Default").</summary>
    public Dictionary<string, PracticeProfile> Profiles { get; set; } = new();

    /// <summary>User snippet packs keyed by language name.</summary>
    public Dictionary<string, List<Snippet>> SnippetPacks { get; set; } = new();

    /// <summary>
    /// Merge imported bundle into existing data.
    /// Does not overwrite existing profiles or packs — imported items
    /// are added only if the key doesn't already exist.
    /// </summary>
    /// <returns>Counts of imported items: (profiles, packs).</returns>
    public (int ProfilesImported, int PacksImported) MergeInto(
        Dictionary<string, PracticeProfile> existingProfiles,
        Dictionary<string, List<Snippet>> existingPacks)
    {
        int profilesImported = 0;
        int packsImported = 0;

        foreach (var (name, profile) in Profiles)
        {
            if (string.Equals(name, "Default", StringComparison.OrdinalIgnoreCase))
                continue;

            if (!existingProfiles.ContainsKey(name))
            {
                existingProfiles[name] = profile.Clamp();
                profilesImported++;
            }
        }

        foreach (var (lang, snippets) in SnippetPacks)
        {
            var key = lang.ToLowerInvariant();
            if (!existingPacks.ContainsKey(key))
            {
                existingPacks[key] = snippets;
                packsImported++;
            }
        }

        return (profilesImported, packsImported);
    }
}
