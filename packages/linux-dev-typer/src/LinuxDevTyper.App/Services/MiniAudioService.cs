using LinuxDevTyper.Core.Abstractions;
using MiniAudioEx.Core.StandardAPI;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// Cross-platform audio playback using MiniAudioExNET (miniaudio backend).
/// Supports polyphonic key SFX, looping ambient soundscapes, and UI clicks
/// with independent per-channel volume control.
/// </summary>
public sealed class MiniAudioService : IAudioService
{
    private readonly string _soundsBasePath;
    private readonly Random _rng = new();

    // Three separate AudioSources for independent volume control.
    // maxSources on SFX sources sets the PlayOneShot polyphony pool size.
    private readonly AudioSource _keySfxSource;
    private readonly AudioSource _uiSfxSource;
    private readonly AudioSource _ambientSource;

    // Pre-loaded SFX clips (small, kept in memory)
    private AudioClip? _uiClickClip;
    private AudioClip[] _keyClips = [];

    // Ambient state
    private AudioClip? _currentAmbientClip;
    private string[] _currentSoundscapeTracks = [];
    private int _currentTrackIndex = -1;
    private float _ambientVolume = 0.5f;
    private float _savedAmbientVolume = 0.5f;
    private bool _ambientMuted;

    // SFX volume state
    private float _keyVolume = 0.7f;
    private float _uiVolume = 0.6f;

    // Current selections
    private string _currentTheme = "";
    private string _currentSoundscape = "";

    private bool _disposed;

    public MiniAudioService(string soundsBasePath)
    {
        _soundsBasePath = soundsBasePath;

        // Initialize miniaudio engine: 44100 Hz stereo, default period size + device
        AudioContext.Initialize(44100, 2);

        // SFX sources: pool of 8 concurrent one-shot sounds each
        _keySfxSource = new AudioSource(8);
        _keySfxSource.Volume = _keyVolume;

        _uiSfxSource = new AudioSource(4);
        _uiSfxSource.Volume = _uiVolume;

        // Ambient source: single looping track
        _ambientSource = new AudioSource(1);
        _ambientSource.Loop = true;
        _ambientSource.Volume = _ambientVolume;

        // Load UI click if available
        var uiClickPath = SoundDiscoveryService.GetUiClickPath(soundsBasePath);
        if (uiClickPath != null)
        {
            _uiClickClip = new AudioClip(uiClickPath, false);
        }
    }

    public bool AmbientMuted
    {
        get => _ambientMuted;
        set
        {
            _ambientMuted = value;
            if (value)
            {
                // Mute by setting volume to 0 (preserves playback position)
                _savedAmbientVolume = _ambientVolume;
                _ambientSource.Volume = 0f;
            }
            else
            {
                // Unmute: restore saved volume
                _ambientSource.Volume = _savedAmbientVolume;
            }
        }
    }

    public void PlayKeyClick()
    {
        if (_keyClips.Length == 0) return;
        var clip = _keyClips[_rng.Next(_keyClips.Length)];
        _keySfxSource.PlayOneShot(clip);
    }

    public void PlayUiClick()
    {
        if (_uiClickClip == null) return;
        _uiSfxSource.PlayOneShot(_uiClickClip);
    }

    public void StartAmbient()
    {
        if (_currentSoundscapeTracks.Length == 0) return;

        // Pick a random track if none selected yet
        if (_currentTrackIndex < 0 || _currentTrackIndex >= _currentSoundscapeTracks.Length)
            _currentTrackIndex = _rng.Next(_currentSoundscapeTracks.Length);

        LoadAndPlayAmbientTrack(_currentTrackIndex);
    }

    public void StopAmbient()
    {
        _ambientSource.Stop();
    }

    public void SetAmbientVolume(double volume)
    {
        _ambientVolume = (float)Math.Clamp(volume, 0.0, 1.0);
        _savedAmbientVolume = _ambientVolume;
        if (!_ambientMuted)
        {
            _ambientSource.Volume = _ambientVolume;
        }
    }

    public void SetKeyVolume(double volume)
    {
        _keyVolume = (float)Math.Clamp(volume, 0.0, 1.0);
        _keySfxSource.Volume = _keyVolume;
    }

    public void SetUiVolume(double volume)
    {
        _uiVolume = (float)Math.Clamp(volume, 0.0, 1.0);
        _uiSfxSource.Volume = _uiVolume;
    }

    public void SetKeyboardTheme(string theme)
    {
        if (string.Equals(_currentTheme, theme, StringComparison.OrdinalIgnoreCase))
            return;

        // Dispose old clips
        foreach (var clip in _keyClips)
            clip.Dispose();

        // Load new theme clips
        var paths = SoundDiscoveryService.GetKeyClipPaths(_soundsBasePath, theme);
        _keyClips = paths.Select(p => new AudioClip(p, false)).ToArray();
        _currentTheme = theme;
    }

    public void SetSoundscape(string soundscape)
    {
        if (string.Equals(_currentSoundscape, soundscape, StringComparison.OrdinalIgnoreCase))
            return;

        _currentSoundscapeTracks = SoundDiscoveryService.GetAmbientTrackPaths(_soundsBasePath, soundscape);
        _currentTrackIndex = -1; // reset for next StartAmbient
        _currentSoundscape = soundscape;
    }

    public string? ShuffleAmbient()
    {
        // Collect all tracks across every soundscape
        var allSoundscapes = SoundDiscoveryService.DiscoverSoundscapes(_soundsBasePath);
        if (allSoundscapes.Count == 0) return null;

        // Build a flat list of (soundscape, trackPath) pairs
        var allTracks = new List<(string soundscape, string path)>();
        foreach (var sc in allSoundscapes)
        {
            var tracks = SoundDiscoveryService.GetAmbientTrackPaths(_soundsBasePath, sc);
            foreach (var t in tracks)
                allTracks.Add((sc, t));
        }

        if (allTracks.Count == 0) return null;

        // Pick a random track, avoiding the current one if possible
        var currentPath = (_currentTrackIndex >= 0 && _currentTrackIndex < _currentSoundscapeTracks.Length)
            ? _currentSoundscapeTracks[_currentTrackIndex]
            : null;

        int pick;
        if (allTracks.Count == 1)
        {
            pick = 0;
        }
        else
        {
            do { pick = _rng.Next(allTracks.Count); }
            while (allTracks[pick].path == currentPath);
        }

        var (newSoundscape, newPath) = allTracks[pick];

        // Switch soundscape if different
        if (!string.Equals(_currentSoundscape, newSoundscape, StringComparison.OrdinalIgnoreCase))
        {
            _currentSoundscapeTracks = SoundDiscoveryService.GetAmbientTrackPaths(_soundsBasePath, newSoundscape);
            _currentSoundscape = newSoundscape;
        }

        // Find the track index within its soundscape
        _currentTrackIndex = Array.IndexOf(_currentSoundscapeTracks, newPath);
        LoadAndPlayAmbientTrack(_currentTrackIndex);

        return newSoundscape;
    }

    public IReadOnlyList<string> ListKeyboardThemes()
        => SoundDiscoveryService.DiscoverKeyboardThemes(_soundsBasePath);

    public IReadOnlyList<string> ListSoundscapes()
        => SoundDiscoveryService.DiscoverSoundscapes(_soundsBasePath);

    private void LoadAndPlayAmbientTrack(int index)
    {
        if (index < 0 || index >= _currentSoundscapeTracks.Length) return;

        _ambientSource.Stop();
        _currentAmbientClip?.Dispose();

        var path = _currentSoundscapeTracks[index];
        _currentAmbientClip = new AudioClip(path, true); // stream from disk (large files)
        _ambientSource.Play(_currentAmbientClip);

        // Apply mute state after play
        _ambientSource.Volume = _ambientMuted ? 0f : _ambientVolume;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _ambientSource.Stop();
        _currentAmbientClip?.Dispose();

        foreach (var clip in _keyClips)
            clip.Dispose();

        _uiClickClip?.Dispose();

        _keySfxSource.Dispose();
        _uiSfxSource.Dispose();
        _ambientSource.Dispose();

        AudioContext.Deinitialize();
    }
}
