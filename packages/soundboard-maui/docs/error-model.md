# Error Model

How the SDK surfaces failures and what your application should do about them.

## Exception types

The SDK throws standard .NET exceptions. No custom exception types.

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

```
Engine off          → HttpRequestException
Engine loading      → Returns EngineInfo with Status = "loading"
Engine ready        → Returns EngineInfo with Status = "ready"
Timeout             → TaskCanceledException
```

**Recommendation:** Call on startup. If it fails, set an offline state and let the user retry.

### GetPresetsAsync / GetVoicesAsync

```
Engine off          → HttpRequestException
Unexpected format   → JsonException or KeyNotFoundException
Timeout             → TaskCanceledException
```

**Recommendation:** Call after health check succeeds. Cache results — presets and voices rarely change within a session.

### SpeakAsync

```
WebSocket connect fails    → WebSocketException
Connect timeout            → OperationCanceledException
Engine returns error       → InvalidOperationException (message from engine)
No data for 30s            → OperationCanceledException (receive timeout)
Connection drops mid-stream → WebSocketException
User cancels               → OperationCanceledException
```

**Recommendation:** Wrap in try/catch. Always reset your audio player in the `finally` block. Never assume the speak completed — check for exceptions.

### StopAsync

```
Engine off          → HttpRequestException
Timeout             → TaskCanceledException
```

**Recommendation:** Fire-and-forget is acceptable. The engine will stop on its own when the WebSocket closes.

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

## What the SDK does NOT do

- **No retry logic.** The SDK does not retry failed requests. Your application decides when and how to retry.
- **No circuit breaker.** If the engine is down, every call will fail. Implement your own backoff if needed.
- **No error event stream.** Errors are exceptions, not events. There is no `OnError` callback.
- **No error codes.** The SDK surfaces the engine's error message as a string, not a typed error code.

## Logging

The SDK uses `Microsoft.Extensions.Logging`. Pass an `ILogger` to the constructor to capture internal diagnostics:

```csharp
var client = new SoundboardClient(
    logger: loggerFactory.CreateLogger<SoundboardClient>());
```

Log levels used:
- `Debug` — HTTP requests, WebSocket lifecycle, state events
- `Information` — Speak started/completed with request ID and chunk count
- `Error` — Engine error messages

## Related

- [Streaming model](streaming-model.md) — normal flow when things work
- [API contract](api-contract.md) — wire protocol error format
- [Getting started](getting-started-sdk.md) — quick integration guide
