# Quickstart

Speak text and save it as a WAV file in 30 seconds.

## Run

```bash
# Start your engine (default: localhost:8765)
# Then:
dotnet run --project examples/Quickstart
```

## What it does

1. Connects to the engine
2. Picks the first available preset and voice
3. Streams speech chunk by chunk
4. Saves `quickstart-output.wav`

## Output

```
Connected: engine v1.1.0, API 1
Available: 5 presets, 54 voices
Streaming..... done.
Saved: quickstart-output.wav (48,000 bytes)
```

## Next

- Change the text, preset, or voice
- Add cancellation with `CancellationTokenSource`
- Replace the WAV writer with your own audio output
- See the [agent example](../AgentTool/) for real-world integration
