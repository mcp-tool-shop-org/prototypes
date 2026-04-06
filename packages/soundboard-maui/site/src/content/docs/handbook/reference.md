---
title: Reference
description: Full API reference, wire protocol, and compatibility matrix.
sidebar:
  order: 6
---

Complete reference for the SDK public API, engine wire protocol, and compatibility guarantees.

## SDK API (v1.0 -- stable)

### ISoundboardClient

```
ISoundboardClient : IAsyncDisposable
  GetHealthAsync(CancellationToken) → EngineInfo
  GetPresetsAsync(CancellationToken) → string[]
  GetVoicesAsync(CancellationToken) → string[]
  SpeakAsync(SpeakRequest, IProgress<AudioChunk>, CancellationToken) → Task
  StopAsync(CancellationToken) → Task
```

### Models

| Type | Fields |
|------|--------|
| `EngineInfo` | Status, EngineVersion, ApiVersion |
| `SpeakRequest` | Text, Preset, Voice, RequestId? |
| `AudioChunk` | PcmData, SampleRate |
| `EngineEvent` | State |
| `SoundboardClientOptions` | BaseUrl, HttpTimeout, WebSocketConnectTimeout, WebSocketReceiveTimeout |

### Not guaranteed (internal)

These may change without a major version bump: internal logging formats and levels, default timeout values, transport implementation details (buffer sizes, serialization options), internal constructors, `SpeakRequest.ResolvedRequestId`.

## Wire protocol (API contract v1)

### Transport

Both HTTP and WebSocket on a single port (default `8765`).

| Layer | Protocol | Purpose |
|-------|----------|---------|
| Control plane | HTTP | Commands, discovery, metadata |
| Data plane | WebSocket | Streaming audio, realtime state |

### Message envelope

All messages use JSON over UTF-8:

```json
{
  "type": "speak | state | audio_chunk | error",
  "request_id": "uuid-v4",
  "payload": { }
}
```

Unknown fields are ignored (forward compatibility). Audio is base64-encoded in JSON, no binary frames.

### HTTP endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Engine readiness check |
| `/api/voices` | GET | List available voices |
| `/api/presets` | GET | List available presets |
| `/api/speak` | POST | Non-streaming speech generation (returns WAV URL) |
| `/api/stop` | POST | Stop current playback |
| `/api/audio/{id}.wav` | GET | Serve generated audio file |

### WebSocket messages

**Client to engine:**

- **Speak command:** `{ type: "speak", request_id, payload: { text, preset, voice } }`

**Engine to client:**

- **State event:** `{ type: "state", request_id, payload: { state: "started|streaming|finished" } }`
- **Audio chunk:** `{ type: "audio_chunk", request_id, payload: { data: "<base64>", sample_rate: 24000 } }`
- **Error:** `{ type: "error", request_id, payload: { message } }`

### Audio format

| Property | Value |
|----------|-------|
| Format | PCM16 (signed 16-bit little-endian) |
| Sample rate | 24,000 Hz |
| Channels | 1 (mono) |
| Encoding (WebSocket) | Base64 in JSON |
| Encoding (HTTP) | WAV file |

## Compatibility matrix

| SDK version | API contract | Engine requirement | Status |
|---|---|---|---|
| 1.0.x | v1 | Any engine implementing api-contract v1 | **Current** |

### The compatibility rule

SDK v1.x will work with any engine that:

1. Responds to `GET /api/health` with `{ status, engine_version, api_version }`
2. Responds to `GET /api/presets` with `{ presets: [...] }`
3. Responds to `GET /api/voices` with `{ voices: [{ id, ... }] }`
4. Accepts WebSocket connections on `/stream`
5. Sends `audio_chunk` messages with base64 PCM16 data
6. Sends `state: finished` when generation completes
7. Sends `error` messages with a `message` field on failure

If all seven hold, the SDK works.

### Version negotiation

| Condition | SDK behavior |
|---|---|
| `apiVersion` matches | Proceed normally |
| `apiVersion` higher than expected | Proceed (forward-compatible by design) |
| Engine unreachable | Throw `HttpRequestException` |

### Contract tests as proof

```bash
dotnet test tests/Soundboard.IntegrationTests
```

Engine authors can run these tests against their own implementation by pointing `SOUNDBOARD_BASE_URL` at their engine.

## Engine author checklist

Building a compatible engine? Verify these:

- `GET /api/health` returns JSON with `status`, `engine_version`, `api_version`
- `GET /api/presets` returns `{ presets: ["name1", "name2", ...] }`
- `GET /api/voices` returns `{ voices: [{ id: "...", ... }, ...] }`
- `POST /api/stop` returns 200
- WebSocket on `/stream` accepts speak commands
- Audio chunks: `{ type: "audio_chunk", payload: { data: "<base64>", sample_rate: 24000 } }`
- State events: `{ type: "state", payload: { state: "started|streaming|finished" } }`
- Errors: `{ type: "error", payload: { message: "..." } }`

## Breaking change policy

- Requires major version bump (1.x to 2.0)
- Must be documented in CHANGELOG
- Deprecated APIs get `[Obsolete]` for at least one minor release before removal
- No breaking changes in patch releases

## Deprecation policy

1. **Announce:** Deprecated APIs get `[Obsolete("message")]` with a migration note
2. **Grace period:** Deprecated APIs remain functional for at least one minor release
3. **Remove:** Removal happens only in the next major version

## Publishing

Release `Soundboard.Client` to NuGet only when:

1. All 32 unit tests pass
2. All 17 contract tests pass
3. SDK API version matches the contract version
4. CHANGELOG has an entry for the new version
5. Compatibility matrix is updated

## Discovery

The SDK finds the engine using this strategy:

1. Check `SOUNDBOARD_BASE_URL` environment variable
2. Default to `http://localhost:8765`
3. Call `GET /api/health`
4. If unreachable, throw `HttpRequestException`

No mDNS, no broadcast discovery, no registry.
