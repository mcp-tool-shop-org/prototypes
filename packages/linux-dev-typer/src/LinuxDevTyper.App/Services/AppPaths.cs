namespace LinuxDevTyper.App.Services;

/// <summary>
/// Shared cross-platform path resolution for all app data.
/// Single source of truth for config directory, state file, and packs directory.
///
/// On Linux:   ~/.config/linux-dev-typer/
/// On Windows: %APPDATA%/linux-dev-typer/
/// On macOS:   ~/Library/Application Support/linux-dev-typer/
/// </summary>
public static class AppPaths
{
    /// <summary>
    /// Returns the root config directory for the app.
    /// Creates the directory if it doesn't exist.
    /// </summary>
    public static string ConfigDirectory()
    {
        var cfg = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        if (string.IsNullOrWhiteSpace(cfg))
        {
            // Fallback for Linux environments where ApplicationData might be empty
            cfg = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".config");
        }

        var dir = Path.Combine(cfg, "linux-dev-typer");
        Directory.CreateDirectory(dir);
        return dir;
    }

    /// <summary>
    /// Returns the path to the state.json file.
    /// </summary>
    public static string StateFile() => Path.Combine(ConfigDirectory(), "state.json");

    /// <summary>
    /// Returns the path to the content library index file.
    /// The index lives next to state.json in the config directory.
    /// </summary>
    public static string LibraryIndexFile() => Path.Combine(ConfigDirectory(), "library.index.json");

    /// <summary>
    /// Returns the path to the user packs directory.
    /// Does NOT create the directory (user packs are optional).
    /// </summary>
    public static string PacksDirectory() => Path.Combine(ConfigDirectory(), "packs");

    /// <summary>
    /// Normalizes a language key for consistent cross-platform storage.
    /// Always lowercase, trimmed, no path separators.
    /// </summary>
    public static string NormalizeLanguageKey(string language)
    {
        var key = language.Trim().ToLowerInvariant();
        // Strip any accidental path separators (defensive)
        key = key.Replace('/', '_').Replace('\\', '_');
        return key;
    }
}
