# Soundboard SDK — API Reference v1.0

> **Soundboard.Client is a standalone .NET SDK.**
> It has zero MAUI dependencies. Reference it from any .NET 8+ project —
> console apps, WPF, WinForms, ASP.NET, or your own TTS frontend.

**Status:** Stable
**Version:** 1.0.0
**Package:** `Soundboard.Client` (NuGet)

---

## SDK Rules

1. **One interface.** All engine interaction goes through `ISoundboardClient`.
2. **No UI dependency.** The SDK targets `net8.0` with no platform-specific code.
3. **Streaming-first.** Audio arrives via `IProgress<AudioChunk>` — no buffering, no files.
4. **Cancellation everywhere.** Every async method accepts `CancellationToken`.
5. **Engine-agnostic.** The SDK speaks the [API contract](api-contract.md). Any compliant engine works.
6. **Sealed types.** All models and the client implementation are `sealed`. Extend by composition, not inheritance.

---

## Public API Surface

### Interface

- `ISoundboardClient : IAsyncDisposable`
  - `GetHealthAsync(CancellationToken)`
  - `GetPresetsAsync(CancellationToken)`
  - `GetVoicesAsync(CancellationToken)`
  - `SpeakAsync(SpeakRequest, IProgress<AudioChunk>, CancellationToken)`
  - `StopAsync(CancellationToken)`

### Models (`Soundboard.Client.Models`)

- `EngineInfo(Status, EngineVersion, ApiVersion)`
- `SpeakRequest(Text, Preset, Voice, RequestId?)`
- `AudioChunk(PcmData, SampleRate)`
- `EngineEvent(State)`

### Configuration

- `SoundboardClientOptions` record with `BaseUrl`, `HttpTimeout`, `WebSocketConnectTimeout`, `WebSocketReceiveTimeout`
- `SOUNDBOARD_BASE_URL` environment variable (default: `http://localhost:8765`)

### Audio Adapter (separate package)

- `IAudioPlayer` interface: `Start`, `Feed`, `Stop`, `Flush`, `IsPlaying`, `BufferedChunks`
- Lives in `Soundboard.Maui.Audio` — not part of the SDK. Implement your own for non-Windows platforms.

---

## Not Guaranteed (Internal)

These may change without a major version bump:

- Internal logging message formats and levels
- Default timeout values
- Transport implementation details (buffer sizes, JSON serialization options)
- Internal constructors (marked `internal`)
- `SpeakRequest.ResolvedRequestId` (internal helper)

---

## Breaking Change Policy

- Requires major version bump (1.x → 2.0)
- Must be documented in CHANGELOG
- Deprecated APIs get `[Obsolete]` for at least one minor release before removal
- No breaking changes in patch releases
