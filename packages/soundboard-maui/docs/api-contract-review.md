# API Contract Review Checklist

Use this checklist when reviewing the API contract or proposing changes.
Reusable for any client (MAUI, web, mobile, CLI).

---

## Transport Feasibility

- [ ] HTTP endpoints are implementable with the engine's existing framework
- [ ] WebSocket upgrade path works on the chosen port
- [ ] Single-port HTTP+WS is supported by the engine's server library
- [ ] Fallback (HTTP-only) path is viable if WebSocket fails

## Streaming Feasibility

- [ ] PCM16 base64 encoding is efficient enough for real-time delivery
- [ ] Chunk size is appropriate for target latency (~100-500ms per chunk)
- [ ] State events (started/streaming/finished) map to engine lifecycle
- [ ] Client can begin playback before all chunks arrive

## Threading Implications

- [ ] WebSocket messages can be received on a background thread
- [ ] Audio chunk processing does not block the UI thread
- [ ] `request_id` enables safe concurrent requests
- [ ] Stop command interrupts in-progress generation cleanly

## Error Propagation

- [ ] Engine errors surface as typed `error` messages with codes
- [ ] Client can distinguish recoverable vs fatal errors
- [ ] Network disconnection is handled gracefully (reconnect strategy)
- [ ] Version mismatch produces a clear, actionable error

## Backward Compatibility

- [ ] Adding new optional fields does not break existing clients
- [ ] Removing fields requires a contract version bump
- [ ] Unknown fields are ignored by both sides
- [ ] `api_version` check prevents silent incompatibility

## Security

- [ ] No credentials in URL parameters
- [ ] API key auth is optional (local-only default)
- [ ] No filesystem paths exposed to client
- [ ] Rate limiting applies to contract endpoints

## Client Independence

- [ ] Contract does not assume MAUI-specific features
- [ ] Contract does not assume engine implementation details
- [ ] Any client (web, mobile, CLI) could implement this contract
- [ ] Engine can evolve internals without contract changes
