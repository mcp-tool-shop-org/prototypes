# Evaluation Guide

How to evaluate Soundboard MAUI as a streaming TTS client.

## Prerequisites

1. .NET 10.0 SDK with MAUI workload (`dotnet workload install maui-windows`)
2. Windows 10/11
3. Voice engine running locally (see [engine setup](https://github.com/mcp-tool-shop-org/voice-soundboard))

## Quick evaluation (no engine)

Run the test suite to verify the client library works:

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui
dotnet test
```

This runs 32 tests including 5 integration tests against a `FakeEngineServer` that simulates the full HTTP + WebSocket pipeline.

## Full evaluation (with engine)

1. Start the voice engine on `localhost:8765`
2. Launch the app: `dotnet run --project src/Soundboard.Maui`
3. Press **Speak** on the welcome screen
4. Evaluate against the checklist below

## Evaluation checklist

### Latency

- [ ] Time from pressing Speak to first audio (target: under 2 seconds)
- [ ] Status transitions are visible: `Speaking...` then `Playing...`
- [ ] No perceptible gap between chunks during playback

### Interruptibility

- [ ] Pressing Stop immediately halts playback
- [ ] Starting a new speak cancels the previous one
- [ ] App remains responsive during streaming

### Audio quality

- [ ] Output matches the selected preset's intended tone
- [ ] No clicks, pops, or artifacts at chunk boundaries
- [ ] Volume is consistent across different text inputs

### API ergonomics (for developers)

- [ ] `ISoundboardClient` interface is clear and minimal
- [ ] Models are simple records (`SpeakRequest`, `AudioChunk`, `EngineInfo`)
- [ ] `IProgress<AudioChunk>` pattern is familiar and non-blocking
- [ ] `CancellationToken` on every async method
- [ ] Client library has no MAUI dependency (reusable)

### Failure handling

- [ ] Offline engine shows clear status, not a crash
- [ ] Tapping offline status retries the connection
- [ ] Mid-stream failure shows human-readable error
- [ ] App never requires restart to recover

### First-run experience

- [ ] Welcome screen appears on first launch
- [ ] User can produce audio in under 30 seconds
- [ ] No documentation required

## Comparing engines

The client is engine-agnostic. To compare engines:

1. Stop the current engine
2. Start a different engine on the same port (or set `SOUNDBOARD_BASE_URL`)
3. Tap the status label to reconnect
4. Same UI, different engine

The [API contract](api-contract.md) defines what the client expects. Any engine that implements it will work.

## If you want more

- [API contract](api-contract.md) -- full protocol specification
- [Client API docs](api.md) -- public interface and stability guarantees
- [Known limitations](known-limitations.md) -- current boundaries
- [Contributing](../CONTRIBUTING.md) -- how to help
