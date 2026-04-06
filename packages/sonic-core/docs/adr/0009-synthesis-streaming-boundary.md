# ADR-0009: Synthesis Streaming Boundary

**Status:** Accepted
**Date:** 2026-03-13
**Deciders:** mcp-tool-shop
**Supersedes:** —
**Related:** ADR-0007 (Kokoro Synthesis Contract), ADR-0008 (Runtime Events and Observability)

## Context

Kokoro synthesis in v0.2.0 is synchronous: full text in, full WAV out, then play. For short utterances (< 50 tokens), this works well — inference completes in 200–400ms, well within acceptable latency for most use cases.

But longer text creates a perceptible delay: the user waits for the entire utterance to be synthesized before hearing anything. Streaming synthesis — producing and playing audio chunks as they're generated — would reduce time-to-first-audio.

The question is whether to design for streaming now, later, or never.

## Decision

**v0.3.x: No streaming. Full-utterance synthesis only.**

Streaming synthesis is explicitly deferred. The protocol, runtime, and control plane will not support chunked or incremental audio delivery in v0.3.x.

### Why not now

1. **Kokoro's model architecture is not inherently streaming.** The ONNX model takes a full token sequence and produces a full waveform. Chunking requires segmentation at the text/sentence level, not at the model level. This means "streaming" is really "segmented batch inference" — less elegant and more complex than true streaming models.

2. **Segmentation is a product decision.** Where to split text (sentences? clauses? paragraphs?) depends on how the output sounds at boundaries. Bad splits produce audible glitches. This requires perceptual tuning that is premature before the base synthesis path is mature.

3. **The protocol gets complicated.** Streaming requires:
   - Partial result messages tied to a single synthesis request
   - Ordering guarantees across chunks
   - Cancellation mid-stream
   - Error recovery mid-stream
   - Buffer management in the control plane

   Each of these is solvable but none is free. Adding them before the base protocol is battle-tested risks making the protocol brittle in two dimensions at once.

4. **The current latency is acceptable for v0.3.x use cases.** At 5× realtime on CPU, a 10-second utterance synthesizes in 2 seconds. For the primary use case (MCP tool responses, local voice generation), this is fine.

### What v0.3.x will do instead

- **Text segmentation at the control plane level.** If a client wants lower latency for long text, it can split the text into sentences and issue multiple `synthesize` calls. This pushes segmentation policy into the control plane where it belongs, not into the runtime protocol.
- **Model preload.** `preload_model` eliminates the 750ms cold-start, making the first synthesis call fast.
- **Synthesis events.** `synthesis_started` and `synthesis_completed` give the control plane visibility into when audio will be ready.

### Future streaming contract (reserved, not implemented)

If streaming is added in a future version, the protocol shape should be:

```json
// Request (same as current, with streaming flag)
{"id": 1, "method": "synthesize", "params": {"engine": "kokoro", "voice": "af_heart", "text": "...", "stream": true}}

// Chunk events (unsolicited, tied to synthesis handle)
{"event": "synthesis_chunk", "data": {"handle": "h_...", "chunk_index": 0, "samples": 4800, "is_last": false}}
{"event": "synthesis_chunk", "data": {"handle": "h_...", "chunk_index": 1, "samples": 4800, "is_last": true}}

// Or: runtime writes chunks as playable sub-handles
{"event": "synthesis_chunk", "data": {"handle": "h_...", "chunk_handle": "h_chunk_0", "is_last": false}}
```

This is reserved design space, not a commitment. The exact shape will be decided when streaming is actually needed.

### What absolutely stays out

- No WebSocket transport. stdio is the boundary.
- No token-by-token audio streaming (model doesn't support it).
- No client-side audio buffer management in the protocol.
- No "streaming mode" flag that changes protocol semantics globally.
- No partial results for non-synthesis methods.

## Constraints

- `synthesize` remains a single request → single response method in v0.3.x
- The response includes the full handle, duration, and metadata
- Playback starts only after synthesis completes
- The control plane may issue multiple `synthesize` calls concurrently for parallelism

## Consequences

### Positive
- Protocol stays simple and testable
- No premature complexity in the runtime or control plane
- Segmentation policy stays in the control plane where product decisions belong
- Future streaming can be added without breaking existing clients (`stream` param is optional)

### Negative
- Long text has perceptible latency (2+ seconds for 10+ second utterances)
- Clients wanting low-latency must implement their own text segmentation
- The system cannot compete with streaming TTS services on time-to-first-audio for long text

### Escape hatch
If latency becomes a blocking issue before a proper streaming protocol is designed:
- Control plane segments text into sentences
- Issues parallel `synthesize` calls
- Plays results sequentially via the existing playback path
- This is ugly but functional and requires zero protocol changes
