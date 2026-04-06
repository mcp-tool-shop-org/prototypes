---
title: Architecture
description: Pipeline architecture, component breakdown, and security properties for Soundboard Plugin.
sidebar:
  order: 4
---

Soundboard Plugin sits between Claude Code and the voice-soundboard TTS engine. It receives text via stdio JSON-RPC, processes it through a multi-stage speech pipeline, and hands synthesised audio to a playback worker.

## Pipeline overview

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge ---- security/guardrails
    |                concurrency gate
    |                rate limiter
    |                structured errors
    v
speech pipeline
    |-- chunking         smart sentence splitting
    |-- ssml_lite        safe SSML subset parser
    |-- emotion/         8 emotions + voice routing
    |-- dialogue/        multi-speaker parser + casting
    |-- sfx_parser       <ding>/<chime> WAV generation
    |-- orchestrator     multi-chunk synthesis loop
    |-- concat           WAV concatenation
    v
voice-soundboard engine
    |-- Kokoro (local, default)
    |-- Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker ---- single-thread queue
    |-- 30s watchdog timer
    |-- interrupt / enqueue / drop policies
    |-- retention (auto-cleanup)
    v
PCM audio -> speakers
```

## Components

### stdio bridge

The entry point. Receives JSON-RPC messages from Claude Code over stdin, dispatches to the appropriate tool handler, and returns results over stdout. Includes health checks and graceful shutdown.

### Security and guardrails

All requests pass through the security layer before reaching the speech pipeline:

- **Concurrency gate** -- semaphore limits synthesis to one request at a time. Prevents resource exhaustion.
- **Rate limiter** -- configurable cooldown between requests. Disabled by default.
- **Input validation** -- 10,000 character maximum, speed clamped to 0.5-2.0x, chunk and line limits enforced.
- **Structured errors** -- every error returns a JSON object with code, message, hint, and trace ID. No stack traces leak to the client.

### Speech pipeline

The pipeline processes text through multiple stages:

1. **Chunking** (`chunking.py`) -- splits long text at sentence boundaries. Respects chunk size limits while keeping sentences intact.
2. **SSML-lite parser** (`ssml_lite.py`) -- parses a safe subset of SSML: `<break>`, `<emphasis>`, `<prosody>` (pitch and rate). Rejects unknown tags.
3. **Emotion routing** (`emotion/`) -- detects emotion from text context and maps to voice parameters. Supports 8 emotions with per-voice tuning.
4. **Dialogue parser** (`dialogue/`) -- identifies speakers in dialogue markup, auto-casts characters to voices, and applies stage directions and speed modifiers.
5. **SFX parser** (`sfx_parser.py`) -- recognises inline tags like `<ding>` and `<chime>`, generates pure-Python WAV tones at the correct position.
6. **Orchestrator** (`orchestrator.py`) -- coordinates multi-chunk synthesis. Sends chunks to the voice engine sequentially, collects results.
7. **Concatenation** (`concat.py`) -- joins multiple WAV segments into a single output file with correct headers.

### Voice-soundboard engine

The synthesis backend. Default is Kokoro for fully local inference. The plugin supports multiple backends (Piper, OpenAI, Azure, ElevenLabs) but only Kokoro runs without network access.

### Playback worker

Single-threaded audio worker with queue management:

- **Queue policies** -- replace (stop current, play latest), queue (play sequentially), drop (ignore new requests while busy).
- **Watchdog** -- 30-second timer kills stuck playback.
- **Retention** -- auto-deletes WAV files older than the configured retention window (default 240 minutes).

## Security properties

The plugin runs entirely on your machine. No network calls, no telemetry, no cloud APIs unless you explicitly configure a remote voice backend.

| Property | Implementation |
|----------|---------------|
| Input bounds | 10,000 char max, clamped speed (0.5-2.0x), chunk and line limits |
| Voice allowlist | 12 pre-approved voices, unknown IDs rejected with structured error |
| Path sandboxing | WAV output confined to `{tempdir}/voice-soundboard/` |
| Concurrency | Single synthesis at a time (semaphore gate) |
| Error safety | Structured JSON errors with trace IDs, no stack traces to client |
| Secret redaction | Paths, tokens, IPs, base64, key=value stripped from logs |
| WAV validation | RIFF/WAVE magic bytes + minimum size check on every output file |

For the full security policy and STRIDE-lite threat model, see the repository's `SECURITY.md` and `docs/SECURITY_THREAT_MODEL.md`.

## Project structure

```
soundboard-plugin/
  voice_soundboard_plugin/
    bridge/          MCP stdio server + health checks
    speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
      dialogue/      Multi-speaker parser + auto-casting
      emotion/       Emotion detection + voice routing
    playback/        Single-thread worker + retention
    ambient/         Inner monologue subsystem
    security/        Guardrails, fs sandbox, redaction, WAV validation
    audio/           Audio utilities
  tests/             326 tests (unit + integration + security battery)
  scripts/           ship_gate.py pre-release script
  docs/              Threat model, privacy policy, release checklist
```
