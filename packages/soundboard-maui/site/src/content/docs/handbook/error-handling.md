---
title: Error Handling
description: Failure modes, exception types, and troubleshooting patterns.
sidebar:
  order: 5
---

The SDK surfaces failures as standard .NET exceptions. No custom exception types.

## Exception types

| Exception | When | What to do |
|-----------|------|------------|
| `HttpRequestException` | Engine unreachable (health, presets, voices, stop) | Show offline state, offer retry |
| `TaskCanceledException` | HTTP request timed out | Same as above |
| `OperationCanceledException` | Caller cancelled via `CancellationToken`, or WebSocket timeout | Distinguish user cancel from timeout via `CancellationToken.IsCancellationRequested` |
| `InvalidOperationException` | Engine returned an error message, or health response was null | Show human-friendly error, allow retry |
| `WebSocketException` | Connection dropped mid-stream | Show error, allow new speak attempt |
| `JsonException` | Malformed engine response | Log for debugging, show generic error |

## Failure modes by operation

### GetHealthAsync

| Condition | Result |
|-----------|--------|
| Engine off | `HttpRequestException` |
| Engine loading | Returns `EngineInfo` with Status = "loading" |
| Engine ready | Returns `EngineInfo` with Status = "ready" |
| Timeout | `TaskCanceledException` |

Call on startup. If it fails, set an offline state and let the user retry.

### GetPresetsAsync / GetVoicesAsync

| Condition | Result |
|-----------|--------|
| Engine off | `HttpRequestException` |
| Unexpected format | `JsonException` or `KeyNotFoundException` |
| Timeout | `TaskCanceledException` |

Call after health check succeeds. Cache results -- presets and voices rarely change within a session.

### SpeakAsync

| Condition | Result |
|-----------|--------|
| WebSocket connect fails | `WebSocketException` |
| Connect timeout | `OperationCanceledException` |
| Engine returns error | `InvalidOperationException` (message from engine) |
| No data for 30s | `OperationCanceledException` (receive timeout) |
| Connection drops mid-stream | `WebSocketException` |
| User cancels | `OperationCanceledException` |

Wrap in try/catch. Always reset your audio player in the `finally` block.

### StopAsync

| Condition | Result |
|-----------|--------|
| Engine off | `HttpRequestException` |
| Timeout | `TaskCanceledException` |

Fire-and-forget is acceptable. The engine will stop on its own when the WebSocket closes.

## Recommended error handling pattern

```csharp
try
{
    await client.SpeakAsync(request, progress, ct);
    Status = "Done";
}
catch (OperationCanceledException) when (ct.IsCancellationRequested)
{
    Status = "Stopped";
}
catch (OperationCanceledException)
{
    // Timeout — not user-initiated
    Status = "Connection timed out";
}
catch (InvalidOperationException)
{
    Status = "Engine error — try again";
}
catch (Exception)
{
    Status = "Something went wrong";
}
finally
{
    audioPlayer.Stop();
    IsSpeaking = false;
}
```

## Logging

The SDK uses `Microsoft.Extensions.Logging`. Pass an `ILogger` to the constructor:

```csharp
var client = new SoundboardClient(
    logger: loggerFactory.CreateLogger<SoundboardClient>());
```

Log levels used:

| Level | Content |
|-------|---------|
| Debug | HTTP requests, WebSocket lifecycle, state events |
| Information | Speak started/completed with request ID and chunk count |
| Error | Engine error messages |

## What the SDK does NOT do

- **No retry logic.** The SDK does not retry failed requests. Your application decides when and how to retry.
- **No circuit breaker.** If the engine is down, every call will fail. Implement your own backoff if needed.
- **No error event stream.** Errors are exceptions, not events. There is no `OnError` callback.
- **No error codes.** The SDK surfaces the engine's error message as a string, not a typed error code.

## Known limitations

### Platform

- **Windows only.** The MAUI app targets `net10.0-windows10.0.19041.0`. macOS/Linux/mobile are not tested.
- **NAudio dependency.** The audio adapter uses NAudio's `WaveOutEvent`, which is Windows-specific.

### Streaming

- **No buffering strategy.** Audio plays as chunks arrive. If the engine is slow, playback may stutter.
- **No retry on stream failure.** If the WebSocket drops mid-stream, the operation fails. The user must press Speak again.
- **Single stream.** Only one speak operation at a time. Starting a new one cancels the previous.

### Audio

- **PCM16 mono 24kHz only.** Other formats require a different `IAudioPlayer` implementation.
- **No volume control.** Playback volume follows system volume.
- **No audio file export.** Audio is played, not saved.

### Client library

- **No connection pooling.** Each `SpeakAsync` opens a new WebSocket.
- **30-second receive timeout.** If the engine doesn't send data for 30 seconds, the connection is dropped.
- **No automatic reconnection.** If the engine goes offline, the user must tap the status label to retry.

## Evaluation checklist

When evaluating the error handling:

- Offline engine shows clear status, not a crash
- Tapping offline status retries the connection
- Mid-stream failure shows human-readable error
- App never requires restart to recover
- Time from pressing Speak to first audio: target under 2 seconds
- Pressing Stop immediately halts playback
