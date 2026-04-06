using LinuxDevTyper.Core.Abstractions;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// No-op audio service. Placeholder until a platform-specific backend
/// (ManagedBass, SDL2, etc.) is integrated for Linux audio playback.
/// All calls are safe to make and will silently do nothing.
/// </summary>
public sealed class StubAudioService : IAudioService
{
    public bool AmbientMuted { get; set; }

    public void PlayKeyClick() { }
    public void PlayUiClick() { }
    public void StartAmbient() { }
    public void StopAmbient() { }
    public void SetAmbientVolume(double volume) { }
    public void SetKeyVolume(double volume) { }
    public void SetUiVolume(double volume) { }
    public void SetKeyboardTheme(string theme) { }
    public void SetSoundscape(string soundscape) { }
    public string? ShuffleAmbient() => null;
    public IReadOnlyList<string> ListKeyboardThemes() => [];
    public IReadOnlyList<string> ListSoundscapes() => [];
    public void Dispose() { }
}
