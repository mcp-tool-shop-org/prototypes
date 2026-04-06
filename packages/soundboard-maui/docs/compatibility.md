# Compatibility & Trust Contract

Public commitment: if SDK v1.x passes contract tests, the engine is compatible.

## Compatibility matrix

| SDK version | API contract | Engine requirement | Status |
|---|---|---|---|
| 1.0.x | v1 | Any engine implementing [api-contract.md](api-contract.md) v1 | **Current** |

## The rule

**SDK v1.x will work with any engine that:**

1. Responds to `GET /api/health` with `{ status, engineVersion, apiVersion }`
2. Responds to `GET /api/presets` with `{ presets: [...] }`
3. Responds to `GET /api/voices` with `{ voices: [{ id, ... }] }`
4. Accepts WebSocket connections on `/stream`
5. Sends `audio_chunk` messages with base64 PCM16 data
6. Sends `state: finished` when generation completes
7. Sends `error` messages with a `message` field on failure

If all 7 hold, the SDK works. No other assumptions.

## Version negotiation

On startup, the SDK reads `apiVersion` from `/api/health`.

| Condition | SDK behavior |
|---|---|
| `apiVersion` matches SDK's expected version | Proceed normally |
| `apiVersion` higher than expected | Proceed (forward-compatible by design) |
| Engine unreachable | Throw `HttpRequestException` |

The SDK does not hard-fail on version mismatch. Unknown fields in engine responses are ignored (forward compatibility).

## Contract tests as proof

The [contract test suite](../tests/Soundboard.IntegrationTests/ContractTests.cs) verifies all 7 rules above. Any engine that passes these tests is SDK-compatible:

```bash
dotnet test tests/Soundboard.IntegrationTests
```

Engine authors can run these tests against their implementation by pointing `SOUNDBOARD_BASE_URL` at their engine instead of the fake server.

## SDK stability guarantees

### What will NOT change in v1.x

- `ISoundboardClient` interface shape
- `SpeakRequest`, `AudioChunk`, `EngineInfo`, `EngineEvent` record shapes
- `SoundboardClientOptions` property names
- `SOUNDBOARD_BASE_URL` environment variable behavior
- `IProgress<AudioChunk>` streaming pattern
- `CancellationToken` on every async method

### What MAY change in v1.x (minor/patch)

- Default timeout values
- Internal logging formats
- Buffer sizes and transport optimizations
- New optional parameters added to existing methods (with defaults)

### What requires v2.0

- Removing or renaming any public type or method
- Changing parameter types on existing methods
- Changing the wire protocol (audio format, message envelope)
- Adding required parameters without defaults

## Deprecation policy

1. **Announce:** Deprecated APIs get `[Obsolete("message")]` with a migration note
2. **Grace period:** Deprecated APIs remain functional for at least one minor release
3. **Remove:** Removal happens only in the next major version

No silent removals. No surprise breaks.

## Engine author checklist

Building an engine? Here's what the SDK expects:

- [ ] `GET /api/health` returns JSON with `status`, `engineVersion`, `apiVersion`
- [ ] `GET /api/presets` returns `{ presets: ["name1", "name2", ...] }`
- [ ] `GET /api/voices` returns `{ voices: [{ id: "...", ... }, ...] }`
- [ ] `POST /api/stop` returns 200
- [ ] WebSocket on `/stream` accepts speak commands
- [ ] Audio chunks: `{ type: "audio_chunk", payload: { data: "<base64>", sample_rate: 24000 } }`
- [ ] State events: `{ type: "state", payload: { state: "started|streaming|finished" } }`
- [ ] Errors: `{ type: "error", payload: { message: "..." } }`

Run the contract tests to verify:

```bash
SOUNDBOARD_BASE_URL=http://your-engine:port dotnet test tests/Soundboard.IntegrationTests
```

## Related

- [API contract](api-contract.md) — wire protocol specification
- [API reference](api.md) — SDK public surface
- [Error model](error-model.md) — failure modes
