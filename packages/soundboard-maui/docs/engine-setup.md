# Engine Setup & Distribution

How to install, run, pin, and roll back the voice engine.

## Overview

The Soundboard SDK connects to a voice engine over HTTP + WebSocket. The engine is a separate process, distributed separately. This guide covers the reference engine ([voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)).

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

## Pin a version

Always pin the engine to a known-good version:

```bash
# Pin to a specific commit
git checkout <commit-hash>

# Or pin to a tag
git checkout v1.1.0
```

**Never run `git pull` on a production engine without testing first.**

## Check compatibility

Before upgrading the engine, verify SDK compatibility:

```bash
# Point contract tests at the new engine
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet test tests/Soundboard.IntegrationTests
```

If all tests pass, the engine is SDK-compatible.

## Roll back

If an engine upgrade breaks something:

```bash
cd voice-soundboard

# Go back to the previous version
git checkout <previous-commit-or-tag>

# Restart the engine
python main.py
```

Time to roll back: under 2 minutes.

## Startup behavior

| State | `/api/health` response | SDK behavior |
|---|---|---|
| Starting up | Connection refused | `HttpRequestException` — retry later |
| Model loading | `{ status: "loading" }` | SDK proceeds, but `SpeakAsync` may fail |
| Ready | `{ status: "ready" }` | Full functionality |
| Crashed | Connection refused | `HttpRequestException` — restart engine |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SOUNDBOARD_BASE_URL` | `http://localhost:8765` | Engine URL (read by SDK) |

The engine's port is configured via `--port` flag, not environment variable. The SDK reads `SOUNDBOARD_BASE_URL` to find the engine.

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

## Upgrade checklist

1. Note current engine commit/tag
2. Pull or checkout new version
3. Run engine: `python main.py`
4. Run contract tests: `dotnet test tests/Soundboard.IntegrationTests`
5. If tests pass: proceed
6. If tests fail: roll back to noted commit/tag

## Related

- [API contract](api-contract.md) — what the engine must implement
- [Compatibility](compatibility.md) — SDK-engine version matrix
- [Engine repository](https://github.com/mcp-tool-shop-org/voice-soundboard)
