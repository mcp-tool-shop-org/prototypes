# Operator Smoke Test

Canonical sequence for verifying a sonic-core + sonic-runtime deployment is healthy.

## Prerequisites

- sonic-runtime binary built and assets deployed (see [service-runtime-setup.md](service-runtime-setup.md))
- `SONIC_RUNTIME_PATH` set to the binary path

## Step 1: Start the service

```bash
SONIC_RUNTIME_PATH=/path/to/SonicRuntime.exe node dist/bin.js
```

Expected stderr output:
```
[sonic-core] runtime connected: sonic-runtime v0.4.0 (ndjson-stdio-v1)
```

If you see `FATAL:` messages, check [service-runtime-setup.md § Failure Modes](service-runtime-setup.md#failure-modes).

## Step 2: Validate assets

Call `validate_assets` first. This checks all dependencies without triggering synthesis.

```json
{"id":1,"method":"validate_assets"}
```

Expected response (healthy system):
```json
{
  "id": 1,
  "result": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "model": { "available": true, "path": "/opt/sonic-runtime/models/kokoro.onnx" },
    "voices": { "available": true, "path": "/opt/sonic-runtime/voices", "count": 10, "voices": ["af_heart", "am_adam", "..."] },
    "espeak": { "available": true, "path": "/opt/sonic-runtime/espeak" },
    "onnx_runtime": { "available": true },
    "asset_root": "/opt/sonic-runtime"
  }
}
```

If `valid` is `false`, each error includes an `error` string and a `hint` with a fix suggestion.

### Common validate_assets failures

| Error | Cause | Fix |
|-------|-------|-----|
| Model directory missing | `models/` doesn't exist | Create `<binary_dir>/models/` |
| Model file missing | `kokoro.onnx` not in models/ | Download the FP32 ONNX model (~326 MB) |
| Voices directory missing | `voices/` doesn't exist | Create `<binary_dir>/voices/` |
| No voice files loaded | Directory exists but no `.bin` files | Place Kokoro voice `.bin` files |
| eSpeak-NG not found | Binary not in espeak/ and not on PATH | Place `espeak-ng.exe` + `espeak-ng-data/` in `<binary_dir>/espeak/` |

## Step 3: Check health

```json
{"id":2,"method":"get_health"}
```

Confirms the runtime is alive and responsive. Shows uptime, handle count, and component availability.

## Step 4: Check capabilities

```json
{"id":3,"method":"get_capabilities"}
```

Returns supported engines, features, and protocol version.

## Step 5: Preload model (optional)

```json
{"id":4,"method":"preload_model"}
```

Forces eager model load instead of lazy-loading on first synthesis. Returns load time in ms. Useful for warming up before the first user request.

## Step 6: Test synthesis (optional)

```json
{"id":5,"method":"synthesize","params":{"engine":"kokoro","voice":"af_heart","text":"Hello world","speed":1.0}}
```

If this returns a handle, the full pipeline is working: tokenization, inference, WAV encoding, and playback slot allocation.

## Automation

For CI or deployment scripts, the smoke test is:

1. Start service
2. Send `validate_assets` → assert `valid === true`
3. Send `get_health` → assert `status === "ok"`
4. Send `preload_model` → assert `loaded === true`
5. Shut down

If any step fails, the deployment has a configuration problem. The `validate_assets` response tells you exactly what's missing and how to fix it.
