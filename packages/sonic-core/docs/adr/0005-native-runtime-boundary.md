# ADR-0005: Native Runtime Boundary

**Status:** Accepted  
**Date:** 2026-03-12  
**Deciders:** mcp-tool-shop  
**Supersedes:** —  
**Related:** ADR-0003 (Shared Audio Core Contract)

## Context

ADR-0003 established sonic-core as the shared audio execution engine — contracts, command routing, playback registry, lease semantics, and MCP service adapters all live here. The `AudioBackend` interface was left intentionally abstract.

Kokoro synthesis changes the calculus. It pulls toward native concerns quickly:

- Model loading and ONNX runtime integration
- Inference performance and memory management
- Streaming vs full render
- Voice asset handling and latency
- Native audio API access (WASAPI, ASIO, CoreAudio)
- Buffer mixing, device timing, pan/gain/fades

These are exactly the kinds of things that become sticky and weird in a pure Node-first engine. Possible? Sure. Elegant? Usually not. The universe often punishes "just one more wrapper" with interest.

## Decision

Split into two repos with clean responsibilities:

### sonic-core — Contracts and Control Plane

**Knows:**
- What commands exist
- What inputs are valid
- What playback state means
- How leases expire
- How clients talk to the engine

**Does not know:**
- How to talk to ASIO/WASAPI/CoreAudio
- How to render Kokoro
- How buffers are mixed
- How device timing actually works

**Contains:**
- Schemas and types (`@sonic-core/types`)
- Command router and MCP/service adapters (`@sonic-core/service`)
- Playback registry and lease watcher (`@sonic-core/engine`)
- TS/C# client SDKs (`@sonic-core/client`)
- Tests with `NullBackend`

### sonic-runtime — Native Execution Plane

**Knows:**
- Playback (load, play, stop, fade)
- Device enumeration and switching
- Pan/gain/fades and buffer/mixer timing
- Synthesis execution (Kokoro model loading, inference, streaming)
- Native audio APIs

**Does not know:**
- Therapy
- Ambient regulation
- User profiles
- Protocol meaning
- App UX

That's the blast wall holding.

## Architecture: Subprocess Sidecar

sonic-runtime is a **subprocess sidecar**, not a native addon loaded into Node.

**Why sidecar over native addon:**

| Concern | Sidecar | Native Addon |
|---|---|---|
| Separation | Clean process boundary | Shares Node heap |
| Crash containment | Runtime crash ≠ host crash | Can take down the host |
| Build/distribution | Simpler native build story | Ugly N-API/node-gyp story |
| Call overhead | IPC (negligible for audio commands) | Direct function call |
| Desktop packaging | Natural fit (ship a binary) | Tied to Node version |
| Isolation | Full | Shared memory space |

For this use case: more boring, more robust, less likely to turn into a build-system cryptid.

## Command Protocol

sonic-core launches sonic-runtime as a child process. Communication is **newline-delimited JSON over stdio** (same shape as MCP stdio transport).

```
core → runtime:  { "id": 1, "method": "play", "params": { "asset_ref": "file:///rain.wav", "volume": 0.8 } }
runtime → core:  { "id": 1, "result": { "handle": "h_abc123", "duration_ms": 180000 } }
```

The runtime exposes a minimal surface:

- `load_asset(asset_ref) → handle`
- `play(handle, volume, pan, fade_in_ms, loop) → void`
- `pause(handle, fade_out_ms) → void`
- `resume(handle, fade_in_ms) → void`
- `stop(handle, fade_out_ms) → void`
- `seek(handle, position_ms) → void`
- `set_volume(handle, level, fade_ms) → void`
- `set_pan(handle, value, ramp_ms) → void`
- `get_position(handle) → position_ms`
- `get_duration(handle) → duration_ms | null`
- `list_devices() → DeviceInfo[]`
- `set_device(device_id) → void`
- `synthesize(engine, voice, text, speed?) → handle`

The runtime does **not** know about playback IDs, leases, or interrupt modes. It works with opaque handles. sonic-core's engine maps `playback_id` → `handle` and owns all policy.

## Lease Boundary

Leases stay in sonic-core. The runtime only obeys stop/update commands. Core's `LeaseWatcher` fires expiry → core sends `stop` to runtime. No lease logic crosses the process boundary.

If the runtime ever becomes a standalone daemon (e.g., system audio service), lease policy could migrate. Not now.

## Build Sequence

1. **Freeze the runtime protocol** — define exactly how sonic-core talks to sonic-runtime
2. **Build playback first in runtime** — load asset, play/stop, fade, volume, pan, device list, device switch
3. **Add Kokoro execution** — core validates synthesis request, sends clean request to runtime, runtime loads model / renders audio / returns playable handle
4. **Wire lease semantics across the boundary** — core owns the lease policy, runtime only obeys stop/update commands

## Consequences

- sonic-core stays TypeScript-only — no native build complexity
- sonic-runtime can be built in any language suited for native audio (C#/WinUI, Rust, C++)
- The `AudioBackend` interface in sonic-core becomes a `SidecarBackend` that speaks the subprocess protocol
- `NullBackend` remains for testing without the runtime
- Desktop packaging ships both processes; the runtime binary is platform-specific
- RTX 5080 / DirectML / ONNX concerns stay fully contained in runtime
