# ADR-0003: Shared Audio Core Contract

**Status:** Proposed  
**Date:** 2026-03-12  
**Deciders:** Mike, ChatGPT, Gemini, Claude  
**Consulted:** Future C#/WinUI clients, TypeScript clients, MCP server consumers  
**Affected repos:** Voice Soundboard, downstream audio MCP servers, future Ambient Regulator client, future Therapeutic Protocol client  

## Context

We need a single shared audio execution engine that can power two different products without contaminating either one with the other's assumptions:

- **Ambient Regulator** — a stateless, instant-response calming audio tool.
- **Therapeutic Protocol** — a stateful session-oriented orchestration layer.

The shared core must remain a high-performance playback and synthesis engine. It must not absorb product meaning, therapeutic concepts, user/session state, or client workflow logic.

## Decision

We will build a **dumb-but-strong Audio Core** with the following properties:

- It owns playback, routing, envelopes, spatialization, and low-level timing.
- It does not own user state, product semantics, session models, or macro scheduling.
- It exposes a small, transport-safe command surface that supports both file/static asset playback and synthesis payload execution.
- It includes playback ownership / lease semantics so client crashes cannot leave audio running forever.

## Prime Directive: What Stays Out of the Core

The following concepts are **forbidden** from entering the Audio Core repository, API, or persistent state model:

### User State
- No profiles
- No account/login context
- No session histories
- No saved progress

### Product Semantics
- No concept of "ambient regulation"
- No concept of "therapy" or "EMDR"
- No protocol names
- No wellness scoring or behavioral interpretation

### Logging / Telemetry
- No listening-time analytics by default
- No session journaling
- No outcome/event logging beyond minimal engine diagnostics
- No product analytics payloads

### Macro Workflow Logic
- No long-running product scheduler
- No `play_for_30_minutes`
- No session sequencing engine
- No state machine for protocols

### Preset Ownership
- No user preset database
- No preset library semantics
- No sync logic
- Presets are client-owned JSON payloads passed at runtime

## What the Core Owns

### Playback Execution
- Static audio asset playback
- Streaming / generated buffer playback where supported
- Looping
- Pause/resume/stop
- Seek for seekable assets only

### Synthesis Execution
- Validated synthesis request intake
- Dispatch to configured synthesis engine(s)
- Runtime generation into playable output

### Audio Mechanics
- Gain / volume changes
- Fade-in / fade-out
- Crossfade
- Delay start
- Pan / spatial positioning
- Output device selection

### Safety of Execution
- Playback IDs
- Ownership / lease model
- Auto-stop on lease expiry
- Deterministic interrupt / replacement behavior

## Contract Goals

- **Fast path first** — suitable for instant ambient playback.
- **Crash-safe** — looping playback must not outlive dead clients indefinitely.
- **Stateless by default** — no persistent user model in core.
- **Cross-client compatible** — C#, WinUI, TypeScript, CLI, and MCP consumers can all use it.
- **Not haunted** — command semantics must be simple, explicit, and deterministic.

## API Contract

### Command Surface

| Command | Signature |
|---|---|
| `play` | `(source, options?) -> playback_id` |
| `pause` | `(playback_id, fade_out_ms?)` |
| `resume` | `(playback_id, fade_in_ms?)` |
| `stop` | `(playback_id, fade_out_ms?)` |
| `seek` | `(playback_id, position_ms)` |
| `set_volume` | `(target, level, fade_ms?)` |
| `set_pan` | `(target, value, ramp_ms?)` |
| `set_spatial_position` | `(target, x, y, z, ramp_ms?)` |
| `get_devices` | `() -> DeviceInfo[]` |
| `set_output_device` | `(device_id)` |
| `renew_lease` | `(playback_id, lease_ms)` |
| `get_playback_state` | `(playback_id) -> PlaybackState` |
| `replace_playback` | `(target_playback_id, source, options?) -> playback_id` |

### Rejected Commands

- `start_emdr_session(...)`
- `run_protocol(...)`
- `play_for(duration)`
- `save_preset(...)`
- `get_user_history(...)`
- `track_minutes_listened(...)`
- `load_profile(...)`

## Data Models

See `@sonic-core/types` for canonical TypeScript definitions.

### Source Model
```json
{ "kind": "asset", "asset_ref": "file:///C:/audio/rain.wav" }
{ "kind": "synthesis", "engine": "kokoro", "voice": "v1_calm", "text": "...", "speed": 0.9 }
```

### Playback State
```json
{
  "playback_id": "pb_01J...",
  "status": "playing",
  "source_kind": "asset",
  "loop": true,
  "position_ms": 28124,
  "duration_ms": 120000,
  "volume": 0.8,
  "pan": -0.25,
  "output_device_id": "device_default",
  "lease_expires_at": "2026-03-12T14:12:05Z"
}
```

### Device Info
```json
{
  "device_id": "device_default",
  "name": "Speakers (USB DAC)",
  "kind": "output",
  "is_default": true,
  "channels": 2,
  "sample_rates": [44100, 48000]
}
```

### Error Shape
```json
{
  "error": {
    "code": "device_unavailable",
    "message": "Requested output device is no longer available.",
    "retryable": true,
    "details": { "device_id": "usb_dac_02" }
  }
}
```

## Ownership / Lease Model

Every active playback item may optionally carry an owner lease.

1. Client calls `play(..., owner_lease_ms=5000)`
2. Core stores lease expiration timestamp
3. Client renews lease periodically using `renew_lease(...)`
4. If lease expires, core performs configurable fail-safe action

**Fail-safe on expiry:** fade out → stop → mark as `expired`.

### Lease Guidance

| Product | Guidance |
|---|---|
| Ambient Regulator | Usually no lease for one-shots. Short lease acceptable for loops. |
| Therapeutic Protocol | Renewable lease required for looped/long-lived playback. Renew every 1–2s for a 5s lease. |

## Timing Model

**Allowed in core:** `delay_start_ms`, `fade_in_ms`, `fade_out_ms`, `crossfade_ms`, ramp timing, loop behavior.

**Forbidden in core:** total session duration, interval choreography, therapeutic pacing, multi-step protocol sequencing, timers that encode user meaning.

## Routing Model

**Required:** enumerate devices, set device, route playback, stereo pan.

**Optional / engine-dependent:** 3D spatial position, per-channel routing, bus routing, multichannel matrix.

**Bilateral stimulation:** achieved via `set_pan(...)` + envelope/ramp timing + device routing. Raw buffer access deferred.

## Persistence Model

**Allowed:** runtime playback registry, current device selection, engine config, minimal diagnostics.

**Disallowed:** user history, session logs, behavioral analytics, protocol outcomes, saved presets.

## Transport

Local IPC or FastMCP for command invocation. Optional REST/WebSocket bridge for desktop/web. Same logical command model regardless of transport.

## Implementation Plan

1. **Contract Freeze** — finalize ADR-0003, schemas, command naming
2. **Engine Skeleton** — registry, router, device enum, play/pause/stop/volume/pan, lease watcher
3. **Asset + Synthesis Support** — static asset loader, CID/URI resolution, Kokoro/ONNX adapter
4. **Client Adapters** — FastMCP adapter, local IPC, TypeScript SDK, C# SDK
5. **Hardening** — crash recovery, hot device swap, diagnostics, latency testing, race handling

## Open Questions

- Should `replace_playback(...)` be first-class or an `interrupt_mode` variant on `play(...)`?
- Bus-level controls in v1, or only per-playback?
- Device selection: global, per-playback, or both?
- Minimal diagnostics boundary vs. telemetry creep?
- Synthesis result cache in core or higher layer?

## Consequences

**Positive:** shared mechanics without shared semantics; safer crash behavior; strong blast wall; high reusability.

**Negative:** clients own more orchestration; some convenience intentionally forbidden; advanced DSP deferred.

**Follow-on ADRs:** ADR-0004 (Leases/Failure), ADR-0005 (Transport Binding), ADR-0006 (Advanced DSP).
