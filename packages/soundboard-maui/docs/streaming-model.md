# Streaming Model

How audio flows from the engine to your application through the SDK.

## Overview

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
   |                       |<-- audio_chunk ----------|
   |<- IProgress.Report ---|                          |
   |                       |<-- state: finished ------|
   |<- SpeakAsync returns -|                          |
```

## Key design decisions

### IProgress<AudioChunk> instead of Stream

The SDK uses `IProgress<AudioChunk>` rather than returning a `Stream`. This means:

- **No buffering.** Chunks flow directly to your handler as they arrive.
- **No backpressure.** The SDK does not wait for your handler to finish before processing the next chunk. Keep your handler fast.
- **Thread-safe reporting.** If you use `Progress<T>` (the default implementation), callbacks are marshaled to the captured `SynchronizationContext`. On a UI thread, this means chunks arrive on the UI thread automatically.

### One connection per speak

Each `SpeakAsync` call opens a new WebSocket connection. This is simple but means:

- No connection pooling overhead to manage
- No state leakage between requests
- Slightly higher latency on the first chunk (WebSocket handshake)

### Cancellation stops everything

Passing a cancelled `CancellationToken` or calling `Cancel()` on your `CancellationTokenSource`:

1. Cancels the WebSocket receive loop
2. Throws `OperationCanceledException` from `SpeakAsync`
3. Does **not** automatically call `StopAsync` on the engine — do this yourself if you want the engine to stop generating

## Audio format

All chunks arrive in the same format:

| Property | Value |
|----------|-------|
| Encoding | PCM16 (signed 16-bit little-endian) |
| Channels | 1 (mono) |
| Sample rate | 24,000 Hz (reported in each chunk) |

The `AudioChunk.SampleRate` field is populated from the engine's response. Always use it rather than hardcoding 24000, in case future engines use different rates.

## Chunk sizes

Chunk sizes are determined by the engine, not the SDK. Typical values:

- First chunk: 1-4 KB (may be smaller as the engine starts generating)
- Subsequent chunks: 4-8 KB
- Total for a sentence: 20-100 KB depending on length

The SDK does not split or merge chunks. What the engine sends is what your `IProgress` handler receives.

## Timeouts

Two timeouts protect against hung connections:

| Timeout | Default | Effect |
|---------|---------|--------|
| `WebSocketConnectTimeout` | 5s | Cancels if the WebSocket handshake takes too long |
| `WebSocketReceiveTimeout` | 30s | Cancels if no message arrives within this window |

Both throw `OperationCanceledException` when triggered.

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

## Related

- [Error model](error-model.md) — what can go wrong and how to handle it
- [API contract](api-contract.md) — wire protocol details
- [Getting started](getting-started-sdk.md) — quick integration guide
