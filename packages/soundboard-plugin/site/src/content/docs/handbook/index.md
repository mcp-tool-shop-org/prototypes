---
title: Soundboard Plugin Handbook
description: Complete guide to the Soundboard Plugin — emotion-aware TTS for Claude Code with 12 voices, multi-speaker dialogue, code narration, SSML-lite, and inner monologue.
sidebar:
  order: 0
---

Soundboard Plugin is a Claude Code plugin that gives your coding assistant a voice. It wraps the voice-soundboard TTS engine and exposes spoken output through slash commands and MCP tools, all running locally on your machine.

## What it does

- **Emotion-aware speech** -- detects context and routes to the right voice and tone across 8 emotions (neutral, serious, friendly, professional, calm, joy, urgent, whisper).
- **12 curated voices** -- male, female, American, British. Each voice has a distinct personality and is pre-approved for use.
- **Multi-speaker dialogue** -- auto-casting, stage directions, and speed modifiers let Claude narrate conversations between characters.
- **Code narration** -- `/soundboard:narrate` walks through source files with adaptive pacing, splitting at sentence boundaries.
- **SSML-lite** -- fine-grained control with pauses, emphasis, pitch, and rate tags.
- **Inline SFX** -- `<ding>` and `<chime>` generate pure-Python WAV tones inline.
- **Inner monologue** -- ambient system with rate limiting and automatic redaction. Claude can think out loud while working.
- **Workflow notifications** -- spoken alerts for build, test, and deploy events.

## How it works

The plugin runs as a stdio MCP server. Claude Code sends JSON-RPC messages to the plugin, which passes text through a speech pipeline (chunking, SSML parsing, emotion routing, dialogue parsing, SFX generation, orchestration, WAV concatenation) and hands the result to the voice-soundboard engine for synthesis and playback.

Everything runs locally. No network calls, no telemetry, no cloud APIs unless you explicitly configure a remote voice backend.

## Handbook contents

| Page | What you will find |
|------|-------------------|
| [Getting Started](./getting-started/) | Prerequisites, installation, first commands |
| [Commands](./commands/) | All 5 slash commands and the full MCP tool surface |
| [Voices](./voices/) | Voice table, emotion routing, configuration |
| [Architecture](./architecture/) | Pipeline diagram, component breakdown, security properties |
| [For Beginners](./beginners/) | Gentle introduction, first 5 minutes, common mistakes, glossary |
