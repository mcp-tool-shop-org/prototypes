using System.Text.Json;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Exports and imports .ldtpack files (JSON bundles of user packs and profiles).
/// Only user-authored content travels — never state.json, never results.
/// </summary>
public static class PortableExporter
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private static readonly JsonSerializerOptions ReadOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
    };

    /// <summary>
    /// Export user packs and profiles to a JSON string.
    /// Reads all .json files from the packs directory and all non-Default profiles.
    /// </summary>
    public static string Export(string packsDirectory, Dictionary<string, PracticeProfile> profiles)
    {
        var bundle = new PortableBundle
        {
            ExportedAt = DateTimeOffset.UtcNow,
        };

        // Collect profiles (excluding Default)
        foreach (var (name, profile) in profiles)
        {
            if (!string.Equals(name, "Default", StringComparison.OrdinalIgnoreCase))
                bundle.Profiles[name] = profile;
        }

        // Collect user packs
        if (Directory.Exists(packsDirectory))
        {
            try
            {
                foreach (var file in Directory.GetFiles(packsDirectory, "*.json"))
                {
                    var lang = AppPaths.NormalizeLanguageKey(
                        Path.GetFileNameWithoutExtension(file));
                    if (string.IsNullOrWhiteSpace(lang)) continue;

                    try
                    {
                        var json = File.ReadAllText(file);
                        var snippets = JsonSerializer.Deserialize<List<Snippet>>(json, ReadOpts);
                        if (snippets != null && snippets.Count > 0)
                            bundle.SnippetPacks[lang] = snippets;
                    }
                    catch { /* Skip invalid files */ }
                }
            }
            catch { /* Skip if directory can't be read */ }
        }

        return JsonSerializer.Serialize(bundle, JsonOpts);
    }

    /// <summary>
    /// Import a .ldtpack JSON string. Validates snippets, writes pack files,
    /// and merges profiles into existing state.
    /// Supports format v1, v2, and v3 bundles:
    ///   v1: no Notes, CommunityDifficulty, Scaffold, or Variants — all default to null.
    ///   v2: has Notes and CommunityDifficulty — Scaffold and Variants default to null.
    ///   v3: has all fields including Scaffold and Variants.
    /// Older bundles import cleanly — missing fields default to null via deserialization.
    /// </summary>
    /// <returns>Summary of imported items, or error message.</returns>
    public static (bool Success, string Message) Import(
        string json,
        string packsDirectory,
        Dictionary<string, PracticeProfile> existingProfiles)
    {
        PortableBundle? bundle;
        try
        {
            bundle = JsonSerializer.Deserialize<PortableBundle>(json, ReadOpts);
        }
        catch (Exception ex)
        {
            return (false, $"Invalid bundle format: {ex.Message}");
        }

        if (bundle == null)
            return (false, "Bundle is empty or null.");

        // Ensure packs directory exists
        try
        {
            Directory.CreateDirectory(packsDirectory);
        }
        catch (Exception ex)
        {
            return (false, $"Cannot create packs directory: {ex.Message}");
        }

        // Write pack files (only new languages, skip existing)
        int packsWritten = 0;
        foreach (var (lang, snippets) in bundle.SnippetPacks)
        {
            var key = AppPaths.NormalizeLanguageKey(lang);
            var packPath = Path.Combine(packsDirectory, $"{key}.json");

            // Don't overwrite existing pack files
            if (File.Exists(packPath)) continue;

            // Validate snippets before writing
            var (valid, errors) = PackValidator.Validate(snippets);
            if (!valid) continue;

            try
            {
                var packJson = JsonSerializer.Serialize(snippets, JsonOpts);
                File.WriteAllText(packPath, packJson);
                packsWritten++;
            }
            catch { /* Skip individual write failures */ }
        }

        // Merge profiles
        var existingPacks = new Dictionary<string, List<Snippet>>(); // not used for file merge
        var (profilesImported, _) = bundle.MergeInto(existingProfiles, existingPacks);

        var parts = new List<string>();
        if (profilesImported > 0) parts.Add($"{profilesImported} profile(s)");
        if (packsWritten > 0) parts.Add($"{packsWritten} pack(s)");

        if (parts.Count == 0)
            return (true, "Nothing new to import (all items already exist).");

        return (true, $"Imported {string.Join(" and ", parts)}.");
    }
}
