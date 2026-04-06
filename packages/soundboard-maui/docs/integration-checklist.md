# Engine ↔ MAUI Integration Checklist

Use this when `voice-soundboard#10` lands. Every box must be checked before closing the Service Client v0 milestone.

## Engine (voice-soundboard)

- [ ] `GET /api/health` returns `{ status, engine_version, api_version }`
- [ ] `GET /api/presets` returns `{ presets: [...] }`
- [ ] `GET /api/voices` returns `{ voices: [{ id, name, ... }] }`
- [ ] `POST /api/speak` accepts `{ text, preset, voice }` and returns audio (WAV)
- [ ] `POST /api/stop` halts current generation
- [ ] WebSocket `/stream` accepts typed envelope: `{ type: "speak", request_id, payload }`
- [ ] WebSocket sends `audio_chunk` envelopes: `{ type: "audio_chunk", request_id, payload: { data, sample_rate } }`
- [ ] WebSocket sends `state` events: `started`, `streaming`, `finished`
- [ ] WebSocket sends `error` envelope on failure: `{ type: "error", payload: { code, message } }`

## Client (Soundboard.Client)

- [ ] `GetHealthAsync()` succeeds against live engine
- [ ] `GetPresetsAsync()` returns non-empty list
- [ ] `GetVoicesAsync()` returns non-empty list
- [ ] `SpeakAsync()` streams audio chunks via `IProgress<AudioChunk>`
- [ ] Chunks arrive in order, no partial-frame errors
- [ ] `state: finished` terminates the receive loop cleanly
- [ ] `StopAsync()` cancels mid-generation without crash
- [ ] Engine error envelope surfaces as `InvalidOperationException`
- [ ] Version handshake validates `api_version` from health check

## Audio (Soundboard.Maui.Audio)

- [ ] Sample rate = 24000 Hz confirmed
- [ ] Mono PCM16 little-endian confirmed
- [ ] Chunk order preserved through buffer
- [ ] `Pcm16AudioPlayer.Feed()` plays without glitches
- [ ] `Stop()` flushes buffer and halts playback

## ViewModel (Soundboard.Maui)

- [ ] `LoadAsync()` populates presets and voices
- [ ] `SpeakAsync()` streams through player
- [ ] `Stop()` cancels and resets state
- [ ] `IsSpeaking` / `Status` properties update correctly

## Integration Sequence

1. Start engine: `python -m voice_soundboard.server`
2. Point client at engine: `SOUNDBOARD_BASE_URL=http://localhost:8765`
3. Run health check
4. Stream audio into a **file sink** first (not speakers)
5. Validate chunk order + sample rate
6. Switch sink to `Pcm16AudioPlayer`
7. End-to-end: type text → hear audio
8. Close Service Client v0 milestone
