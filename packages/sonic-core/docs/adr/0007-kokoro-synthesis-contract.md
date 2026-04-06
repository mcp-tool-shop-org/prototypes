# ADR-0007: Kokoro Synthesis Contract

**Status:** Accepted
**Date:** 2026-03-13
**Deciders:** mcp-tool-shop
**Supersedes:** —
**Related:** ADR-0003 (Shared Audio Core Contract), ADR-0005 (Native Runtime Boundary), ADR-0006 (Runtime Language Stack)

## Context

ADR-0005 established the synthesis wire protocol method:

```json
{ "method": "synthesize", "params": { "engine": "kokoro", "voice": "...", "text": "...", "speed": 1.0 } }
```

ADR-0006 ratified C#/.NET 8 + NativeAOT for sonic-runtime. The synthesis engine was left as a stub pending backend selection.

Two inference options were evaluated:

### KokoroSharp (v0.6.5)

High-level C# Kokoro wrapper. Provides tokenization, voice management, inference, and playback in one package.

**Rejected.** Dependencies are NativeAOT-hostile:
- **NumSharp** — heavy reflection usage, incompatible with AOT trimming
- **NAudio** — COM interop, already proven to crash under NativeAOT (ADR-0006 spike)
- **OpenTK.Audio.OpenAL** — redundant audio backend (SoundFlow already handles playback)

Pulling KokoroSharp would destroy the NativeAOT constraint that the entire runtime architecture was built to preserve.

### Raw ONNX Runtime (Microsoft.ML.OnnxRuntime 1.22.0)

Direct inference via the managed C# binding. Runtime owns tokenization, voice embedding loading, and PCM generation.

**Accepted.** Validated by spike:
- NativeAOT publish: clean (2.1MB binary + onnxruntime.dll)
- Session creation: no crashes
- Inference: correct results
- No `Marshal.GetDelegateForFunctionPointer` failures despite research suggesting they were likely
- The managed binding's generic delegate resolution works under .NET 8 NativeAOT

## Decision

sonic-runtime will implement Kokoro synthesis through direct ONNX Runtime integration (`Microsoft.ML.OnnxRuntime`), without taking a dependency on KokoroSharp.

### What the runtime owns

- **Tokenization** — text to phoneme token IDs
- **Segmentation** — splitting token sequences into inference-sized chunks
- **Voice embedding loading** — reading raw float32 `.bin` voice style vectors from disk
- **ONNX inference** — model session management, tensor I/O
- **PCM generation** — converting model output to playable audio samples

### What the runtime does not own

- Product semantics (no "calming mode," no "session voice")
- User presets or voice preferences
- Any concept of who is speaking or why
- Anything above "turn text + voice ID into audio samples"

## Synthesis Contract

### Request shape (wire protocol)

```json
{
  "method": "synthesize",
  "params": {
    "engine": "kokoro",
    "voice": "af_heart",
    "text": "Hello world.",
    "speed": 1.0
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `engine` | string | yes | Must be `"kokoro"`. No other engines. No plugin architecture. |
| `voice` | string | yes | Voice ID from the local voice registry (e.g., `"af_heart"`, `"am_onyx"`) |
| `text` | string | yes | Text to synthesize. Must be non-empty. |
| `speed` | float | no | Speech speed multiplier. Default `1.0`. Range `0.5–2.0`. |

Future optional fields (reserved but not yet implemented):
- `sample_rate` — output sample rate override
- `format` — output format hint
- `options` — engine-specific extras (nested object, never top-level params)

### Response shape

```json
{
  "id": 1,
  "result": {
    "handle": "h_000000000005",
    "duration_ms": 1250,
    "sample_rate": 24000,
    "channels": 1
  }
}
```

The returned handle is playable through the existing playback machinery (`play`, `stop`, `set_volume`, etc.). Synthesis produces audio; playback plays it. No special paths.

### Error codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| `synthesis_validation_failed` | Bad engine, voice, or text | no |
| `synthesis_model_missing` | ONNX model not found at expected path | no |
| `synthesis_model_load_failed` | ONNX session creation failed | no |
| `synthesis_inference_failed` | Inference crashed or produced invalid output | yes |
| `synthesis_voice_not_found` | Voice ID not in local registry | no |

### Voice registry

Voices are raw float32 binary files (`.bin`, 510 entries × 256 floats = 522,240 bytes). Each entry is a style vector indexed by token count. The runtime maintains a static registry of known voice IDs loaded at startup.

Voice ID format: `{language_prefix}_{name}` (e.g., `af_heart`, `am_onyx`, `bf_emma`).

The registry is populated at startup from a `voices/` directory relative to the runtime binary. Unknown voice IDs fail with `synthesis_voice_not_found`.

### Model location

The Kokoro ONNX model is expected at a configurable path, defaulting to `models/kokoro.onnx` relative to the runtime binary. Missing model fails with `synthesis_model_missing` at first synthesis request (lazy load, not startup).

### Synthesis → Playback flow

```
synthesize(engine, voice, text, speed)
  → tokenize text
  → load voice embedding
  → run ONNX inference
  → receive float[] PCM samples
  → write to temp WAV file (or in-memory stream)
  → register as PlaybackSlot with handle
  → return handle + metadata

play(handle, volume, pan, ...)
  → existing SoundFlow playback path (unchanged)
```

Synthesis is just another source producer. The playback path does not know or care that the audio was synthesized.

## Constraints

- **One engine only.** `engine` must be `"kokoro"`. No generic TTS abstraction. No plugin interfaces. No "future-proofing" for engines that don't exist.
- **No per-request model reloads.** Model is loaded once (lazy on first synthesis) and reused. Session is held for the lifetime of the process.
- **No streaming synthesis.** v0.2.0 is synchronous: full text in, full audio out, then play. Streaming/chunked synthesis is a future consideration, not a v0.2.0 concern.
- **Inference off the playback hot path.** Synthesis runs on a normal thread. SoundFlow's audio callback thread is never blocked by inference.
- **No LINQ/closures in inference pipeline.** Same anti-crackle discipline as playback.
- **NativeAOT publish must remain clean.** Any dependency that breaks `PublishAot` is disqualified, same rule that killed NAudio and KokoroSharp.

## Execution Provider Strategy

Default: CPU execution provider (works everywhere, no additional dependencies).

Future (not v0.2.0):
- DirectML for GPU acceleration on Windows (RTX 5080 target)
- Requires `Microsoft.ML.OnnxRuntime.DirectML` package
- NativeAOT compatibility of DirectML EP is unvalidated — requires its own spike before adoption
- CPU fallback must always work

## Consequences

### Positive
- NativeAOT constraint preserved — the entire reason for the native split continues to hold
- No fork maintenance burden from stripping KokoroSharp
- Full control over tokenization and voice loading — can optimize for the specific model version
- Synthesis output feeds directly into the already-proven SoundFlow playback path
- Single process boundary (sonic-core ↔ sonic-runtime) handles both playback and synthesis

### Negative
- Must implement tokenization from scratch (KokoroSharp's `Tokenizer` cannot be reused)
- Must implement `.npy` voice embedding loader (KokoroSharp's `KokoroVoiceManager` cannot be reused)
- Must understand and match the Kokoro model's exact input/output tensor shapes
- More initial implementation work than wrapping KokoroSharp

### Validation gates (all passed 2026-03-13)
- [x] Kokoro ONNX model loads under NativeAOT — model loaded in ~750ms
- [x] Inference produces valid PCM output — 5–5.5× realtime on CPU (i7-14700K)
- [x] Synthesized audio plays through SoundFlow without artifacts
- [x] NativeAOT publish remains clean with ONNX Runtime dependency
- [x] Voice registry loads all shipped voice embeddings (510 entries × 256 dims)
- [x] Error paths produce structured errors, not crashes
- [x] End-to-end: synthesize → play → get_duration works across wire protocol
- [x] Male and female voice paths both produce valid audio
