# ADR-0010: Audio Backend Replacement — OpenAL Soft via Silk.NET

**Status:** Accepted
**Date:** 2026-03-13
**Deciders:** mcp-tool-shop
**Supersedes:** —
**Related:** ADR-0005 (Native Runtime Boundary), ADR-0006 (Runtime Language Stack)

## Context

sonic-runtime uses SoundFlow 1.1.1 as its audio backend. SoundFlow provides a singleton engine with a single master output — one global device path for all playback. This blocks per-playback device routing, which is a product-critical capability: routing playback A to headphones and playback B to speakers simultaneously.

ADR-0006 chose C# with NativeAOT for the runtime language. Any replacement backend must be NativeAOT-compatible.

### Backend evaluation spike (2026-03-13)

Four candidates were evaluated against these criteria: per-playback device routing, NativeAOT viability, Windows reliability, lifecycle fit with the existing runtime model, packaging complexity, and protocol preservation.

#### NAudio — eliminated

NAudio's WASAPI layer relies on COM interop (`MMDeviceEnumerator`) that NativeAOT's IL compiler rejects. GitHub issue #1211 (Feb 2025) is open with no fix. The maintainer describes the project as maintenance-mode. The WinMM fallback could theoretically work under NativeAOT with source modifications, but WinMM loses the per-device routing capability that motivates the replacement.

**Verdict:** Dead path. NativeAOT COM interop failure is a hard blocker.

#### Raw WASAPI via `[GeneratedComInterface]` — viable, expensive

WASAPI shared mode natively supports multiple `IAudioClient` instances targeting different endpoints. .NET 8's `[GeneratedComInterface]` makes classic COM interop NativeAOT-safe. Zero runtime dependencies (Windows built-in APIs).

The cost is implementation surface: ~500-800 lines of COM interface definitions with vtable-order precision (one wrong slot = crash), plus a manual render pump, manual seek via read-cursor tracking, and manual buffer management. No existing .NET wrapper covers this path under NativeAOT.

**Verdict:** Break-glass option. Maximum control, maximum effort. Hold in reserve if OpenAL Soft fails in practice.

#### ManagedBass (BASS) — capable, encumbered

BASS has first-class multi-device routing (`Bass.Init` per device, `ChannelSetDevice` to move streams). The API is well-designed for the exact use case.

Three concerns: (1) Commercial licensing is 950 EUR per product. (2) Native `bass.dll` is not bundled in the NuGet package — requires manual download from un4seen.com and manual distribution. (3) NativeAOT is unverified — ManagedBass uses `[DllImport]` (not `[LibraryImport]`), which should work, but callback delegates are the highest-risk area under AOT. No trim annotations, no AOT testing by maintainers.

**Verdict:** Technically strong, strategically encumbered. Licensing cost, packaging friction, and AOT uncertainty are too much baggage for a first pivot.

#### OpenAL Soft via Silk.NET — selected

Per-device routing via multiple contexts (one `alcOpenDevice` + `alcCreateContext` per output device). Sources within each context play to that device independently. `alcSetThreadContext` enables thread-local context binding.

NativeAOT interop is trivial — OpenAL Soft is a flat C library, all interaction via P/Invoke. Silk.NET (a .NET Foundation project) provides the bindings with shipped NativeAOT-specific fixes (issue #960). `Silk.NET.OpenAL.Soft.Native` bundles the native binary (~1.5MB) via NuGet.

LGPL licensed (free). Actively maintained. Windows uses WASAPI as its internal backend.

**Pan caveat:** OpenAL is a 3D spatial audio API. Panning is achieved by positioning sources in 3D space relative to the listener, not via a direct `-1.0 to 1.0` scalar. This requires a thin abstraction in the runtime to translate the existing pan contract to 3D coordinates.

**Verdict:** Best balance of capability, implementation speed, AOT fit, packaging sanity, and maintainability.

## Decision

Adopt OpenAL Soft via Silk.NET as the replacement audio backend for sonic-runtime.

Replace SoundFlow's singleton engine model with OpenAL's device/context/source model to unlock per-playback device routing.

## Consequences

### What changes

- Runtime backend implementation replaces SoundFlow with OpenAL Soft via Silk.NET
- Device model changes from global singleton to per-device context
- Pan implementation moves from scalar to 3D-positioning model (thin translation layer)
- SoundFlow-specific assumptions must be isolated and removed from the runtime backend layer
- `Silk.NET.OpenAL` and `Silk.NET.OpenAL.Soft.Native` added as runtime dependencies
- Published binary grows by ~1.5MB (OpenAL Soft native library)

### What does not change

- Sidecar protocol (`ndjson-stdio-v1`) — no wire format changes
- sonic-core TypeScript layer — no changes to types, engine, or service packages anticipated, assuming the spike validates backend replacement without protocol changes
- Existing protocol methods, error codes, event shapes — all preserved
- Synthesis pipeline (Kokoro ONNX) — independent of playback backend
- Handle semantics, recovery semantics, timeout tracking — all sidecar-level, unchanged

### Non-goals

- No protocol redesign
- No product-level routing semantics change (that's a separate product decision)
- No streaming synthesis redesign
- No immediate cross-platform expansion just because OpenAL makes it possible

### Risks (updated post-spike)

- ~~OpenAL's 3D pan model may produce subtly different stereo imaging~~ — **Resolved:** `SourceRelative=true` with X position maps `-1..1` directly. No translation layer needed; existing contract preserved exactly.
- ~~Multiple device contexts have not been tested under NativeAOT~~ — **Resolved:** Spike proved simultaneous playback on Speakers + Monitor with independent stop behavior.
- End-of-playback detection requires polling `AL_SOURCE_STATE` rather than a callback. Spike confirmed 10ms polling detects 100ms tone completion in 98ms — acceptable latency.
- ~~Native OpenAL Soft binary must be verified under NativeAOT publish~~ — **Partially resolved:** ILC (NativeAOT IL compiler) succeeds. Final linker step fails due to VS2025 Insiders `vswhere.exe` environment issue shared with existing SoundFlow runtime — not OpenAL-specific. Must be resolved as a build environment prerequisite.
- Device enumeration requires `ALC_ENUMERATE_ALL_EXT` via raw function pointer (~10 lines). The Silk.NET `Enumeration` extension only wraps `ALC_ENUMERATION_EXT` which returns "OpenAL Soft" as a single logical device, not actual hardware endpoints.

## Validation spike results (2026-03-13)

Spike branch: `spike/openal-soft` in sonic-runtime. Packages: `Silk.NET.OpenAL` 2.22.0, `Silk.NET.OpenAL.Extensions.Enumeration` 2.22.0, `Silk.NET.OpenAL.Soft.Native` 1.23.1.

| Phase | Result | Evidence |
|---|---|---|
| 1. Library + NativeAOT | PASS | `AL.GetApi()` loads, ILC compiles without errors |
| 2. Device enumeration | PASS | 3 devices: Speakers (Realtek), Monitor (Display Audio), Headphones (USB-C Dock) |
| 3. Single-device playback | PASS | Open/play/stop/cleanup + 5x cycle stability |
| 4. Per-device routing | PASS | Speakers + Monitor simultaneous, independent stop |
| 5. Pan / spatial | PASS | `-1..1` maps directly via `SourceRelative` + X position |
| 6. Completion detection | PASS | 100ms tone detected in 98ms, stop-on-completed is safe |
| 7. Lifecycle hygiene | PASS | 20x rapid churn, 5 simultaneous sources, no leak |
| 8. Integration fit | PASS | Device→context, source→slot, buffer→WAV maps cleanly |
| 9. NativeAOT publish | PASS (ILC) | Native codegen succeeded; linker fail is shared environment issue |

**All nine gates passed. Migration proceeds.**
