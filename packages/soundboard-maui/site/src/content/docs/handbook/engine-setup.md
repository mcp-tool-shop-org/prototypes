---
title: Engine Setup
description: Install, run, pin, and roll back the voice engine.
sidebar:
  order: 4
---

The Soundboard SDK connects to a voice engine over HTTP + WebSocket. The engine is a separate process, distributed separately. This guide covers the reference engine (voice-soundboard).

## Install

```bash
# Clone the engine repository
git clone https://github.com/mcp-tool-shop-org/voice-soundboard.git
cd voice-soundboard

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download the model (first run only)
python -c "import kokoro_onnx; kokoro_onnx.download()"
```

## Run

```bash
# Default: localhost:8765
python main.py

# Custom port
python main.py --port 9000

# Verify
curl http://localhost:8765/api/health
```

Expected response:

```json
{
  "status": "ready",
  "engine_version": "1.1.0",
  "api_version": 1
}
```

## Startup behavior

| State | `/api/health` response | SDK behavior |
|---|---|---|
| Starting up | Connection refused | `HttpRequestException` -- retry later |
| Model loading | `{ status: "loading" }` | SDK proceeds, but `SpeakAsync` may fail |
| Ready | `{ status: "ready" }` | Full functionality |
| Crashed | Connection refused | `HttpRequestException` -- restart engine |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SOUNDBOARD_BASE_URL` | `http://localhost:8765` | Engine URL (read by SDK) |

The engine's port is configured via `--port` flag, not environment variable.

## Pin a version

Always pin the engine to a known-good version:

```bash
# Pin to a specific commit
git checkout <commit-hash>

# Or pin to a tag
git checkout v1.1.0
```

Never run `git pull` on a production engine without testing first.

## Check compatibility

Before upgrading the engine, verify SDK compatibility:

```bash
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet test tests/Soundboard.IntegrationTests
```

If all tests pass, the engine is SDK-compatible.

## Roll back

If an engine upgrade breaks something:

```bash
cd voice-soundboard
git checkout <previous-commit-or-tag>
python main.py
```

Time to roll back: under 2 minutes.

## Upgrade checklist

1. Note current engine commit/tag
2. Pull or checkout new version
3. Run engine: `python main.py`
4. Run contract tests: `dotnet test tests/Soundboard.IntegrationTests`
5. If tests pass: proceed
6. If tests fail: roll back to noted commit/tag

## Cross-component upgrade order

When upgrading multiple components, follow this order:

1. **Engine first.** Start the new engine version.
2. **Run contract tests.** `dotnet test tests/Soundboard.IntegrationTests`
3. **SDK second.** Update the package reference.
4. **Client last.** Rebuild the MAUI app or CLI.

This order ensures each layer is validated before the next depends on it.

## Emergency rollback

If everything is broken:

```bash
# 1. Roll back engine
cd voice-soundboard
git checkout <last-known-good-commit>
python main.py

# 2. Roll back SDK (in your project)
dotnet add package Soundboard.Client --version <previous-version>

# 3. Roll back client
cd soundboard-maui
git checkout <last-known-good-commit>
dotnet build src/Soundboard.Maui

# 4. Verify
curl http://localhost:8765/api/health
dotnet test tests/Soundboard.IntegrationTests
```

Total time: under 5 minutes.

## What the engine controls

- Voice models and inference
- Available presets and voices
- Audio generation quality and speed
- Streaming chunk size

## What the engine does NOT control

- Audio playback (client responsibility)
- UI or user experience
- SDK behavior or configuration
- Client-side buffering strategy

## Version pinning summary

| Component | Pin mechanism | Location |
|---|---|---|
| SDK | NuGet package version | Your `.csproj` |
| Engine | Git commit or tag | `voice-soundboard/` directory |
| MAUI client | Git commit | `soundboard-maui/` directory |

No silent upgrades. No auto-updates. Every version change is explicit.
