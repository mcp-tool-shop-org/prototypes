# ADR-0006: Runtime Language Stack

**Status:** Accepted
**Date:** 2026-03-12
**Deciders:** mcp-tool-shop
**Supersedes:** —
**Related:** ADR-0003 (Shared Audio Core Contract), ADR-0005 (Native Runtime Boundary)

## Context

ADR-0005 established that sonic-runtime will be a subprocess sidecar — a native binary that sonic-core launches and talks to over newline-delimited JSON on stdio. The `AudioBackend` interface in sonic-core defines the exact command surface. ADR-0005 intentionally left the runtime language open:

> sonic-runtime can be built in any language suited for native audio (C#/WinUI, Rust, C++)

This ADR ratifies the language choice.

### Candidates Evaluated

**Rust**
- Best raw latency and memory safety guarantees
- No GC, deterministic resource cleanup
- Strong audio ecosystem (cpal, rodio)
- **Problem:** new toolchain, new CI surface, new packaging complexity, new expertise silo in a 130-repo ecosystem that is heavily .NET/TypeScript-shaped. Technically elegant, operationally expensive.

**C++**
- Maximum hardware control
- **Problem:** build system complexity, memory safety burden, no ecosystem alignment. The cost/benefit ratio is wrong for a sidecar.

**C# / .NET with NativeAOT**
- Direct ecosystem alignment — existing .NET repos, KokoroSharp, WinUI clients
- ONNX Runtime has first-class .NET bindings
- NAudio / CSCore for Windows audio APIs
- NativeAOT compiles to a single native binary with no JIT warmup
- RTX 5080 / DirectML / ONNX concerns stay contained
- **Trade-off:** GC exists. Must be managed through disciplined allocation patterns on hot paths.

### Decision Factors

1. **Ecosystem coherence** — adding Rust creates a toolchain island. C# keeps the build, CI, and contributor story unified.
2. **ONNX/Kokoro path** — KokoroSharp already exists in the .NET ecosystem. Native .NET ONNX Runtime bindings avoid an FFI layer.
3. **Desktop packaging** — NativeAOT produces a single executable suitable for sidecar deployment alongside Electron/WinUI hosts.
4. **Startup latency** — NativeAOT eliminates JIT warmup. The sidecar starts fast, which matters for subprocess lifecycle.
5. **CI budget** — C# builds on `ubuntu-latest` (or `windows-latest` when needed). No cross-compilation ceremony.

## Decision

**sonic-runtime will be built in C# targeting .NET 8 LTS with NativeAOT publishing.**

### Hard Constraints

- **NativeAOT is required**, not optional. The sidecar must publish as a self-contained native binary. No JIT, no framework dependency on the host.
- **.NET 8 LTS** — infrastructure takes the stable floor, not the shiny ceiling. No .NET 9 unless a specific blocking feature requires it.
- **Windows-first for v1** — matches the primary deployment target (RTX 5080 desktop, WASAPI, DirectML).

### Non-Goals (What Stays Out of the Runtime)

- No UI frameworks (WinUI, WPF, MAUI)
- No dependency injection containers
- No app host machinery (`IHost`, `IHostBuilder`)
- No user state, session logic, or product semantics
- No lease logic (leases stay in sonic-core per ADR-0005)
- No preset ownership or persistence

### Runtime Architecture

| Component | Responsibility |
|---|---|
| **CommandLoop** | Read newline-delimited JSON from stdin, dispatch, write responses to stdout |
| **PlaybackEngine** | Load assets, play/stop/pause/resume, fade, volume, pan, loop, seek |
| **DeviceManager** | Enumerate devices, select output, handle hot-plug/unplug |
| **SynthesisEngine** | Load ONNX model, run Kokoro inference, produce playable PCM |
| **RuntimeState** | Map opaque handles to active playback instances. No leases, no policy. |

### Anti-Crackle Discipline

NativeAOT reduces GC pressure but does not eliminate it. The runtime must be designed like a real-time-ish engine, not a normal application:

- **No per-buffer allocations on the audio callback path.** Preallocate buffers at startup or on load.
- **JSON parsing stays off the hot path.** The command loop runs on a separate thread from the audio mixer.
- **Logging stays off timing-critical paths.** Structured logging goes to stderr, buffered, never blocking playback.
- **No framework abstractions on the mixer thread.** The playback core is plain imperative code with direct buffer access.
- **Gain/pan ramps use sample-accurate interpolation**, not per-callback stepped values, to prevent zipper noise.
- **No LINQ, no lambda closures, no convenience allocations on mixer/device hot paths.** C# loves to hand you elegant little performance gremlins. If it allocates, it does not belong on the audio thread.

If this is not sufficient — if pan automation, bilateral timing, or model/audio coexistence under GPU load produces audible artifacts — the escape hatch applies.

### Escape Hatch

If real-world testing reveals that C#/NativeAOT cannot deliver stable, crackle-free playback under load, the hot path (mixer loop, buffer filling, device I/O) may be extracted into a lower-level native module (C or Rust) loaded via P/Invoke. This is a contingency, not a plan. The command loop, synthesis dispatch, and device management would remain in C#.

## Wire Protocol Alignment

The runtime implements the subprocess side of the protocol defined in ADR-0005:

```
core → runtime:  { "id": 1, "method": "play", "params": { ... } }
runtime → core:  { "id": 1, "result": { ... } }
runtime → core:  { "id": 1, "error": { "code": "...", "message": "...", "retryable": false } }
```

**stdout** is reserved exclusively for protocol messages. **stderr** carries diagnostics/logging. This separation is inviolable — a single stray `Console.WriteLine` on stdout corrupts the protocol stream.

### Runtime Methods (from ADR-0005)

| Method | Maps to `AudioBackend` |
|---|---|
| `load_asset` | — (runtime-only, returns opaque handle; never exposed to clients — sonic-core's `SidecarBackend` translates handle → playback_id) |
| `play` | `play(id, source, options)` |
| `pause` | `pause(id)` |
| `resume` | `resume(id)` |
| `stop` | `stop(id, fade_out_ms)` |
| `seek` | `seek(id, position_ms)` |
| `set_volume` | `set_volume(id, level, fade_ms)` |
| `set_pan` | `set_pan(id, value, ramp_ms)` |
| `get_position` | `get_position_ms(id)` |
| `get_duration` | `get_duration_ms(id)` |
| `list_devices` | `get_devices()` |
| `set_device` | `set_output_device(device_id)` |
| `synthesize` | — (runtime-only, returns opaque handle; same as `load_asset` — handle stays internal, sonic-core maps it) |

### Error Model

Runtime errors use the same shape as `SonicError` in `@sonic-core/types`:

```json
{ "code": "device_unavailable", "message": "...", "retryable": true }
```

sonic-core's `SidecarBackend` translates these into `SonicEngineError` instances.

## Consequences

**Positive:**
- Single toolchain across the .NET repos in the ecosystem
- NativeAOT sidecar starts fast, deploys as one file, crashes without taking down the host
- ONNX Runtime and audio libraries are first-class .NET citizens
- Clean alignment with ADR-0005 protocol boundary

**Negative:**
- GC still exists and must be actively managed on hot paths
- NativeAOT has trimming restrictions (no runtime reflection, limited dynamic loading)
- Audio library choices (NAudio, CSCore) may need evaluation for NativeAOT compatibility
- **Validation required:** verify NativeAOT compatibility of the chosen audio library before committing to it. Build a trivial NativeAOT publish with the library and confirm it trims and runs before writing real code against it.
- Windows-first means Linux/macOS audio backends are deferred

**Follow-on work:**
- Create `sonic-runtime` repo under `mcp-tool-shop-org`
- Scaffold .NET 8 solution with NativeAOT publishing
- Implement `CommandLoop` → `PlaybackEngine` → `DeviceManager` pipeline
- Add `SidecarBackend` to sonic-core that speaks the stdio protocol
- Integration tests: sonic-core ↔ sonic-runtime over real subprocess
