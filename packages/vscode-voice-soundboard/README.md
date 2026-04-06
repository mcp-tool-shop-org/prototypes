<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Text-to-speech extension with 48 voices, presets, and multi-speaker dialogue — powered by [MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard).

## Features

- **Sidebar panel** with Speak, Voices, and Dialogue tabs
- **48 voices** across 8 languages (English, Japanese, Mandarin, Spanish, French, Hindi, Italian, Portuguese)
- **5 presets** — Assistant, Narrator, Announcer, Storyteller, Whisper
- **Multi-speaker dialogue** — write scripts, assign voices, play all
- **Speak Selection** — highlight code or text and press `Ctrl+Shift+S`
- **Cross-platform** audio playback (Windows, macOS, Linux)

## Getting Started

1. Install the extension
2. The MCP Voice Soundboard server starts automatically
3. Click the microphone icon in the activity bar
4. Type text and click **Speak**

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Voice Soundboard: Speak Text... | — | Enter text to speak |
| Voice Soundboard: Speak Selection | `Ctrl+Shift+S` | Speak selected editor text |
| Voice Soundboard: Stop Speaking | — | Stop current playback |
| Voice Soundboard: Change Voice | — | Quick-pick voice selector |
| Voice Soundboard: Toggle Soundboard Panel | — | Show/hide sidebar |
| Voice Soundboard: Export Dialogue as WebVTT | — | Export dialogue script as `.vtt` subtitle file |

## Dialogue Export

Write a multi-speaker script in the Dialogue tab, assign voices, then click **Export VTT**. The extension synthesizes each line, calculates cumulative timecodes from the audio durations, and saves a [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) subtitle file.

The exported `.vtt` file uses voice tags (`<v Speaker>`) and can be used with video players, subtitle editors, or accessibility tools.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | Default voice ID |
| `voiceSoundboard.speed` | `1.0` | Speech speed (0.5–2.0) |
| `voiceSoundboard.backend` | `python` | TTS backend (python/http/mock) |
| `voiceSoundboard.autoStart` | `true` | Auto-start server on activation |
| `voiceSoundboard.format` | `wav` | Audio output format (wav, mp3, ogg) |
| `voiceSoundboard.openaiApiKey` | `""` | OpenAI API key for cloud TTS (http backend) |
| `voiceSoundboard.pythonPath` | `""` | Path to Python executable (auto-detected if empty) |

## Security & Data Scope

- **Local backend (default):** Python/Kokoro TTS runs entirely on your machine — no network egress
- **Cloud backend (optional):** sends text to user-configured TTS API (OpenAI/ElevenLabs) — requires explicit API key
- **Audio playback:** uses `spawn` with args array, not shell — see [SECURITY.md](SECURITY.md) for details
- **No telemetry** is collected or sent

## License

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
