# Known Limitations

Current boundaries and failure modes for Soundboard MAUI.

## Platform

- **Windows only.** The MAUI app targets `net10.0-windows10.0.19041.0`. macOS/Linux/mobile are not tested.
- **NAudio dependency.** The audio adapter uses NAudio's `WaveOutEvent`, which is Windows-specific.

## Engine dependency

- **Requires a running engine.** The app cannot synthesize audio on its own. It connects to a voice engine implementing the [API contract](api-contract.md).
- **Local only.** Default base URL is `localhost:8765`. Remote engines work but are not tested for latency.
- **No auto-discovery.** The engine URL must be configured via environment variable (`SOUNDBOARD_BASE_URL`) or defaults.

## Streaming

- **No buffering strategy.** Audio plays as chunks arrive. If the engine is slow, playback may stutter.
- **No retry on stream failure.** If the WebSocket drops mid-stream, the speak operation fails. The user must press Speak again.
- **Single stream.** Only one speak operation at a time. Starting a new one cancels the previous.

## Audio

- **PCM16 mono 24kHz only.** The audio adapter assumes this format. Other sample rates or formats require a different `IAudioPlayer` implementation.
- **No volume control.** Playback volume follows system volume.
- **No audio file export.** Audio is played, not saved.

## UI

- **Single page.** No navigation, no settings screen, no history.
- **No keyboard shortcuts.** All interaction is mouse/touch.
- **No accessibility audit.** Screen reader support has not been tested.

## Client library

- **No connection pooling.** Each `SpeakAsync` call opens a new WebSocket connection.
- **30-second receive timeout.** If the engine doesn't send data for 30 seconds, the connection is dropped.
- **No automatic reconnection.** If the engine goes offline, the user must tap the status label to retry.

## What this is not

- Not a production TTS service
- Not a voice model or engine
- Not a research or evaluation framework
- Not designed for concurrent users or server deployment
