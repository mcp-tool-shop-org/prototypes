# Known Limitations

Current as of v0.1.0 (sonic-core) / v0.4.1 (sonic-runtime). Updated 2026-03-13.

## Synthesis is serialized

Synthesis requests are processed one at a time. The runtime's SynthesisEngine uses a lock to serialize inference — concurrent `synthesize` calls queue behind the active inference.

**Why:** Single Kokoro ONNX model instance, single-threaded inference. Parallel inference would require model duplication and VRAM budgeting.

**Impact:** Acceptable for current use cases (single-user, sequential TTS). Would bottleneck under concurrent synthesis from multiple clients.

**Future:** If needed, add a synthesis queue with priority or model pooling. Not planned.

## No event backpressure

Runtime events (synthesis_started, synthesis_completed, playback_ended) are fire-and-forget. If the consumer (sonic-core) can't keep up, events are not buffered or rate-limited on the runtime side.

**Why:** Events are informational and small. At current scale (single user, sequential operations), backpressure is unnecessary complexity.

**Impact:** None at current scale. Theoretical concern under high-frequency synthesis bursts.

**Future:** Add backpressure if event volume becomes a real problem. Not planned.

## No handle TTL or sweep

Handles (playback IDs mapped to runtime handles) live until explicitly stopped, naturally completed, or until the runtime process dies. There is no TTL, no idle sweep, no automatic cleanup of abandoned handles beyond these paths.

**Why:** Defense-in-depth, not urgent. Explicit stop, natural completion, and lease expiry cover all normal lifecycle paths. Runtime handles are cheap.

**Impact:** A misbehaving client that creates handles and never plays them (so natural completion can't fire) would leak runtime resources. Mitigated by process restart clearing all handles.

**Future:** Add handle sweep as defense-in-depth if resource leaks are observed. Not planned.

## ~~Per-playback device routing~~ ✅ Resolved

Per-playback device routing is now supported. The `play` method accepts optional `output_device_id` to route individual playback handles to specific audio output devices. Omitting it uses the default device (backward compatible).

**Resolved in:** runtime v0.5.0 (Stage 2), after backend migration in v0.4.0 (Stage 1, ADR-0010).

## Single audio format (no format selection)

The runtime produces 24kHz mono 16-bit PCM WAV from synthesis and only accepts WAV for playback. Format capabilities are reported via `get_capabilities` (`synthesis_format`, `playback_formats`), and non-WAV asset requests fail with `unsupported_format`.

**Why:** Kokoro outputs 24kHz natively. Resampling and transcoding add complexity for no current benefit.

**Impact:** None for TTS playback. Would matter if clients need specific formats for downstream processing or want to play non-WAV assets.

## Device hot-plug events not streamed

Device hot-plug is not streamed to sonic-core. The client must poll `list_devices` to discover changes.

**Why:** Not yet wired through IEventWriter. Lower priority than synthesis events.

**Future:** Wire device_connected/device_disconnected events through IEventWriter when needed.
