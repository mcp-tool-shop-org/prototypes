# soundboard-plugin

## What This Plugin Does

This plugin gives Claude Code a voice. It wraps the voice-soundboard TTS engine
and provides spoken output for code walkthroughs, workflow notifications, and
general text-to-speech.

## MCP Tools Available

When the voice engine is running, these MCP tools are available:

| Tool | Purpose |
|------|---------|
| `voice.speak` | Synthesise speech from text |
| `voice.stream` | Stream speech for low-latency playback |
| `voice.interrupt` | Stop active audio |
| `voice.list_voices` | List available voices and presets |
| `voice.status` | Check engine health and capabilities |
| `voice.narrate` | Code-aware narration with adaptive pacing |
| `voice.workflow_notify` | Speak workflow event notifications |
| `voice.dialogue` | Multi-speaker dialogue synthesis |
| `voice.inner_monologue` | Ambient inner monologue (rate-limited, redacted) |
| `voice.playback_diagnose` | Diagnose playback issues and test audio |
| `voice.ambient_enable` | Enable or disable inner monologue at runtime |
| `voice.ambient_mute` | Temporarily mute inner monologue |

## Context-Aware Voice (Automatic)

When using voice.speak, select emotion based on context:

| Context | Emotion | Voice |
|---------|---------|-------|
| Explaining code | neutral | bm_george (default neutral voice) |
| Warning about errors | urgent | am_eric (announcer) |
| Celebrating success | joy | am_liam (friendly) |
| General conversation | neutral | bm_george |

## Presets

| Preset | Voice | Speed | Use For |
|--------|-------|-------|---------|
| default | am_fenrir | 1.0x | Powerful, commanding |
| narrator | am_fenrir | 0.95x | Code walkthroughs, explanations |
| announcer | am_eric | 1.1x | Notifications, announcements |
| storyteller | bf_emma | 0.9x | Long-form narration |
| friendly | am_liam | 1.0x | Warm, approachable |
| professional | af_jessica | 1.0x | Clear, business-ready |

## Graceful Degradation

If the voice engine is not available, all tools return descriptive error messages
instead of crashing. The plugin remains loaded but voice features are inactive.
Check status with `/soundboard:voice-status`.

## Dependencies

- voice-soundboard >= 2.5.0 (F:\AI\voice-soundboard)
- Python >= 3.10
- mcp >= 1.0.0
