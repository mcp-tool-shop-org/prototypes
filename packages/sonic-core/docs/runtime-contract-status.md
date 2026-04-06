# Runtime Contract Status

**Protocol:** `ndjson-stdio-v1`
**Status:** Stable as of v0.1.0, synthesis in v0.2.0, introspection + events in v0.3.x, asset validation in v0.4.0, natural completion in v0.4.1, format capability reporting in v0.5.0, typed protocol envelopes in v0.6.0, OpenAL Soft backend in runtime v0.4.0, per-playback device routing in runtime v0.5.0
**Date:** 2026-03-13

## What is stable

These behaviors are now considered part of the contract and will not change without a protocol version bump:

### Wire protocol
- Newline-delimited JSON over stdio (stdin → requests, stdout → responses)
- Request shape: `{ "id": number, "method": string, "params"?: object }`
- Success response: `{ "id": number, "result": any }`
- Error response: `{ "id": number, "error": { "code": string, "message": string, "retryable": boolean } }`
- Correlation by integer `id`
- stderr reserved for diagnostics only — never protocol traffic
- All envelope shapes are typed in `@sonic-core/types` as shared interfaces (added v0.6.0)

### Protocol message envelopes (added v0.6.0)
- `RuntimeRequestMessage` — outbound: `{ id: number, method: string, params?: object }`
- `RuntimeSuccessResponse` — inbound success: `{ id: number, result: unknown }`
- `RuntimeErrorResponse` — inbound error: `{ id: number, error: RuntimeWireError }`
- `RuntimeWireError` — error payload: `{ code: string, message: string, retryable: boolean }`
- `RuntimeResponseMessage` — union of success and error responses
- `RuntimeEventMessage` — unsolicited event: `{ event: string, data?: object }`
- `RuntimeProtocolMessage` — union of all inbound message types (responses + events)
- SidecarBackend uses shared envelope types instead of ad-hoc local interfaces

### Handshake
- First message must be `{ method: "version" }`
- Response includes `{ name, version, protocol }` where `protocol` is `"ndjson-stdio-v1"`
- Backend hard-fails on unsupported protocol versions

### Methods
- `version`, `load_asset`, `play`, `pause`, `resume`, `stop`, `seek`
- `set_volume`, `set_pan`, `get_position`, `get_duration`
- `list_devices`, `set_device`
- `synthesize` (Kokoro ONNX inference → WAV → playable handle, validated v0.2.0)
- `get_health`, `get_capabilities`, `list_voices`, `preload_model`, `get_model_status` (introspection, added v0.3.0)
- `validate_assets` (asset validation with structured errors/hints, added v0.4.0)
- `shutdown`

### Audio format reporting (added v0.5.0)
- `get_capabilities` returns `synthesis_format` describing the synthesis output format:
  - `{ container: "wav", encoding: "pcm_s16le", sample_rate: 24000, channels: 1, bit_depth: 16 }`
- `get_capabilities` returns `playback_formats: ["wav"]` listing accepted playback asset formats
- `synthesize` result includes `sample_rate`, `channels`, `duration_ms` metadata alongside the handle
- `load_asset` validates file extension — non-WAV assets fail with `unsupported_format` error
- Error code `unsupported_format` is now used for format validation failures

### Per-playback device routing (added runtime v0.5.0)
- `play` accepts optional `output_device_id` parameter
- When present, playback routes to the specified output device
- When absent, playback uses the default/global device (backward compatible)
- Unknown device IDs return `device_unavailable` error with `retryable: true`
- Clients should call `list_devices` first to discover valid device IDs
- `get_capabilities` reports `device_routing` in the features list
- Implemented via per-device OpenAL contexts (one context per output endpoint)
- Buffer+source re-created on target device if slot was loaded on a different device

### Runtime events (added v0.3.1)
- Unsolicited messages with `event` field and no `id` field
- Shape: `{ "event": string, "data"?: object }`
- Known events: `synthesis_started`, `synthesis_completed`, `playback_ended`
- `playback_ended` reasons: `"stopped"` (explicit stop), `"completed"` (audio reached end naturally)
- Natural completion detected by polling `AL_SOURCE_STATE` at 10ms intervals (replaced SoundFlow callback in v0.4.0); runtime cleans up slot and emits event
- Stop-vs-completion race is guarded: only one `playback_ended` event per handle
- Events are informational — they do not affect request/response correctness
- SidecarBackend surfaces events via `onEvent` callback; events without a callback are silently dropped

### Handle semantics
- Runtime handles are opaque strings (format: `h_` + hex)
- sonic-core maps `playback_id` → `handle` internally
- Handles are invalidated on process death

### Recovery semantics
- Per-request timeouts with `request_timeout` error code (retryable: true)
- Consecutive timeout tracking → runtime killed after threshold
- Process death rejects all in-flight requests with `runtime_exited`
- Auto-restart on next command (configurable, with restart limit)
- Handle map cleared on process death — no stale handle confusion
- Disposed backends cannot restart

### Error containment
- Runtime errors translate to typed `SidecarError` with code, message, retryable
- Device errors (`device_unavailable`) do not poison the session
- Protocol mismatch hard-fails with diagnostic message
- Error codes are categorized into three unions in `@sonic-core/types`:
  - `RuntimeErrorCode` (13 codes) — from C# runtime over the wire
  - `SidecarErrorCode` (9 codes) — transport/lifecycle failures
  - `EngineErrorCode` (4 codes) — TypeScript engine layer
  - `ErrorCode` — super-union of all three

### Error codes (stable)

| Code | Source | Retryable | Context |
|------|--------|-----------|---------|
| `invalid_source` | runtime | no | Asset file not found |
| `unsupported_format` | runtime | no | Non-WAV asset |
| `playback_not_found` | runtime | no | Unknown handle |
| `seek_unsupported` | runtime/engine | no | Seek on synthesis or failed seek |
| `device_unavailable` | runtime | yes | Device not found or unplugged |
| `synthesis_validation_failed` | runtime | no | Bad engine/text/speed/voice params |
| `synthesis_voice_not_found` | runtime | no | Voice ID not in registry |
| `synthesis_inference_failed` | runtime | no | ONNX inference error |
| `synthesis_not_configured` | runtime | no | Synthesis engine not available |
| `synthesis_model_missing` | runtime | no | ONNX model file not found |
| `synthesis_model_load_failed` | runtime | no | Failed to load ONNX model |
| `method_not_found` | runtime | no | Unknown protocol method |
| `invalid_params` | runtime | no | Missing/invalid parameters |
| `runtime_disposed` | sidecar | no | Backend disposed |
| `runtime_exited` | sidecar | no | Runtime process exited |
| `runtime_spawn_failed` | sidecar | no | Failed to spawn process |
| `runtime_not_running` | sidecar | no | Process not alive |
| `runtime_suspect` | sidecar | no | Killed after consecutive timeouts |
| `restart_limit_exceeded` | sidecar | no | Auto-restart limit reached |
| `request_timeout` | sidecar | yes | Request timed out |
| `protocol_mismatch` | sidecar | no | Unsupported protocol version |
| `handle_not_found` | sidecar | no | No runtime handle for playback ID |
| `engine_busy` | engine | no | Feature not implemented |
| `lease_expired` | engine | no | Playback lease expired |
| `permission_denied` | engine | no | Reserved for future use |

## What is provisional

These may change in 0.1.x patches without a protocol version bump:

- **Timeout defaults** — `requestTimeoutMs`, `handshakeTimeoutMs`, `maxConsecutiveTimeouts`, `maxRestarts` values may be tuned
- **Synthesis parameters** — `synthesize` may add optional `format`, `options` params for format selection when multiple formats are supported
- **Synthesis performance** — model load time (~750ms) and inference latency (~300ms) may change with model variants or GPU acceleration
- **Device routing** — per-playback device assignment is not yet supported by the runtime; `set_device` affects global output
- **Fade/ramp behavior** — `fade_in_ms`, `fade_out_ms`, `ramp_ms` are accepted but runtime implementation may vary
- **Error code enumeration** — new error codes may be added; existing codes will not be removed or renamed

## What is not yet implemented

- Hot-path extraction to C/Rust via P/Invoke (escape hatch from ADR-0006)
- ~~Kokoro ONNX model loading in SynthesisEngine~~ — **implemented in v0.2.0**
- ~~Runtime introspection methods~~ — **implemented in v0.3.0**
- ~~Event emission (synthesis_started, synthesis_completed, playback_ended)~~ — **implemented in v0.3.1**
- ~~SidecarBackend integration in bin.ts~~ — **implemented in v0.3.2**
- ~~Asset validation with structured diagnostics~~ — **implemented in v0.4.0**
- ~~Natural playback completion detection~~ — **implemented in v0.4.1**
- ~~Audio format capability reporting~~ — **implemented in v0.5.0**
- ~~Typed protocol message envelopes~~ — **implemented in v0.6.0**
- Device hot-plug event streaming from runtime to core
- Per-playback device routing
- Audio format selection (requesting specific output formats from synthesis)
- Event backpressure (not needed at current scale)

## SidecarBackend integration (v0.3.x)

sonic-core's `SidecarBackend` manages the runtime subprocess lifecycle:
- Spawns runtime, performs version handshake, maps handles
- Auto-restart on crash (configurable, max 3 retries)
- Consecutive timeout detection → kill and restart
- Graceful shutdown via `dispose()` on SIGINT/SIGTERM/exit
- Introspection methods exposed as sidecar-specific public API (not on AudioBackend interface)
- Event consumption via `onEvent` callback with safe wrapping (consumer exceptions don't poison the reader)
- `validateAssets()` returns structured preflight check (model, voices, espeak, ONNX runtime) with error strings and fix hints

See [service-runtime-setup.md](service-runtime-setup.md) for the operator guide.
See [operator-smoke-test.md](operator-smoke-test.md) for the canonical health verification sequence.

## Compatibility promise for 0.1.x

- The wire protocol shape will not change
- Existing method signatures will not change
- New methods may be added (unknown methods return `method_not_found`)
- New optional params may be added to existing methods
- Error codes will not be removed or renamed
- The `ndjson-stdio-v1` protocol identifier will remain valid

Breaking changes require a new protocol version (e.g., `ndjson-stdio-v2`).
