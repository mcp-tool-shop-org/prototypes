# ADR-0008: Runtime Events and Observability

**Status:** Accepted
**Date:** 2026-03-13
**Deciders:** mcp-tool-shop
**Supersedes:** —
**Related:** ADR-0005 (Native Runtime Boundary), ADR-0007 (Kokoro Synthesis Contract)

## Context

sonic-runtime v0.2.0 is a working machine: playback, device management, and synthesis all function end-to-end over the ndjson-stdio-v1 protocol. But the protocol is purely request/response — the control plane has no way to:

- Know when playback finishes naturally (vs being stopped)
- Inspect what the runtime has loaded (models, voices, devices)
- Check runtime health before issuing expensive commands
- Preload models to avoid cold-start latency on first synthesis
- Discover available voices without trial-and-error

This makes the system functional but opaque. Operators and the control plane are flying blind between requests.

## Decision

Add two categories of protocol extensions:

### 1. Introspection methods (request/response)

New methods that inspect runtime state without side effects:

| Method | Response | Purpose |
|--------|----------|---------|
| `get_health` | `{ status, uptime_ms, active_handles, model_loaded, voices_loaded, espeak_available }` | Pre-flight check before expensive operations |
| `get_capabilities` | `{ engines: ["kokoro"], features: [...], protocol }` | Client capability negotiation |
| `list_voices` | `[{ id, language, gender }]` | Discover available voices without guessing |
| `preload_model` | `{ loaded, load_time_ms }` | Warm the model before first synthesis |
| `get_model_status` | `{ loaded, path, load_time_ms, inference_count }` | Observability into model lifecycle |

These are normal request/response — no protocol changes needed.

### 2. Runtime events (unsolicited messages)

Messages the runtime sends without a corresponding request, identified by having no `id` field:

```json
{"event": "playback_ended", "data": {"handle": "h_000000000001", "reason": "completed"}}
{"event": "playback_ended", "data": {"handle": "h_000000000002", "reason": "error", "error": {"code": "device_unavailable", "message": "..."}}}
{"event": "synthesis_started", "data": {"handle": "h_000000000003"}}
{"event": "model_loaded", "data": {"engine": "kokoro", "load_time_ms": 750}}
```

#### Event shape

```json
{"event": "<event_name>", "data": { ... }}
```

No `id` field. This is the distinguishing marker: responses have `id`, events do not.

#### Event list (v0.3.0)

| Event | Data | When |
|-------|------|------|
| `playback_ended` | `{ handle, reason: "completed" \| "error" \| "stopped" }` | Playback reaches end, errors, or is stopped |
| `synthesis_started` | `{ handle }` | Inference begins (after tokenization, before ONNX) |
| `synthesis_completed` | `{ handle, duration_ms, inference_ms }` | Inference finishes, WAV ready |
| `model_loaded` | `{ engine, load_time_ms }` | Model lazy-loaded or preloaded |
| `device_changed` | `{ device_id, name }` | Active output device changes |

#### Event delivery guarantees

- Events are best-effort. The runtime writes them to stdout interleaved with responses.
- Events are never retried. If the control plane misses one, it can poll via introspection methods.
- Events must not block the audio thread or inference path.
- The control plane must tolerate unknown event names gracefully (ignore, don't crash).

### What stays request/response only

- All commands that change state (`play`, `stop`, `synthesize`, etc.)
- All queries with a specific answer (`get_position`, `get_duration`)
- Version handshake
- Shutdown

Events are never a substitute for command responses. They are supplementary signals.

## Constraints

- **No subscription model.** Events are always on. No subscribe/unsubscribe complexity. If a client doesn't want events, it ignores messages without `id`.
- **No event history.** Events are fire-and-forget. The runtime does not buffer or replay them.
- **No event IDs.** Events don't need correlation. They carry enough context (handle, engine) for the control plane to route them.
- **stdout only.** Events go on stdout, same as responses. stderr remains diagnostic-only.
- **No batching.** Each event is one JSON line. No arrays, no framing changes.

## Consequences

### Positive
- Control plane can detect natural playback completion (critical for lease management)
- Operators can inspect runtime state before and during operation
- Model preload eliminates cold-start surprise on first synthesis
- Voice discovery replaces trial-and-error with explicit enumeration
- Protocol extension is backward-compatible (clients that ignore unknown messages work fine)

### Negative
- SidecarBackend must now parse stdout for both responses (with `id`) and events (without `id`)
- Event interleaving with responses adds parsing complexity
- Events without delivery guarantees may cause subtle state drift if relied upon exclusively

### Migration
- Existing v0.1.0/v0.2.0 clients continue to work — new methods and events are additive
- SidecarBackend needs a message router: `id` present → response correlation, `id` absent → event dispatch
