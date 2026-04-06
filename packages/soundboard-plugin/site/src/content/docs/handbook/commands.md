---
title: Commands
description: Slash commands and MCP tool reference for Soundboard Plugin.
sidebar:
  order: 2
---

Soundboard Plugin exposes 5 slash commands for quick access and a full MCP tool surface for programmatic control.

## Slash commands

| Command | What it does |
|---------|-------------|
| `/soundboard:speak` | General TTS with emotion detection and SSML support. Accepts plain text, SSML-lite tags, or dialogue markup. |
| `/soundboard:narrate` | Code walkthrough narration with adaptive pacing. Pass a file path and the plugin reads, chunks, and speaks the code with context-aware speed. |
| `/soundboard:notify` | Spoken workflow notifications. Designed for build, test, and deploy events. Uses the announcer voice preset by default. |
| `/soundboard:voices` | List all available voices and presets. Shows voice ID, gender, style, and default emotion routing. |
| `/soundboard:voice-status` | Engine health check. Reports backend info, active voice, queue depth, enforced limits, and any errors. |

## MCP tool surface

These tools are available when the voice engine is running. Claude Code calls them automatically based on context, or you can invoke them through the plugin.

### voice.speak

Synthesise speech from text. Supports plain text, SSML-lite tags, and emotion hints.

**Parameters:**
- `text` (string, required) -- the text to speak.
- `voice` (string, optional) -- voice ID or preset name (e.g., `am_fenrir`, `narrator`).
- `emotion` (string, optional) -- emotion hint (neutral, serious, friendly, professional, calm, joy, urgent, whisper).
- `speed` (number, optional) -- playback speed multiplier (0.5 to 2.0).
- `format` (string, optional) -- input format: `plain` (default) or `ssml`.
- `chunking` (string, optional) -- chunking strategy: `auto` (default) or `off`.
- `concat` (boolean, optional) -- if true, concatenate multi-chunk audio into a single WAV file.

### voice.stream

Stream speech for low-latency playback. Chunks are synthesised and played as they arrive rather than waiting for the full text.

**Parameters:**
- `text` (string, required) -- the text to stream.
- `voice` (string, optional) -- voice ID override.

### voice.dialogue

Multi-speaker dialogue synthesis. Parses dialogue markup with character names, stage directions, and speed modifiers. Auto-casts characters to voices.

**Parameters:**
- `script` (string, required) -- dialogue script with `Speaker: text` lines. Supports `[pause Xms]` directives, `#` comments, and blank lines.
- `cast` (object, optional) -- explicit speaker-to-voice mapping (keys are speaker names, values are voice IDs or preset names).
- `speed` (number, optional) -- base speed multiplier for all lines (0.5 to 2.0).
- `concat` (boolean, optional) -- if true, concatenate all line audio into a single WAV file (default: true).
- `debug` (boolean, optional) -- if true, include cue sheet and parse warnings in response.

### voice.inner_monologue

Ambient inner monologue. Rate-limited, automatically redacted, volatile. Requires `VOICE_SOUNDBOARD_AMBIENT_ENABLED=1`.

**Parameters:**
- `text` (string, required) -- monologue text (max 500 chars, sensitive content auto-redacted).
- `category` (string, optional) -- category tag: `general` (default), `thinking`, `observation`, or `debug`.

### voice.interrupt

Stop all active audio immediately. Clears the playback queue.

**Parameters:** None.

### voice.list_voices

List available voices and presets. Returns voice ID, gender, style, and emotion routing for each voice.

**Parameters:** None.

### voice.status

Check engine health and capabilities. Returns backend info, active voice, queue state, and enforced limits.

**Parameters:** None.

### voice.narrate

Code-aware narration with adaptive pacing. Designed for spoken code reviews and explanations.

**Parameters:**
- `text` (string, required) -- the narration script to speak (plain-language walkthrough, not raw code).
- `voice` (string, optional) -- voice ID or preset name (default: `am_fenrir`).
- `speed` (number, optional) -- speed multiplier (default: 0.95 for narrator pace, range 0.5 to 2.0).

### voice.workflow_notify

Speak a short workflow notification with context-aware emotion.

**Parameters:**
- `event_type` (string, required) -- type of workflow event: `build_success`, `build_fail`, `tests_pass`, `tests_fail`, `commit`, `pr_merged`, or `deploy`.
- `message` (string, required) -- short message to speak (e.g., "All 47 tests passed").

### voice.playback_diagnose

Diagnose playback system: device info, playback mode, env toggles, and optional test beep. Use when audio is silent or misconfigured.

**Parameters:**
- `play_test_beep` (boolean, optional) -- play a short test chime (default: true).

### voice.ambient_enable

Enable or disable the inner monologue (ambient) system at runtime. Does not require restart.

**Parameters:**
- `enabled` (boolean, required) -- true to enable, false to disable.

### voice.ambient_mute

Temporarily mute the inner monologue for a given number of minutes. The system remains enabled but suppresses output.

**Parameters:**
- `minutes` (integer, optional) -- minutes to mute (default: 10, range 1 to 1440).
