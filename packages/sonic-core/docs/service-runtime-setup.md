# sonic-core Service Runtime Setup

How to configure and run sonic-core with a real sonic-runtime backend.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SONIC_RUNTIME_PATH` | No | Absolute path to the sonic-runtime binary. When set, sonic-core spawns and manages the runtime as a sidecar process. When unset, falls back to NullBackend (no audio). |

## Runtime Binary

sonic-runtime is a NativeAOT C#/.NET 8 binary. Build it from the sonic-runtime repo:

```bash
cd sonic-runtime/src/SonicRuntime
dotnet publish -c Release -r win-x64
```

The binary lands at:
```
src/SonicRuntime/bin/Release/net8.0/win-x64/publish/SonicRuntime.exe
```

## Runtime Asset Layout

sonic-runtime expects assets relative to the binary location:

```
<binary dir>/
  SonicRuntime.exe
  models/
    kokoro.onnx          # Kokoro TTS ONNX model
  voices/
    af_heart.bin         # Voice embedding files
    am_adam.bin
    ...
  espeak/
    espeak-ng-data/      # eSpeak-NG data directory
```

Missing assets cause specific failures:
- Missing `models/kokoro.onnx`: preload_model fails, synthesis fails
- Missing `voices/`: list_voices returns empty, synthesis fails with voice_not_found
- Missing `espeak/`: tokenization fails, synthesis fails

## Starting the Service

```bash
# With real runtime
SONIC_RUNTIME_PATH=/path/to/SonicRuntime.exe node dist/bin.js

# Without runtime (NullBackend, no audio)
node dist/bin.js
```

## Startup Behavior

When `SONIC_RUNTIME_PATH` is set:

1. Validates the file exists (exits 1 if missing)
2. Spawns the runtime process
3. Performs ndjson-stdio-v1 protocol handshake
4. Logs runtime version to stderr
5. If startup fails: exits 1 with diagnostic message

When `SONIC_RUNTIME_PATH` is unset:

1. Logs "using NullBackend" to stderr
2. All audio operations return successfully but produce no sound
3. Useful for development and testing

## Shutdown Behavior

The service disposes the sidecar on:
- `SIGINT` (Ctrl+C)
- `SIGTERM`
- Normal process exit

Disposal kills the runtime child process. If the service crashes without disposal, the OS reaps the orphaned runtime process.

## Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `FATAL: file does not exist` | Bad SONIC_RUNTIME_PATH | Check the path |
| `FATAL: failed to start sonic-runtime` | Binary won't run or protocol mismatch | Verify binary is valid, check versions |
| `protocol_mismatch` error | sonic-core and sonic-runtime disagree on protocol | Update both to compatible versions |
| Runtime exits during operation | Crash or OOM | Check stderr logs, auto-restart will attempt recovery (max 3 retries) |
| Consecutive timeouts | Runtime is wedged | Runtime is killed after 3 timeouts, auto-restart attempts recovery |

## Verifying Health

After startup, introspection methods are available through SidecarBackend:

- `validateAssets()` — preflight check: model, voices, espeak, ONNX runtime. Returns structured errors with fix hints.
- `getHealth()` — runtime status, uptime, handle count, model state
- `getCapabilities()` — supported engines, features, protocol
- `getModelStatus()` — model loaded state, inference count
- `listVoices()` — available voice embeddings

Start with `validateAssets()` — it checks all dependencies without triggering synthesis.

These are not exposed as MCP tools (they're sidecar-specific). Use them programmatically or through a health-check wrapper.

See [operator-smoke-test.md](operator-smoke-test.md) for the canonical verification sequence.

## Runtime Events

The service logs runtime events to stderr in the format:
```
[runtime:event] synthesis_started {"handle":"h_000001","engine":"kokoro","voice":"af_heart"}
[runtime:event] synthesis_completed {"handle":"h_000001","duration_ms":1500,"inference_ms":200}
[runtime:event] playback_ended {"handle":"h_000001","reason":"completed"}
```

Events are informational. They do not affect correctness.
