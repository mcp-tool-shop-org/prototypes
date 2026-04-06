---
title: Getting Started
description: Install and configure Soundboard Plugin for Claude Code.
sidebar:
  order: 1
---

This page covers everything you need to get Soundboard Plugin running with Claude Code.

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| voice-soundboard | >= 2.5.0 | The TTS synthesis engine. Install with Kokoro backend for local inference. |
| Python | >= 3.10 | Required for both the engine and the plugin. |
| Platform | Windows | Primary target. Uses `winsound` for playback. |

The voice-soundboard engine is a separate package that handles the actual speech synthesis. Soundboard Plugin is the Claude Code integration layer that sits on top of it.

## Install

### 1. Install the voice engine

```bash
cd voice-soundboard
pip install -e ".[kokoro]"
```

The `[kokoro]` extra pulls in the Kokoro TTS backend for fully local inference. No API keys or cloud services required.

### 2. Install the plugin

```bash
cd soundboard-plugin
pip install -e .
```

### 3. Register with Claude Code

```bash
claude plugin add /path/to/soundboard-plugin
```

This tells Claude Code where to find the plugin. The plugin starts as a stdio MCP server when Claude Code launches.

## Try it

Once installed, open Claude Code and run these commands:

```
/soundboard:speak Hello! I'm your coding assistant.
```

You should hear spoken audio through your default speakers. Try a few more:

```
/soundboard:narrate src/server.py
```

This walks through a source file with adaptive pacing, splitting at sentence boundaries.

```
/soundboard:notify Build succeeded with 0 warnings
```

Spoken workflow notification using the announcer preset.

```
/soundboard:voices
```

Lists all 12 available voices and their presets.

```
/soundboard:voice-status
```

Shows engine health, backend info, and enforced limits. Useful for troubleshooting.

## Graceful degradation

If the voice engine is not running or not installed, the plugin stays loaded but all voice tools return descriptive error messages instead of crashing. Check status with `/soundboard:voice-status` to diagnose issues.

## Next steps

- [Commands](./commands/) -- full reference for all slash commands and MCP tools.
- [Voices](./voices/) -- browse the voice library and configure emotion routing.
- [Architecture](./architecture/) -- understand the speech pipeline and security model.
