---
title: SDK Guide
description: SDK API surface, streaming model, and integration patterns.
sidebar:
  order: 3
---

The `Soundboard.Client` SDK is the core product. This guide covers its API surface, streaming model, and typical integration patterns.

## SDK surface

| Method | Description |
|---|---|
| `GetHealthAsync()` | Engine health check — returns version info and readiness status |
| `GetPresetsAsync()` | Lists available preset identifiers (e.g. `narrator`, `conversational`) |
| `GetVoicesAsync()` | Lists available voice identifiers |
| `SpeakAsync(request, progress)` | Streams synthesized speech; reports `AudioChunk` via `IProgress<T>` |
| `StopAsync()` | Sends a stop command to the engine |

All methods accept `CancellationToken`. The client implements `IAsyncDisposable`.

## SDK rules

1. **One interface.** All engine interaction goes through `ISoundboardClient`.
2. **No UI dependency.** The SDK targets `net8.0`, `net9.0`, and `net10.0` with no platform-specific code.
3. **Streaming-first.** Audio arrives via `IProgress<AudioChunk>` -- no buffering, no files.
4. **Cancellation everywhere.** Every async method accepts `CancellationToken`.
5. **Engine-agnostic.** The SDK speaks the API contract. Any compliant engine works.
6. **Sealed types.** All models and the client implementation are `sealed`.

## Streaming model

```
Your App          SDK (Soundboard.Client)          Engine
   |                       |                          |
   |-- SpeakAsync -------->|                          |
   |                       |-- WebSocket connect ---->|
   |                       |-- speak command -------->|
   |                       |                          |
   |                       |<-- state: started -------|
   |                       |<-- audio_chunk ----------|
   |<- IProgress.Report ---|                          |
   |                       |<-- audio_chunk ----------|
   |<- IProgress.Report ---|                          |
   |                       |<-- state: finished ------|
   |<- SpeakAsync returns -|                          |
```

### Why IProgress instead of Stream

- **No buffering.** Chunks flow directly to your handler as they arrive.
- **No backpressure.** The SDK does not wait for your handler to finish before processing the next chunk. Keep your handler fast.
- **Thread-safe reporting.** If you use `Progress<T>` (the default), callbacks are marshaled to the captured `SynchronizationContext`. On a UI thread, chunks arrive on the UI thread automatically.

### One connection per speak

Each `SpeakAsync` call opens a new WebSocket connection. No connection pooling, no state leakage between requests. Trade-off: slightly higher latency on the first chunk due to WebSocket handshake.

### Cancellation behavior

Passing a cancelled token or calling `Cancel()`:

1. Cancels the WebSocket receive loop
2. Throws `OperationCanceledException` from `SpeakAsync`
3. Does **not** automatically call `StopAsync` on the engine -- do this yourself if you want the engine to stop generating

## Audio format

| Property | Value |
|----------|-------|
| Encoding | PCM16 (signed 16-bit little-endian) |
| Channels | 1 (mono) |
| Sample rate | 24,000 Hz (reported in each chunk) |

Always use `AudioChunk.SampleRate` rather than hardcoding 24000 -- future engines may use different rates.

### Chunk sizes

Chunk sizes are determined by the engine:

- First chunk: 1-4 KB (may be smaller as the engine starts generating)
- Subsequent chunks: 4-8 KB
- Total for a sentence: 20-100 KB depending on length

The SDK does not split or merge chunks. What the engine sends is what your `IProgress` handler receives.

## Timeouts

| Timeout | Default | Effect |
|---------|---------|--------|
| `HttpTimeout` | 10s | Cancels HTTP requests (health, presets, voices, stop) |
| `WebSocketConnectTimeout` | 5s | Cancels if the WebSocket handshake takes too long |
| `WebSocketReceiveTimeout` | 30s | Cancels if no message arrives within this window |

HTTP timeouts throw `TaskCanceledException`. WebSocket timeouts throw `OperationCanceledException`.

## Typical integration pattern

```csharp
// 1. Start your audio output
audioPlayer.Start(sampleRate: 24000);

// 2. Feed chunks as they arrive
var firstChunk = true;
var progress = new Progress<AudioChunk>(chunk =>
{
    audioPlayer.Feed(chunk);
    if (firstChunk)
    {
        firstChunk = false;
        // Update UI: "Playing..."
    }
});

// 3. Speak (blocks until finished or cancelled)
try
{
    await client.SpeakAsync(request, progress, cancellationToken);
    // Update UI: "Done"
}
catch (OperationCanceledException)
{
    audioPlayer.Stop();
    // Update UI: "Stopped"
}
catch (Exception)
{
    // Update UI: "Error"
}
```

## Models

### Interface

```
ISoundboardClient : IAsyncDisposable
  GetHealthAsync(CancellationToken)
  GetPresetsAsync(CancellationToken)
  GetVoicesAsync(CancellationToken)
  SpeakAsync(SpeakRequest, IProgress<AudioChunk>, CancellationToken)
  StopAsync(CancellationToken)
```

### Data types (`Soundboard.Client.Models`)

- `EngineInfo(Status, EngineVersion, ApiVersion)`
- `SpeakRequest(Text, Preset, Voice, RequestId?)`
- `AudioChunk(PcmData, SampleRate)`
- `EngineEvent(State)`

### Constructor

`SoundboardClient` accepts three optional parameters:

- `SoundboardClientOptions?` -- configuration (default: reads from environment)
- `HttpClient?` -- bring your own HTTP client for testing or custom policies
- `ILogger?` -- structured logging via `Microsoft.Extensions.Logging`

### Configuration

- `SoundboardClientOptions` record with `BaseUrl`, `HttpTimeout`, `WebSocketConnectTimeout`, `WebSocketReceiveTimeout`
- `SOUNDBOARD_BASE_URL` environment variable (default: `http://localhost:8765`)

### Audio adapter (separate package)

- `IAudioPlayer` interface: `Start`, `Feed`, `Stop`, `Flush`, `IsPlaying`, `BufferedChunks`
- Lives in `Soundboard.Maui.Audio` -- not part of the SDK. Implement your own for non-Windows platforms.

## Stability guarantees

### Will NOT change in v1.x

- `ISoundboardClient` interface shape
- `SpeakRequest`, `AudioChunk`, `EngineInfo`, `EngineEvent` record shapes
- `SoundboardClientOptions` property names
- `SOUNDBOARD_BASE_URL` environment variable behavior
- `IProgress<AudioChunk>` streaming pattern
- `CancellationToken` on every async method

### MAY change in v1.x (minor/patch)

- Default timeout values
- Internal logging formats
- Buffer sizes and transport optimizations
- New optional parameters with defaults

### Requires v2.0

- Removing or renaming any public type or method
- Changing parameter types on existing methods
- Changing the wire protocol
- Adding required parameters without defaults
