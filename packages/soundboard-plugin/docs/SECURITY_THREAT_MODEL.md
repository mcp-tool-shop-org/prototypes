# Security Threat Model

## System Architecture

```
Claude Code (MCP Host)
    |  stdio (JSON-RPC)
    v
+-----------------------+  TB1: Tool call boundary
| MCP Bridge            |  (stdio_bridge.py)
| - Input validation    |
| - Rate limiting       |
| - Concurrency gate    |
| - Error sanitization  |
+-----------------------+
    |  in-process Python calls
    v
+-----------------------+  TB2: Engine boundary
| Voice Engine          |  (voice-soundboard)
| - Kokoro / Piper TTS  |
| - Audio synthesis      |
+-----------------------+
    |  WAV file write
    v
+-----------------------+  TB3: Filesystem boundary
| Output Root           |  ({tempdir}/voice-soundboard/)
| - Synthesized WAVs    |
| - Concat output       |
| - SFX cache           |
+-----------------------+
    |  audio playback
    v
+-----------------------+
| PlaybackWorker        |  (single-thread queue)
| - winsound / sd       |
| - 30s watchdog timer  |
+-----------------------+
```

## Trust Boundaries

### TB1: Claude Code <-> MCP Bridge (stdio)

Claude Code generates tool arguments. While Claude is a semi-trusted client
(not arbitrary user input), we validate everything defensively:

- Text length capped at 10,000 characters
- SSML parsed with strict allowlist (15,000 chars, 200 nodes, depth 10)
- Emotion spans limited to 100 with nesting depth 4
- Dialogue limited to 100 lines, 1000 chars each
- SFX tags limited to 30 per request from a hardcoded catalog
- Voice must be in the 12-voice approved roster
- Speed clamped to [0.5, 2.0]
- Unknown/malformed input falls back to plain text with warnings

### TB2: MCP Bridge <-> Voice Engine (in-process)

The voice engine runs in the same Python process. We trust it to produce valid
audio but validate output defensively:

- WAV header validation (RIFF/WAVE magic bytes)
- File size check (max 10 MB per chunk)
- Playback timeout (30 seconds max)

### TB3: MCP Bridge <-> Filesystem

WAV files are written to a sandboxed output root:

- Default: `{tempdir}/voice-soundboard/`
- Configurable via `VOICE_SOUNDBOARD_OUTPUT_ROOT`
- Path containment enforced: all resolved paths must be inside output root
- Filenames are generated (UUID-based), never user-controlled
- Retention cleanup only operates within the output root
- SFX cache uses hardcoded catalog keys as filenames

## Assets

| ID | Asset | Risk |
|----|-------|------|
| A1 | User filesystem | Path traversal could write/delete outside sandbox |
| A2 | Audio output device | Indefinite playback could lock device |
| A3 | CPU / Memory | Unbounded synthesis could exhaust resources |
| A4 | Logs (stderr) | Could leak paths or tokens in error messages |

## Threats and Mitigations

### T1: Input Overflow

**Attack**: Submit extremely large text, deeply nested SSML/emotion/dialogue
markup, or excessive SFX tags to cause parsing delays or memory exhaustion.

**Mitigations**:
- `MAX_TEXT_LENGTH = 10,000` (truncated with warning)
- `MAX_SSML_INPUT_CHARS = 15,000`, `MAX_SSML_NODES = 200`
- `MAX_NESTING_DEPTH = 10` (SSML), `MAX_EMOTION_NESTING = 4`
- `MAX_CHUNKS = 50`, `MAX_DIALOGUE_LINES = 100`
- `MAX_SFX_PER_REQUEST = 30`
- All limits enforced at point-of-use with graceful fallback

### T2: Path Traversal

**Attack**: Craft filenames containing `../` or absolute paths to write WAVs
outside the output sandbox.

**Mitigations**:
- Output filenames are generated (UUID-based), never from user input
- `safe_path()` resolves and checks `relative_to(output_root)`
- SFX tags come from a hardcoded catalog only
- Retention cleanup only operates inside output root

### T3: Resource Exhaustion

**Attack**: Flood the server with rapid synthesis requests to saturate CPU.

**Mitigations**:
- `ConcurrencyGate`: max 1 concurrent synthesis (second request rejected)
- `RateLimiter`: configurable per-tool cooldown (default disabled)
- Playback watchdog: 30-second timeout prevents audio device lock
- `MAX_RESPONSE_SIZE_BYTES = 10 MB` per chunk

### T4: Information Disclosure

**Attack**: Trigger exceptions that leak file paths, tokens, or internal state
in error responses.

**Mitigations**:
- Catch-all error handler returns sanitized messages with error codes
- `redact_sensitive()` strips paths, API tokens, IPs, base64, key=value secrets
- Full stack traces go to stderr only, never to the MCP client
- Every error includes a `trace_id` for correlation

### T5: Denial of Service via Rapid Calls

**Attack**: Rapid-fire tool calls to overwhelm the server.

**Mitigations**:
- `RateLimiter` with configurable cooldown per tool
- `ConcurrencyGate` serializes synthesis
- stdio protocol naturally serializes requests (single client)

### T6: Supply Chain Compromise

**Attack**: Compromised dependency introduces malicious code.

**Mitigations**:
- Minimal dependency surface (only `mcp` as production dep)
- Lockfile with pinned versions
- Dependabot for automated vulnerability alerts
- `pip-audit` in release gate script

### T7: Corrupt Engine Output

**Attack**: Voice engine returns non-WAV data or oversized files.

**Mitigations**:
- WAV header validation (RIFF + WAVE magic bytes, minimum 44 bytes)
- File size check against `MAX_RESPONSE_SIZE_BYTES`
- Invalid output is warned and skipped, not played

## Residual Risks

- The voice-soundboard engine is a separate package with its own attack surface.
  This threat model covers the plugin layer only.
- The MCP stdio transport has no authentication. Security relies on the host
  (Claude Code) being the sole client.
- Audio playback uses platform APIs (winsound, sounddevice) which have their
  own security properties outside our control.
