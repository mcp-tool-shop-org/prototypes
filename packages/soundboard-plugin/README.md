<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## Highlights

- **12 curated voices** with emotion-aware routing (neutral, serious, friendly, professional, calm, joy, urgent, whisper)
- **Multi-speaker dialogue** with auto-casting, stage directions, and speed modifiers
- **Smart chunking** splits long text at sentence boundaries with interrupt support
- **SSML-lite** for fine-grained control (pauses, emphasis, pitch, rate)
- **SFX tags** generate pure-Python WAV chimes inline (`<ding>`, `<chime>`)
- **Inner monologue** ambient system with rate limiting and automatic redaction
- **Playback hardening** single-thread worker, 30s watchdog, queue policies (replace / queue / drop)
- **Security-first** path sandboxing, concurrency gate, structured errors, WAV validation

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/soundboard:speak` | General TTS with emotion detection and SSML support |
| `/soundboard:narrate` | Code walkthrough narration with adaptive pacing |
| `/soundboard:notify` | Spoken workflow notifications (build, test, deploy events) |
| `/soundboard:voices` | List available voices and presets |
| `/soundboard:voice-status` | Engine health, backend info, enforced limits |

Plus the full MCP tool surface: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Quick Start

### Prerequisites

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (the synthesis engine)
- Python >= 3.10
- Windows (primary target; uses `winsound` for playback)

### Install

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Try it

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Architecture

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## Security

This plugin runs **entirely on your machine**. No network calls, no telemetry, no cloud APIs (unless you configure a remote voice backend).

| Property | Implementation |
|----------|---------------|
| Input bounds | 10,000 char max, clamped speed, chunk/line limits |
| Voice allowlist | 12 pre-approved voices, unknown rejected |
| Path sandboxing | WAV output confined to `{tempdir}/voice-soundboard/` |
| Concurrency | Single synthesis at a time (semaphore gate) |
| Error safety | Structured JSON errors with trace IDs, no stack traces to client |
| Secret redaction | Paths, tokens, IPs, base64, key=value stripped from logs |
| WAV validation | RIFF/WAVE magic + minimum size check on every output |

See [`SECURITY.md`](SECURITY.md) for the full policy and [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) for the STRIDE-lite threat model.

## Voices

12 curated voices ship with the plugin:

| Voice | ID | Gender | Style |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Powerful, authoritative (default) |
| Eric | `am_eric` | M | Energetic, urgent |
| Liam | `am_liam` | M | Warm, conversational |
| Onyx | `am_onyx` | M | Deep, steady |
| Aoede | `af_aoede` | F | Clear, expressive |
| Jessica | `af_jessica` | F | Professional, neutral |
| Sky | `af_sky` | F | Bright, friendly |
| Alice | `bf_alice` | F | British, composed |
| Emma | `bf_emma` | F | British, warm |
| Isabella | `bf_isabella` | F | British, refined |
| George | `bm_george` | M | British, formal |
| Lewis | `bm_lewis` | M | British, measured |

## Configuration

All configuration is via environment variables (no config files):

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV output directory |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (disabled) | Per-tool rate limit cooldown |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Auto-delete WAVs older than this |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Enable inner monologue system |

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (326 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## Project Structure

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               326 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## Security & Data Scope

- **Data accessed:** Reads text input for TTS synthesis. Processes speech through local voice engine. SSML parsing uses a safe subset parser. Inner monologue redacts secrets before storage.
- **Data NOT accessed:** No network egress by default. No telemetry, analytics, or tracking. No user data storage beyond transient WAV files. Remote voice backends are opt-in.
- **Permissions required:** Read access to voice engine. Optional write access for WAV output directory.

## Scorecard

| Gate | Status |
|------|--------|
| A. Security Baseline | PASS |
| B. Error Handling | PASS |
| C. Operator Docs | PASS |
| D. Shipping Hygiene | PASS |
| E. Identity | PASS |

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
