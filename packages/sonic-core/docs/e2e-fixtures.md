# E2E Test Fixtures

How the sonic-core E2E test suite resolves prerequisites, what each test category needs, and how to run them.

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SONIC_RUNTIME_PATH` | Absolute path to sonic-runtime binary | Auto-resolve (Release → Debug) |
| `SONIC_ASSETS_DIR` | Root directory containing models/, voices/, espeak/ | None (synthesis tests skip) |
| `TEST_E2E` | Set to `0` to skip all E2E tests | Enabled |

## Runtime Binary Resolution

`resolveRuntime()` checks in order:

1. `SONIC_RUNTIME_PATH` env var (CI can point to any build)
2. `F:/AI/sonic-runtime/src/SonicRuntime/bin/Release/net8.0/win-x64/publish/SonicRuntime.exe`
3. `F:/AI/sonic-runtime/src/SonicRuntime/bin/Debug/net8.0/win-x64/SonicRuntime.exe`

If none found, tests skip with a message listing what was checked.

## Test Categories

### Protocol E2E

**Needs:** Runtime binary + audio output device
**Tests:** version handshake, list_devices, play/stop cycle, volume, pan, pause/resume, seek, position, duration, error handling

```bash
# Just build Debug and run
cd F:/AI/sonic-runtime && dotnet build
cd F:/AI/sonic-core && npm test
```

### Introspection E2E

**Needs:** Runtime binary only (no model assets)
**Tests:** get_health, get_capabilities, get_model_status

Same binary as protocol tests. These were the 3 pre-existing failures caused by a stale Release binary — the Debug fallback path fixes them.

### Synthesis E2E

**Needs:** Runtime binary + full asset set (model, voices, espeak)
**Tests:** synthesize (text → speech → WAV → playback)

```bash
SONIC_ASSETS_DIR=/path/to/assets npm test
```

**Minimal asset layout:**

```
$SONIC_ASSETS_DIR/
  models/kokoro.onnx       # ~326 MB, FP32
  voices/af_heart.bin       # at least one voice .bin file
  espeak/espeak-ng.exe      # or espeak-ng on PATH
  espeak/espeak-ng-data/    # eSpeak data directory
```

## Skipping Tests

```bash
# Skip all E2E (unit + integration still run)
TEST_E2E=0 npm test

# No binary available → auto-skip with reason in TAP output
npm test  # shows: "No runtime binary found. Set SONIC_RUNTIME_PATH or build..."
```

## Stale Binary Detection

The harness probes the runtime after handshake via `get_capabilities`. If the binary is too old to support this method, the introspection E2E suite **skips** (not fails) with a clear message:

```
⚠ Stale runtime binary detected: get_capabilities failed: Unknown method: get_capabilities.
  Runtime binary may be stale — rebuild with: dotnet publish -c Release -r win-x64
```

The harness also logs the chosen binary path and runtime version on startup:

```
[e2e] binary: F:/AI/sonic-runtime/src/SonicRuntime/bin/Debug/net8.0/win-x64/SonicRuntime.exe
[e2e] runtime: sonic-runtime v0.5.0 (ndjson-stdio-v1)
```

**If E2E fails due to stale binary**, rebuild the runtime:

```bash
cd F:/AI/sonic-runtime
dotnet publish -c Release -r win-x64
# or point directly at a current build:
SONIC_RUNTIME_PATH=F:/AI/sonic-runtime/src/SonicRuntime/bin/Debug/net8.0/win-x64/SonicRuntime.exe npm test
```

## CI Posture

- Protocol + introspection E2E: run with just a Debug build (no model assets needed)
- Synthesis E2E: gated behind `SONIC_ASSETS_DIR` — skips silently in CI without assets
- Device routing E2E: future category, will gate behind device count check
- All skip reasons appear in TAP output so humans can tell what's missing

## Key Files

| File | Role |
|------|------|
| `packages/engine/src/test-fixtures.ts` | Prerequisite resolution, WAV generation, fixture dirs |
| `packages/engine/src/runtime-harness.ts` | Runtime spawn/teardown lifecycle |
| `packages/engine/src/sidecar-e2e.test.ts` | E2E test suite (uses both helpers) |
