namespace LinuxDevTyper.Core.Abstractions;

/// <summary>
/// Audio playback abstraction. Implementations handle platform-specific backends.
/// </summary>
public interface IAudioService : IDisposable
{
    /// <summary>Play a key-click sound effect (throttled by implementation).</summary>
    void PlayKeyClick();

    /// <summary>Play UI click sound (button press, etc.).</summary>
    void PlayUiClick();

    /// <summary>Start ambient background audio loop. Picks randomly from available tracks.</summary>
    void StartAmbient();

    /// <summary>Stop ambient audio.</summary>
    void StopAmbient();

    /// <summary>Set ambient volume (0.0 to 1.0).</summary>
    void SetAmbientVolume(double volume);

    /// <summary>Set key-click SFX volume (0.0 to 1.0).</summary>
    void SetKeyVolume(double volume);

    /// <summary>Set UI sound volume (0.0 to 1.0).</summary>
    void SetUiVolume(double volume);

    /// <summary>Mute/unmute ambient audio.</summary>
    bool AmbientMuted { get; set; }

    /// <summary>Set the active keyboard sound theme (folder name under sfx/).</summary>
    void SetKeyboardTheme(string theme);

    /// <summary>Set the active ambient soundscape (folder name under ambient/).</summary>
    void SetSoundscape(string soundscape);

    /// <summary>Shuffle to a random track across all soundscapes, returns the new soundscape name.</summary>
    string? ShuffleAmbient();

    /// <summary>Get available keyboard themes (discovered from filesystem).</summary>
    IReadOnlyList<string> ListKeyboardThemes();

    /// <summary>Get available soundscapes (discovered from filesystem).</summary>
    IReadOnlyList<string> ListSoundscapes();
}
