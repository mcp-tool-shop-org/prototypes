---
title: Reference
description: Commands, voices, presets, dialogue export, settings, and backends.
sidebar:
  order: 2
---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Voice Soundboard: Speak Text...` | — | Enter text to speak |
| `Voice Soundboard: Speak Selection` | `Ctrl+Shift+S` | Speak selected editor text |
| `Voice Soundboard: Stop Speaking` | — | Stop current playback |
| `Voice Soundboard: Change Voice` | — | Quick-pick voice selector |
| `Voice Soundboard: Toggle Soundboard Panel` | — | Show/hide sidebar |
| `Voice Soundboard: Export Dialogue as WebVTT` | — | Export dialogue script as `.vtt` subtitle file |

## Voices

48 voices across 8 languages:

| Language | Voices |
|----------|--------|
| English (US) | 12 voices (6 male, 6 female) |
| English (UK) | 4 voices |
| Japanese | 6 voices |
| Mandarin | 6 voices |
| Spanish | 4 voices |
| French | 4 voices |
| Hindi | 4 voices |
| Italian | 4 voices |
| Portuguese | 4 voices |

Each voice has a unique ID (e.g., `bm_george`, `af_sarah`) used in settings and dialogue scripts.

### Voice browsing

The **Voices** tab in the sidebar provides search and filtering:

- **Search** -- type part of a voice name or ID to filter the list
- **Filter chips** -- quick toggles for American, British, Japanese, Male, and Female
- **Preview** -- each voice card has a Preview button that plays a short sample

You can also change the active voice from the Command Palette with **Voice Soundboard: Change Voice**, which opens a quick-pick list showing every voice with its accent, gender, and style.

## Multi-speaker dialogue

The Dialogue tab lets you write multi-speaker scripts:

1. Write lines in `Speaker: Text` format (e.g., `Alice: Hello there!`)
2. Assign a voice to each speaker using the cast panel that appears below the script
3. Click **Play All** to hear the full dialogue sequentially
4. Click **Export VTT** to synthesize all lines and save as a WebVTT subtitle file

### WebVTT export

The exported `.vtt` file includes:

- Cumulative timecodes calculated from audio durations
- Voice tags (`<v Speaker>`) for each line
- Standard WebVTT format compatible with video players, subtitle editors, and accessibility tools

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | Default voice ID |
| `voiceSoundboard.speed` | `1.0` | Speech speed (0.5 to 2.0) |
| `voiceSoundboard.backend` | `python` | TTS backend (`python`, `http`, or `mock`) |
| `voiceSoundboard.autoStart` | `true` | Auto-start server on activation |
| `voiceSoundboard.format` | `wav` | Audio output format (`wav`, `mp3`, or `ogg`) |
| `voiceSoundboard.openaiApiKey` | `""` | OpenAI API key for cloud TTS (`http` backend) |
| `voiceSoundboard.pythonPath` | `""` | Path to Python executable (auto-detected if empty) |

## Backends

| Backend | How it works | Network |
|---------|-------------|---------|
| `python` (default) | Kokoro TTS via Python subprocess | No network — fully local |
| `http` | Connects to user-configured TTS API (OpenAI, ElevenLabs) | Requires API key, sends text to cloud |
| `mock` | Returns silence — for testing | No network |

:::caution
The `http` backend sends your text to an external API. If you need full privacy, use the default `python` backend which runs entirely on your machine.
:::

## Security and data scope

- **Local backend (default):** Kokoro TTS runs entirely on your machine — no network egress
- **Cloud backend (optional):** sends text to user-configured TTS API — requires explicit API key setup
- **Audio playback:** uses `spawn` with args array, not shell execution
- **No telemetry** is collected or sent
