# Soundboard Plugin — Operator Handbook

> Everything you need to install, configure, operate, troubleshoot, and extend
> the voice-soundboard Claude Code plugin.

---

## Table of Contents

- [1. What Is This?](#1-what-is-this)
- [2. Installation](#2-installation)
- [3. Slash Commands](#3-slash-commands)
- [4. MCP Tools Reference](#4-mcp-tools-reference)
- [5. Voices](#5-voices)
- [6. Emotions](#6-emotions)
- [7. Multi-Speaker Dialogue](#7-multi-speaker-dialogue)
- [8. SSML-Lite Markup](#8-ssml-lite-markup)
- [9. SFX Sound Effects](#9-sfx-sound-effects)
- [10. Chunking](#10-chunking)
- [11. Concatenation](#11-concatenation)
- [12. Playback](#12-playback)
- [13. Inner Monologue (Ambient)](#13-inner-monologue-ambient)
- [14. Filesystem & Output](#14-filesystem--output)
- [15. Security](#15-security)
- [16. Environment Variables](#16-environment-variables)
- [17. Error Codes](#17-error-codes)
- [18. Auto-Notifications Hook](#18-auto-notifications-hook)
- [19. Limits Reference](#19-limits-reference)
- [20. Testing & Release](#20-testing--release)
- [21. Troubleshooting](#21-troubleshooting)
- [22. ELI5 — Explain Like I'm 5](#22-eli5--explain-like-im-5)

---

## 1. What Is This?

The soundboard plugin gives Claude Code a voice. It runs as a **local MCP
server** over stdio (JSON-RPC) that takes text from Claude, converts it to
speech using the [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)
engine, and plays it through your speakers.

No network calls. No cloud APIs. No telemetry. Everything runs on your machine.

### What It Can Do

- Speak any text with emotion-aware voice selection
- Narrate code walkthroughs with natural pacing
- Announce build results, test outcomes, and deploy events automatically
- Run multi-speaker dialogue scripts with auto-casting
- Generate inline sound effects (dings, chimes, clicks)
- Maintain a whispering "inner monologue" ambient channel

---

## 2. Installation

### Prerequisites

| Requirement | Minimum |
|-------------|---------|
| Python | 3.10+ |
| voice-soundboard | 2.5.0+ |
| OS | Windows (primary; uses `winsound`) |
| mcp SDK | 1.0.0+ |

### Steps

```bash
# 1. Install the voice engine with Kokoro backend
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Verify

After installation, use `/soundboard:voice-status` in Claude Code. You should
see a healthy engine with backend information and the 12 approved voices.

---

## 3. Slash Commands

These are the user-facing commands available in Claude Code:

| Command | Purpose |
|---------|---------|
| `/soundboard:speak` | General text-to-speech. Supports emotion, SSML, and chunking. |
| `/soundboard:narrate` | Narrate a code walkthrough with adaptive pacing. |
| `/soundboard:notify` | Spoken workflow notification (build, test, deploy). |
| `/soundboard:voices` | List all available voices and presets. |
| `/soundboard:voice-status` | Show engine health, backend, and enforced limits. |

### Quick Examples

```
/soundboard:speak Hello, I'm your coding assistant!
/soundboard:speak {joy}All tests passed!{/joy}
/soundboard:narrate Walk me through how the auth middleware works
/soundboard:notify Build succeeded with 0 warnings
/soundboard:voices
```

---

## 4. MCP Tools Reference

Under the hood, slash commands map to MCP tools. You can also use these tools
directly in your prompts (Claude will pick them up naturally).

### voice.speak

General-purpose text-to-speech.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | yes | — | Text to synthesize |
| `voice` | string | no | `am_fenrir` | Voice ID or preset name |
| `speed` | number | no | `1.0` | Speed multiplier (0.5–2.0) |
| `emotion` | string | no | — | Emotion name (see [Emotions](#6-emotions)) |
| `format` | string | no | `plain` | `plain` or `ssml` |
| `chunking` | string | no | `auto` | `auto` or `off` |
| `concat` | boolean | no | `false` | Merge multi-chunk audio into one WAV |

Three code paths:
1. **SFX path** — if SFX is enabled and text contains `[tag]` patterns
2. **Emotion span path** — if text contains `{emotion}...{/emotion}` markup
3. **Standard path** — everything else

### voice.narrate

Code walkthrough narration with slower default pace.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | yes | — | Narration script (plain language, not raw code) |
| `voice` | string | no | `am_fenrir` | Any approved voice |
| `speed` | number | no | `0.95` | Narrator pace (0.5–2.0) |

Internally applies `AdaptivePacer` and `SmartSilence` from the engine's
intelligence modules (if available) for natural section-boundary pauses.

### voice.workflow_notify

Spoken notification with pre-mapped emotion and voice per event type.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `event_type` | string | yes | — | Event kind (see table below) |
| `message` | string | yes | — | Short message to speak |

**Event type mapping:**

| Event | Emotion | Voice | Speed |
|-------|---------|-------|-------|
| `build_success` | joy | am_eric | 1.2 |
| `build_fail` | sadness | am_fenrir | 0.95 |
| `tests_pass` | joy | am_eric | 1.2 |
| `tests_fail` | anger | am_fenrir | 0.95 |
| `commit` | neutral | am_fenrir | 1.0 |
| `pr_merged` | joy | am_liam | 1.1 |
| `deploy` | surprise | am_eric | 1.2 |

### voice.dialogue

Multi-speaker dialogue with auto-casting and stage directions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script` | string | yes | — | Dialogue script (see [Dialogue](#7-multi-speaker-dialogue)) |
| `cast` | object | no | — | `{"Speaker": "voice_id"}` mapping |
| `speed` | number | no | `1.0` | Base speed for all lines (0.5–2.0) |
| `concat` | boolean | no | `true` | Merge all lines into one WAV |
| `debug` | boolean | no | `false` | Include cue sheet and parse warnings |

### voice.stream

Streaming synthesis for lower-latency first-audio.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | yes | — | Text to synthesize |
| `voice` | string | no | — | Voice identifier |
| `chunk_size_ms` | integer | no | `100` | Stream chunk size in ms |
| `interruptible` | boolean | no | `true` | Allow interruption |

> Note: The bridge plays the complete result after synthesis. This tool is
> primarily useful for reducing time-to-first-audio within the engine.

### voice.inner_monologue

Submit an ephemeral micro-utterance to the ambient system.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | yes | — | Monologue text (max 500 chars) |
| `category` | string | no | `general` | `general`, `thinking`, `observation`, `debug` |

Requires `VOICE_SOUNDBOARD_AMBIENT_ENABLED=1`. Rate-limited to one entry per
cooldown window (default 60 seconds). Sensitive content is automatically
redacted.

### voice.interrupt

Stop active audio playback.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `reason` | string | no | `manual` | `user_spoke`, `context_change`, `timeout`, `manual` |
| `stream_id` | string | no | — | Specific stream to interrupt |
| `fade_out_ms` | integer | no | `50` | Fade-out duration in ms |

### voice.list_voices

Returns only the 12 approved voices (filtered from engine's full list).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `backend` | string | no | — | Filter by backend |
| `gender` | string | no | — | `male`, `female`, or `neutral` |
| `language` | string | no | — | Language code (e.g., `en`) |

### voice.status

Engine health check, enriched with plugin-specific data.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include_metrics` | boolean | no | `false` | Include performance metrics |

Returns: default voice, approved voices, presets, supported emotions, emotion
map, playback mode/backend/busy state, and the full enforced limits manifest.

### voice.playback_diagnose

Debug the audio output system.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `play_test_beep` | boolean | no | `true` | Play a short test chime |

Returns: backend, mode, device info, busy state, environment variable dump,
and test beep result.

### voice.ambient_enable

Toggle the inner monologue system at runtime (no restart needed).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `enabled` | boolean | yes | — | `true` to enable, `false` to disable |

### voice.ambient_mute

Temporarily suppress inner monologue output.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `minutes` | integer | no | `10` | Mute duration (1–1440) |

---

## 5. Voices

12 curated voices ship with the plugin. Any voice not in this list is rejected
with a `VOICE_REJECTED` error.

### Voice Roster

| ID | Name | Region | Gender | Character |
|----|------|--------|--------|-----------|
| `am_fenrir` | Fenrir | American | M | Powerful, commanding **(default)** |
| `am_eric` | Eric | American | M | Confident, energetic |
| `am_liam` | Liam | American | M | Warm, friendly |
| `am_onyx` | Onyx | American | M | Deep, smooth |
| `af_aoede` | Aoede | American | F | Clear, musical |
| `af_jessica` | Jessica | American | F | Professional, neutral |
| `af_sky` | Sky | American | F | Bright, airy |
| `bf_alice` | Alice | British | F | Composed, proper |
| `bf_emma` | Emma | British | F | Refined, warm |
| `bf_isabella` | Isabella | British | F | Warm, elegant |
| `bm_george` | George | British | M | Authoritative, formal |
| `bm_lewis` | Lewis | British | M | Measured, friendly |

### Presets

Presets are shorthand names that map to a voice + speed combination:

| Preset | Voice | Speed | Description |
|--------|-------|-------|-------------|
| `default` | am_fenrir | 1.0 | Powerful, commanding |
| `narrator` | am_fenrir | 0.95 | Calm, measured pace |
| `storyteller` | bf_emma | 0.9 | Refined, expressive |
| `announcer` | am_eric | 1.1 | Confident, bold |
| `friendly` | am_liam | 1.0 | Warm, approachable |
| `professional` | af_jessica | 1.0 | Clear, business-ready |

### Voice Resolution Order

1. `None` or empty → default voice (`am_fenrir`)
2. Preset name → mapped voice + speed
3. Direct voice ID → checked against approved set
4. Anything else → `VOICE_REJECTED` error

---

## 6. Emotions

8 emotions are supported. Each maps to a preset, a fallback voice, and a speed
multiplier.

### Emotion Map

| Emotion | Preset | Fallback Voice | Speed Multiplier |
|---------|--------|----------------|------------------|
| `neutral` | default | bm_george | 1.00 |
| `serious` | narrator | bm_george | 1.00 |
| `friendly` | friendly | am_liam | 1.00 |
| `professional` | professional | af_jessica | 1.00 |
| `calm` | narrator | bm_george | 0.95 |
| `joy` | friendly | am_liam | 1.06 |
| `urgent` | announcer | am_eric | 1.12 |
| `whisper` | storyteller | am_onyx | 0.92 |

- Unknown emotion names automatically downgrade to `neutral` with an
  `emotion_unsupported` warning.
- Final speed = `base_speed × speed_multiplier`, clamped to 0.85–1.15.
- If a `base_voice` is provided, it overrides the fallback voice.

### Emotion Span Syntax

You can mark up portions of text with inline emotion tags:

```
{joy}All 47 tests passed!{/joy} But {sadness}we lost the staging server.{/sadness}
```

**Syntax:**
- Open: `{emotion}` or `{emotion:intensity}` (intensity 0.0–1.0)
- Close: `{/emotion}`
- Nesting: up to 4 levels deep (innermost emotion wins)
- Limit: 100 spans per request

Malformed tags (mismatched, unclosed) gracefully fall back to plain text with
an `emotion_parse_failed` warning — the plugin never crashes on bad markup.

---

## 7. Multi-Speaker Dialogue

The dialogue system lets you write conversational scripts with multiple
speakers, pauses, and stage directions.

### Script Syntax

```
# Comments start with #
Speaker Name: What they say.
Another Speaker: Their reply.

[pause 500ms]

Speaker Name: (whisper) A secret.
Another Speaker: (excited)(fast) Let's go!
```

**Rules:**
- Lines follow `Speaker: text` format
- Blank lines and `# comments` are ignored
- Pauses: `[pause 350ms]`, `[pause 1.5s]`, or `[break 500ms]`
- Stage directions go in parentheses at the start of the text

### Stage Directions

| Direction | Speed Effect |
|-----------|-------------|
| `whisper` | ×0.9 |
| `aside` | ×0.95 |
| `calm` | ×0.9 |
| `excited` | ×1.1 |
| `urgent` | ×1.15 |
| `slow` | ×0.85 |
| `fast` | ×1.15 |

Multiple directions are averaged and then multiplied by the base speed,
clamped to 0.5–2.0. Unknown directions emit a warning but don't fail.

### Auto-Casting

If you don't provide an explicit `cast` mapping, the plugin auto-casts
speakers to voices by matching their name against keywords:

| Name Contains | Assigned Voice |
|---------------|---------------|
| alice | bf_alice |
| emma | bf_emma |
| isabella | bf_isabella |
| jessica | af_jessica |
| sky | af_sky |
| aoede | af_aoede |
| george | bm_george |
| lewis | bm_lewis |
| eric | am_eric |
| fenrir | am_fenrir |
| liam | am_liam |
| onyx | am_onyx |
| narrator | bm_george |
| announcer | am_eric |

Unmatched speakers default to `bm_george`. Matching is case-insensitive and
works on substrings (e.g., "Professor Alice" matches "alice" → `bf_alice`).

### Explicit Casting

Override auto-casting with the `cast` parameter:

```json
{
  "cast": {
    "Narrator": "am_fenrir",
    "Hero": "am_liam",
    "Villain": "bm_george"
  }
}
```

Cast keys are case-insensitive. Values can be voice IDs or preset names.
Invalid cast voices raise a `CAST_ERROR`.

### Limits

| Limit | Value |
|-------|-------|
| Max lines | 100 |
| Max chars per line | 1,000 |
| Max pauses | 50 |
| Pause range | 50–3,000 ms |

---

## 8. SSML-Lite Markup

A safe subset of SSML is supported when `format="ssml"` is specified. The
parser runs in strict allowlist mode — only the tags below are processed.

### Supported Tags

| Tag | Attributes | Effect |
|-----|-----------|--------|
| `<speak>` | — | Root wrapper (auto-added if missing) |
| `<break>` | `time="500ms"` or `strength="medium"` | Insert a pause |
| `<prosody>` | `rate="slow"` | Adjust speaking rate |
| `<emphasis>` | `level="moderate"` | Emphasize enclosed text |
| `<sub>` | `alias="replacement"` | Speak alias instead of tag content |
| `<say-as>` | `interpret-as="..."`, `format="..."` | Interpretation hint |

### Break Strength Values

| Strength | Duration |
|----------|----------|
| `none` | 0 ms |
| `x-weak` | 50 ms |
| `weak` | 100 ms |
| `medium` | 250 ms |
| `strong` | 500 ms |
| `x-strong` | 1,000 ms |

Maximum break duration: 2,000 ms (values above this are clamped).

### Safety

- Unknown tags produce an `ssml_tag_ignored` warning and are skipped
- XML parse errors fall back to plain text with an `ssml_parse_failed` warning
- Maximum 200 nodes per document
- Maximum 15,000 characters input
- Maximum nesting depth: 10 levels
- **The parser never raises an exception.** Bad SSML always degrades to plain text.

---

## 9. SFX Sound Effects

Inline sound effects generate pure-Python WAV chimes. This feature is
**disabled by default** and must be opted in.

### Enable SFX

```bash
set VOICE_SOUNDBOARD_ENABLE_SFX=1
```

### Available Tags

Write SFX tags in square brackets within your text:

```
[ding] All tests passed! [success]
```

| Tag | Frequency | Duration | Envelope |
|-----|-----------|----------|----------|
| `[ding]` | 880 Hz | 150 ms | Bell (fast attack, exponential decay) |
| `[chime]` | 660 Hz | 300 ms | Bell |
| `[success]` | 523 Hz | 200 ms | Rising (linear ramp up) |
| `[fail]` | 220 Hz | 300 ms | Falling (linear ramp down) |
| `[click]` | 1,200 Hz | 50 ms | Click (sharp cutoff) |
| `[tick]` | 800 Hz | 80 ms | Click |

- Format: mono, 16-bit PCM, 24 kHz
- Unknown tags become literal text with an `sfx_unknown_tag` warning
- Maximum 30 SFX per request (excess become literal text)
- Generated WAVs are cached in `{tempdir}/voice_soundboard_sfx/`

---

## 10. Chunking

Long text is automatically split into chunks for synthesis. This prevents
engine timeouts and enables mid-speech interruption.

### How It Works

1. Text shorter than 500 characters → single chunk (no split)
2. Split on paragraph breaks (`\n\n`)
3. If a paragraph exceeds 500 chars, split at sentence boundaries (`. ! ?`)
4. If a sentence still exceeds the limit, split at mid-sentence punctuation (`, ; :`)
5. If still too long, split at word boundaries
6. Tiny chunks (< 50 chars) are merged with their neighbor
7. Maximum 50 chunks per request (excess is discarded with a `text_truncated` warning)

### Control

- `chunking="auto"` — default behavior described above
- `chunking="off"` — send entire text as a single chunk (useful for short text
  or when you want exact control)

---

## 11. Concatenation

When multiple chunks are synthesized, they can be merged into a single WAV
file.

### Per-Request Concat

Set `concat=true` on `voice.speak` or `voice.dialogue` to get a single merged
output file.

- 200 ms of silence is inserted between chunks by default
- Emotion span path uses 30 ms silence for tighter transitions
- Output filename: `{voice}_{uuid8}.wav` (unique per request)
- Format mismatches between chunks are skipped with a `concat_format_mismatch` warning

### Global Concat

Set `VOICE_SOUNDBOARD_CONCAT=1` to enable concatenation globally for all
multi-chunk synthesis.

### Fallback

If concatenation fails, the plugin falls back to sequential playback of
individual chunk WAVs. You still hear everything — it just plays as separate
files.

---

## 12. Playback

Audio playback runs on a single dedicated thread with a queue-based
architecture.

### Playback Modes

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `replace` | Stop current audio, clear queue, play new | Default. Best for interactive use. |
| `queue` | Append to queue, play sequentially | Dialogue scripts, long narrations. |
| `drop` | Silently drop if already playing | Ambient, non-critical notifications. |

Set via `VOICE_SOUNDBOARD_PLAYBACK_MODE` (default: `replace`).

### Backend Selection

| Priority | Condition | Backend |
|----------|-----------|---------|
| 1 | `VOICE_SOUNDBOARD_PLAYBACK_BACKEND=winsound` | winsound |
| 2 | `VOICE_SOUNDBOARD_PLAYBACK_BACKEND=sounddevice` | sounddevice |
| 3 | Windows (auto-detect) | winsound |
| 4 | Other OS (auto-detect) | sounddevice |
| 5 | winsound fails | sounddevice (fallback) |

### Watchdog Timer

Every playback operation has a 30-second watchdog (configurable via
`VOICE_SOUNDBOARD_MAX_PLAY_SECONDS`). If audio hangs, the watchdog kills it.
This prevents frozen speakers from blocking the plugin.

### Output Device

- `VOICE_SOUNDBOARD_OUTPUT_DEVICE` — substring match against device names
- `VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX` — direct device index (takes priority)
- `VOICE_SOUNDBOARD_LOG_DEVICES=1` — dump available devices at startup for debugging

### Disable Playback

Set `VOICE_SOUNDBOARD_DISABLE_PLAYBACK=1` to skip audio output entirely. Synthesis
still runs and returns WAV paths — you just won't hear anything. Useful for
testing or CI environments.

---

## 13. Inner Monologue (Ambient)

The inner monologue is an ambient channel for quiet, ephemeral micro-utterances.
Think of it as the plugin "thinking out loud" in a whisper.

### Enable

```bash
set VOICE_SOUNDBOARD_AMBIENT_ENABLED=1
```

### How It Works

1. Claude calls `voice.inner_monologue` with a short text (max 500 chars)
2. Text is automatically redacted (paths, tokens, IPs, secrets stripped)
3. Rate limiter enforces one entry per 60-second cooldown window
4. If `autospeak=true`, the entry is synthesized with voice `am_onyx` at speed 0.92
5. Entries expire after 4 seconds (configurable TTL)

### Behavior While Speaking

When audio is already playing, inner monologue entries are handled based on
`VOICE_SOUNDBOARD_AMBIENT_WHILE_SPEAKING`:

| Value | Behavior |
|-------|----------|
| `drop` | Silently discard (default) |
| `queue` | Queue for later |
| `replace` | Interrupt current and speak |

### Runtime Control

- `voice.ambient_enable` — toggle on/off without restart
- `voice.ambient_mute` — suppress for N minutes (system stays enabled, just silent)

---

## 14. Filesystem & Output

All WAV output is sandboxed to a single directory.

### Output Root

Default: `{tempdir}/voice-soundboard/`

Override with `VOICE_SOUNDBOARD_OUTPUT_ROOT=/your/path`.

The directory is automatically created on startup.

### Path Containment

All output file paths are validated with a containment check:

```
candidate.resolve().relative_to(output_root.resolve())
```

Any path that resolves outside the output root (e.g., via `../` traversal)
is rejected with a `PATH_NOT_ALLOWED` error.

### WAV Retention

Old WAV files are automatically cleaned up:

| Setting | Default | Description |
|---------|---------|-------------|
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` (4 hours) | Delete WAVs older than this |
| `VOICE_SOUNDBOARD_DELETE_AFTER_PLAY` | `0` (off) | Delete WAV immediately after playback |

Set retention to `0` to disable automatic cleanup.

Cleanup only touches `*.wav` files inside the output root. Non-WAV files are
never deleted. Directories outside the output root are never cleaned.

---

## 15. Security

### Threat Model

The plugin follows a STRIDE-lite threat model covering 7 threat categories:

| ID | Threat | Mitigation |
|----|--------|------------|
| T1 | Input overflow | 10,000 char max, speed clamping, chunk/line limits |
| T2 | Path traversal | Output root containment, `safe_path()` validation |
| T3 | Resource exhaustion | Concurrency gate (max 1 synthesis), rate limiter |
| T4 | Information disclosure | Redaction of paths/tokens/IPs, no stack traces to client |
| T5 | Denial of service | 30s playback watchdog, queue policies |
| T6 | Supply chain | Dependabot, pip-audit, ship gate script |
| T7 | Corrupt output | WAV magic byte + size validation on every file |

### Concurrency Gate

Only one synthesis operation runs at a time. The gate uses an
`asyncio.Semaphore(1)` — if a synthesis tool is called while another is
running, it returns immediately with `BUSY`.

**Control tools bypass the gate.** You can always check status, list voices,
interrupt playback, or toggle ambient mode — even during synthesis.

Synthesis tools (gated): `voice.speak`, `voice.narrate`, `voice.workflow_notify`,
`voice.dialogue`, `voice.inner_monologue`

Control tools (bypass): `voice.status`, `voice.list_voices`, `voice.interrupt`,
`voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`

### Rate Limiter

Disabled by default (`VOICE_SOUNDBOARD_RATE_COOLDOWN_MS=0`). When enabled,
enforces a minimum gap between calls to the same tool. Set to e.g. `500` to
require 500 ms between consecutive calls.

### WAV Validation

Every synthesized WAV is validated before playback:

1. File must exist
2. File must be at least 44 bytes (WAV header minimum)
3. Bytes 0–3 must be `RIFF`
4. Bytes 8–11 must be `WAVE`
5. File must be under 10 MB

Failed files are discarded with an `invalid_wav` or `response_too_large`
warning.

### Redaction

All error messages and inner monologue entries are scrubbed for sensitive
content before being stored or returned:

| Pattern | Replacement |
|---------|-------------|
| Windows paths (`C:\Users\...`) | `[PATH]` |
| Unix paths (`/home/user/...`) | `[PATH]` |
| API tokens (`sk-...`, `ghp_...`, `xox...`) | `[TOKEN]` |
| Key-value secrets (`password=...`, `token=...`, `api_key=...`) | `[REDACTED]` |
| Base64 blobs (40+ chars) | `[BASE64]` |
| IP addresses | `[IP]` |

### What It Doesn't Do

- No authentication or authorization
- No network requests (unless you configure a remote voice backend)
- No persistent user data beyond ephemeral WAV files
- No untrusted web input (input comes from Claude Code only)

Full details: [`SECURITY.md`](../SECURITY.md) and
[`docs/SECURITY_THREAT_MODEL.md`](SECURITY_THREAT_MODEL.md).

---

## 16. Environment Variables

Complete reference for every environment variable the plugin reads.

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_MODELS` | *(from engine config)* | Path to Kokoro ONNX model directory |
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV output directory |

### Playback

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_DISABLE_PLAYBACK` | `0` | Truthy = skip playback entirely |
| `VOICE_SOUNDBOARD_PLAYBACK_MODE` | `replace` | `replace`, `queue`, or `drop` |
| `VOICE_SOUNDBOARD_PLAYBACK_BACKEND` | auto | `winsound` or `sounddevice` |
| `VOICE_SOUNDBOARD_MAX_PLAY_SECONDS` | `30` | Watchdog timeout per play operation |
| `VOICE_SOUNDBOARD_OUTPUT_DEVICE` | *(none)* | Substring match on device name |
| `VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX` | *(none)* | Direct device index (overrides name) |
| `VOICE_SOUNDBOARD_LOG_DEVICES` | `0` | Truthy = dump device list at startup |

### File Management

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Auto-delete WAVs older than this (0 = disabled) |
| `VOICE_SOUNDBOARD_DELETE_AFTER_PLAY` | `0` | Truthy = delete WAV immediately after playback |

### Features

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_ENABLE_SFX` | `0` | Truthy = enable SFX tag processing |
| `VOICE_SOUNDBOARD_CONCAT` | *(empty)* | Truthy = global concat mode for all multi-chunk synthesis |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` | Per-tool rate limit cooldown in ms (0 = disabled) |

### Inner Monologue (Ambient)

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Truthy = enable monologue system |
| `VOICE_SOUNDBOARD_AMBIENT_AUTOSPEAK` | `0` | Truthy = auto-synthesize accepted entries |
| `VOICE_SOUNDBOARD_AMBIENT_TTL_MS` | `4000` | Entry time-to-live in ms |
| `VOICE_SOUNDBOARD_AMBIENT_COOLDOWN_MS` | `60000` | Minimum gap between entries in ms |
| `VOICE_SOUNDBOARD_AMBIENT_WHILE_SPEAKING` | `drop` | Behavior when audio is playing: `drop`, `queue`, `replace` |

---

## 17. Error Codes

All errors are returned as structured JSON with a code, human-readable message,
and a 12-character hex trace ID:

```json
{
  "ok": false,
  "error": {
    "code": "VOICE_REJECTED",
    "message": "Voice 'random_voice' is not in the approved roster",
    "trace_id": "a1b2c3d4e5f6"
  }
}
```

| Code | Meaning |
|------|---------|
| `INTERNAL_ERROR` | Unhandled exception (message is redacted) |
| `ENGINE_UNAVAILABLE` | Voice engine failed to start |
| `VOICE_REJECTED` | Voice not in the 12-voice approved roster |
| `LIMIT_EXCEEDED` | A hard limit was hit (text length, chunk count, etc.) |
| `RATE_LIMITED` | Rate limiter rejected the call (includes wait_ms) |
| `CAST_ERROR` | Dialogue cast resolution failed (bad voice in cast dict) |
| `PARSE_ERROR` | Dialogue script couldn't be parsed |
| `PATH_NOT_ALLOWED` | Path traversal attempt detected |
| `BUSY` | Concurrency gate is full (another synthesis is running) |

Stack traces are **never** sent to the client — they go to stderr only. Error
messages pass through the redaction pipeline to strip any accidental secrets.

---

## 18. Auto-Notifications Hook

The plugin includes a `PostToolUse` hook that automatically speaks build and
test results.

### How It Works

After every Bash tool use in Claude Code, the hook inspects the output for
build/test/deploy patterns like:

- `BUILD SUCCESS`, `BUILD FAILED`
- `passed`, `failed`, `error`
- `npm test`, `pytest`, `cargo build`, `dotnet build`, `make`, `gradle`

If a pattern is detected, the hook calls `voice.workflow_notify` with the
appropriate `event_type` and a brief summary. If the output isn't a
build/test/deploy event, the hook does nothing.

### Location

`hooks/hooks.json` — registered automatically when the plugin is installed.

---

## 19. Limits Reference

Every hard limit enforced by the plugin, in one place.

### Text & Input

| Limit | Value | Source |
|-------|-------|--------|
| Max text length | 10,000 chars | `speech/limits.py` |
| Max SSML input | 15,000 chars | `speech/ssml_lite.py` |
| Max SSML nodes | 200 | `speech/ssml_lite.py` |
| Max SSML nesting | 10 levels | `speech/ssml_lite.py` |
| Max break duration | 2,000 ms | `speech/ssml_lite.py` |
| Speed range | 0.5–2.0 | `speech/limits.py` |

### Chunking

| Limit | Value | Source |
|-------|-------|--------|
| Max chunks | 50 | `speech/limits.py` |
| Default chunk size | 500 chars | `speech/chunking.py` |
| Min chunk size (merge threshold) | 50 chars | `speech/chunking.py` |

### Emotion

| Limit | Value | Source |
|-------|-------|--------|
| Max emotion spans | 100 | `speech/emotion/types.py` |
| Max emotion nesting | 4 levels | `speech/emotion/types.py` |
| Emotion speed range | 0.85–1.15 | `speech/emotion/types.py` |
| Many-spans warning threshold | 30 spans | `speech/emotion/plan_builder.py` |

### Dialogue

| Limit | Value | Source |
|-------|-------|--------|
| Max lines | 100 | `speech/dialogue/types.py` |
| Max chars per line | 1,000 | `speech/dialogue/types.py` |
| Max pauses | 50 | `speech/dialogue/types.py` |
| Pause range | 50–3,000 ms | `speech/dialogue/types.py` |

### SFX

| Limit | Value | Source |
|-------|-------|--------|
| Max SFX per request | 30 | `audio/sfx.py` |

### Server

| Limit | Value | Source |
|-------|-------|--------|
| Max concurrent synthesis | 1 | `security/guardrails.py` |
| Rate cooldown | 0 ms (disabled) | `security/guardrails.py` |
| Max response size | 10 MB | `security/guardrails.py` |
| Min WAV size | 44 bytes | `security/wav_validator.py` |

### Playback

| Limit | Value | Source |
|-------|-------|--------|
| Max play seconds (watchdog) | 30 | `playback/worker.py` |
| Default retention | 240 min (4 hours) | `playback/retention.py` |

### Inner Monologue

| Limit | Value | Source |
|-------|-------|--------|
| Max monologue chars | 500 | `ambient/inner_monologue.py` |
| Default TTL | 4,000 ms | `ambient/inner_monologue.py` |
| Default cooldown | 60,000 ms | `ambient/inner_monologue.py` |

### Concat

| Limit | Value | Source |
|-------|-------|--------|
| Default silence between chunks | 200 ms | `speech/concat.py` |

---

## 20. Testing & Release

### Run the Full Suite

```bash
pip install -e ".[dev]"
python -m pytest tests/ -q
```

323 tests covering:
- Unit tests for every module (limits, chunking, SSML, emotion, dialogue, SFX, concat, playback, retention, ambient, redaction, WAV validation, filesystem sandbox, guardrails)
- Integration tests (golden behavior, schema enforcement)
- Adversarial security battery (oversized inputs, SSML bombs, emotion bombs, dialogue bombs, SFX spam, path traversal, corrupt WAV, structured error format)

### Run Security Tests Only

```bash
python -m pytest tests/test_security.py -q
```

### Pre-Release Gate

```bash
python scripts/ship_gate.py
```

Runs the full pytest suite, the security battery, and (optionally) `pip-audit`
for dependency vulnerability scanning. Exit code 0 means clear to ship.

### Dependabot

`.github/dependabot.yml` is configured for weekly pip dependency updates with
a limit of 5 open PRs.

---

## 21. Troubleshooting

### No sound at all

1. Run `/soundboard:voice-status` — is the engine healthy?
2. Run `/soundboard:speak test` — does it return an `audio_path`?
3. Check `VOICE_SOUNDBOARD_DISABLE_PLAYBACK` isn't set to `1`
4. Run `voice.playback_diagnose` — check backend, device, and test beep
5. Try `VOICE_SOUNDBOARD_LOG_DEVICES=1` to see available audio devices

### "Synthesis busy, try again"

The concurrency gate only allows one synthesis at a time. Wait for the current
operation to finish, or call `voice.interrupt` to stop it.

### "Voice 'xxx' is not in the approved roster"

Only 12 voices are allowed. Check the [roster](#voice-roster) for valid IDs.
Preset names (`narrator`, `announcer`, etc.) also work.

### Audio cuts off or hangs

- The 30-second watchdog will kill hung playback automatically
- Try `voice.interrupt` to force-stop
- Check `VOICE_SOUNDBOARD_MAX_PLAY_SECONDS` if your audio is legitimately
  longer than 30 seconds

### Inner monologue not working

1. Set `VOICE_SOUNDBOARD_AMBIENT_ENABLED=1`
2. Check cooldown — only one entry per 60 seconds by default
3. Check if muted — `voice.ambient_mute` suppresses output temporarily
4. For speech output, also set `VOICE_SOUNDBOARD_AMBIENT_AUTOSPEAK=1`

### WAV files piling up

Default retention is 4 hours. Adjust with `VOICE_SOUNDBOARD_RETENTION_MINUTES`.
For aggressive cleanup, set `VOICE_SOUNDBOARD_DELETE_AFTER_PLAY=1`.

### Rate limited

Set `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS=0` (the default) to disable rate
limiting entirely.

### Path errors

If you see `PATH_NOT_ALLOWED`, a filename resolved outside the output root.
This is a security feature. Don't put `../` in filenames.

---

## 22. ELI5 — Explain Like I'm 5

### What does this plugin do?

You know how Claude Code is really smart and can write code and answer
questions? Well, normally it can only *type* its answers. This plugin teaches
it how to **talk out loud**, like a person.

### How does it work?

Imagine you have a toy robot that can read books. But it can only read by
showing words on a screen. Now imagine you plug in a little speaker. The robot
reads the words, turns them into sounds, and the speaker plays them. That's
what this plugin does — it's the little speaker for Claude.

Here's what happens step by step:

1. **Claude writes something** — like "All your tests passed!"
2. **The plugin gets the message** — through a special mailbox called "stdio"
3. **It picks a voice** — there are 12 voices, like picking a character in a game
4. **It picks a mood** — happy for good news, sad for bad news, excited for big moments
5. **It turns the words into sound** — using a speech engine (like a very smart parrot)
6. **It plays the sound through your speakers** — and you hear Claude talking!

### What are the voices?

Think of them like characters. There's Fenrir (the bold hero), Eric (the
excited announcer), Liam (the friendly buddy), Onyx (the deep, smooth narrator),
and 8 more with different personalities. Some sound American, some sound
British. Some are guys, some are ladies.

### What are emotions?

When you're happy, you talk differently than when you're sad, right? Same here.
If Claude says "the build failed," it sounds a little sad. If it says "all
tests passed," it sounds happy and fast. There are 8 moods it can use.

### What's a dialogue?

You know how in a play, different actors say different lines? This plugin can
do that too! You write a script like:

```
Alice: Hello Bob!
Bob: Hi Alice! How are you?
Alice: (whispering) I have a secret...
```

And the plugin uses a different voice for each character and speaks the
whole conversation.

### What are sound effects?

Little beeps and chimes! Like a `[ding]` when something good happens, or a
`[fail]` buzzer when something goes wrong. Like sound effects in a video game.

### What about security?

The plugin has rules to stay safe, kind of like how you have rules at school:

- **Stay in your room** — it can only save sound files in one special folder, nowhere else
- **Don't shout over each other** — only one voice speaks at a time
- **Clean up your toys** — old sound files get deleted after 4 hours
- **Don't share secrets** — if it accidentally sees a password or private info, it covers it up with `[REDACTED]`
- **Have a timer** — if speaking takes longer than 30 seconds, it stops automatically (like a kitchen timer)
- **Only use approved friends** — it only uses 12 specific voices, no strangers

### What's the inner monologue?

You know how sometimes you talk to yourself in your head? This is like that
but for Claude. It can quietly whisper little thoughts to itself. It's off by
default because not everyone wants a whispering computer, but you can turn it
on if you think it's cool.

### Does it use the internet?

**Nope!** Everything happens right on your computer. No data goes anywhere. No
one is listening. It's like a toy that works without WiFi.

### What if something goes wrong?

Every time something goes sideways, the plugin gives back a polite error
message with a special tracking code (like a receipt number). It never panics,
never crashes, and never shows scary computer gibberish to the user. If the
voice engine is busy, it says "busy, try again." If you ask for a voice it
doesn't know, it says "I don't know that voice." Simple as that.

---

<p align="center"><em>End of Handbook</em></p>
