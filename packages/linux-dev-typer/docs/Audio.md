# linux-dev-typer Audio System

## Architecture

linux-dev-typer uses MiniAudioExNET (miniaudio backend) for cross-platform audio:

| Channel | Engine | Format | Playback |
|---------|--------|--------|----------|
| **Keyboard SFX** | MiniAudioEx `AudioSource.PlayOneShot` | 44100 Hz, 16-bit PCM mono `.wav` | Polyphonic (pool of 8), random selection per keypress |
| **UI SFX** | MiniAudioEx `AudioSource.PlayOneShot` | 44100 Hz, 16-bit PCM mono `.wav` | Single UI click sound |
| **Ambient** | MiniAudioEx `AudioSource` with `Loop = true` | 44100 Hz, 16-bit PCM `.wav` | Single-track looping, streamed from disk |

All audio content is discovered dynamically at startup from the filesystem.

## Directory Structure

```
assets/sounds/
  sfx/
    ui_click.wav
    AlpsCream/key_01.wav ... key_08.wav
    Mechanical/key_01.wav ... key_08.wav
    Membrane/key_01.wav ... key_08.wav
    SoftTouch/key_01.wav ... key_08.wav
    Topre/key_01.wav ... key_08.wav
  ambient/
    Ocean/    (3 tracks)
    Rain/     (3 tracks)
    Wind/     (2 tracks)
    Zen/      (7 tracks)
```

The folder name becomes the display name in the Settings panel dropdown.

## Adding a Keyboard Theme

1. Create a directory under `assets/sounds/sfx/` (e.g. `HolyPanda/`)
2. Add 4-16 files named `key_01.wav`, `key_02.wav`, etc.
3. Build. The theme appears in the **Keyboard Sound** dropdown automatically.

### Audio specs

| Property | Value |
|----------|-------|
| Sample rate | 44100 Hz |
| Bit depth | 16-bit PCM |
| Channels | Mono |
| Duration | 60-150 ms recommended |
| Peak level | -1 to -3 dBFS |
| Naming | `key_01.wav` through `key_NN.wav` |

### Current themes

| Theme | Type | Description | Duration |
|-------|------|-------------|----------|
| **AlpsCream** | Synthesized | Vintage Alps damped linear, warm metallic leaf spring | 110 ms |
| **Mechanical** | CC0 recording | Real Cherry MX switch recordings | varies |
| **Membrane** | Synthesized | Rubber dome, muted thud with housing resonance | 90 ms |
| **SoftTouch** | Synthesized | Quiet laptop chiclet, gentle taps | 60 ms |
| **Topre** | Synthesized | HHKB-style dome collapse + spring pop | 120 ms |

## Adding a Soundscape

1. Create a directory under `assets/sounds/ambient/` (e.g. `CoffeeShop/`)
2. Add one or more `.wav` files (any naming convention)
3. Build. The soundscape appears in the **Soundscape** dropdown automatically.

### Audio specs

| Property | Value |
|----------|-------|
| Sample rate | 44100 Hz |
| Bit depth | 16-bit PCM |
| Channels | Mono or Stereo |
| Duration | 30 seconds minimum, 2-5 minutes ideal |
| Loop point | Seamless loop preferred |

## Playback Behavior

- On startup, plays a random track from the selected soundscape
- **Random button** shuffles to a different track within the current soundscape
- **Mute checkbox** sets ambient volume to 0 (preserves playback position)
- **Soundscape dropdown** switches category and starts a new track
- **Keyboard theme dropdown** switches SFX set immediately

## Converting audio

```bash
# Key SFX spec
ffmpeg -i input.wav -ar 44100 -ac 1 -sample_fmt s16 key_01.wav

# Ambient spec (stereo ok)
ffmpeg -i input.wav -ar 44100 -sample_fmt s16 ambient_track.wav
```
