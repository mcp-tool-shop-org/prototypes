namespace LinuxDevTyper.App.Services;

/// <summary>
/// Filesystem-based discovery of keyboard themes and ambient soundscapes.
/// Folder names become display names in UI dropdowns.
/// </summary>
public static class SoundDiscoveryService
{
    public static IReadOnlyList<string> DiscoverKeyboardThemes(string soundsBasePath)
    {
        var sfxDir = Path.Combine(soundsBasePath, "sfx");
        if (!Directory.Exists(sfxDir)) return [];
        try
        {
            return Directory.GetDirectories(sfxDir)
                .Select(Path.GetFileName)
                .Where(name => !string.IsNullOrEmpty(name))
                .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                .ToList()!;
        }
        catch { return []; }
    }

    public static IReadOnlyList<string> DiscoverSoundscapes(string soundsBasePath)
    {
        var ambientDir = Path.Combine(soundsBasePath, "ambient");
        if (!Directory.Exists(ambientDir)) return [];
        try
        {
            return Directory.GetDirectories(ambientDir)
                .Select(Path.GetFileName)
                .Where(name => !string.IsNullOrEmpty(name))
                .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                .ToList()!;
        }
        catch { return []; }
    }

    public static string[] GetKeyClipPaths(string soundsBasePath, string theme)
    {
        var dir = Path.Combine(soundsBasePath, "sfx", theme);
        if (!Directory.Exists(dir)) return [];
        try
        {
            return Directory.GetFiles(dir, "key_*.wav")
                .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch { return []; }
    }

    public static string[] GetAmbientTrackPaths(string soundsBasePath, string soundscape)
    {
        var dir = Path.Combine(soundsBasePath, "ambient", soundscape);
        if (!Directory.Exists(dir)) return [];
        try
        {
            return Directory.GetFiles(dir, "*.wav")
                .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch { return []; }
    }

    public static string? GetUiClickPath(string soundsBasePath)
    {
        var path = Path.Combine(soundsBasePath, "sfx", "ui_click.wav");
        return File.Exists(path) ? path : null;
    }
}
