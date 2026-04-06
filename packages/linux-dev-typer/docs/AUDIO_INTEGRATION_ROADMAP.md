# Audio Integration Roadmap

Cross-platform audio contract between linux-dev-typer and dev-op-typer.

## Audio Spec Contract

### Keyboard SFX

| Property | Required |
|----------|----------|
| Format | 44100 Hz, 16-bit PCM, Mono WAV |
| Polyphonic | Yes (multiple overlapping sounds) |
| Latency | < 15 ms |
| Random selection | Pick random `key_NN.wav` per keypress |
| Pre-loading | Recommended (decode all into memory) |
| Volume control | Per-channel (0.0-1.0) |

### Ambient Soundscapes

| Property | Required |
|----------|----------|
| Format | 44100 Hz, 16-bit PCM, WAV |
| Looping | Yes (seamless repeat) |
| Pause/Resume | Yes (mute preserves position) |
| Volume control | Independent from SFX |

## Directory Layout Convention

```
assets/sounds/
  sfx/
    ui_click.wav
    {ThemeName}/key_01.wav ... key_NN.wav
  ambient/
    {SoundscapeName}/{descriptive_name}.wav ...
```

- Discovery is filesystem-based: scan subdirectories at startup
- Folder name = display name in UI dropdown
- No hardcoded theme or soundscape lists in code

## Platform Engines

| Platform | Keyboard SFX | Ambient |
|----------|-------------|---------|
| **Linux** (v0.1.1) | MiniAudioEx `PlayOneShot` | MiniAudioEx looping `AudioSource` |
| **Windows** (v0.1.1) | NAudio WASAPI `MixingSampleProvider` | Win32 `mciSendString` |

## Settings Persistence

```json
{
  "ambientVolume": 0.5,
  "keyVolume": 0.7,
  "uiVolume": 0.6,
  "keyboardSoundTheme": "Mechanical",
  "selectedSoundscape": "Zen"
}
```

## Version Parity Checklist

- [ ] 5 keyboard themes (AlpsCream, Mechanical, Membrane, SoftTouch, Topre)
- [ ] 4 soundscape categories (Ocean, Rain, Wind, Zen)
- [ ] 15 ambient tracks total (3+3+2+7)
- [ ] 41 SFX files total (40 keys + 1 ui_click)
- [ ] Theme dropdown auto-populated from filesystem
- [ ] Soundscape dropdown auto-populated from filesystem
- [ ] Random button shuffles within current soundscape
- [ ] Mute preserves playback position
- [ ] Independent volume sliders (Ambient, Keyboard, UI)
- [ ] Settings persisted between sessions
- [ ] Polyphonic keyboard SFX
- [ ] Ambient loops seamlessly
