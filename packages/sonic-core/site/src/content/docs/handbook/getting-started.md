---
title: Getting Started
description: Clone, build, and run your first audio playback with sonic-core.
sidebar:
  order: 1
---

## Prerequisites

- **Node.js 20+** — sonic-core uses ES modules and modern TypeScript
- **sonic-runtime** — the NativeAOT binary that does actual audio ([build instructions](https://github.com/mcp-tool-shop-org/sonic-runtime))

## Clone and build

```bash
git clone https://github.com/mcp-tool-shop-org/sonic-core
cd sonic-core
npm install
npm run build
```

This builds all four packages: `@sonic-core/types`, `@sonic-core/engine`, `@sonic-core/service`, and `@sonic-core/client`.

## Run tests

```bash
npm test
```

Tests use NullBackend by default — no runtime binary needed.

## First playback

Set `SONIC_RUNTIME_PATH` to point at your sonic-runtime binary, then use the engine directly:

```typescript
import { SonicEngine, SidecarBackend } from '@sonic-core/engine';

const sidecar = new SidecarBackend({
  executablePath: process.env.SONIC_RUNTIME_PATH!,
  onStderr: (line) => console.error(`[runtime] ${line}`),
  onExit: (code, signal) => console.log(`runtime exited: code=${code} signal=${signal}`),
});

await sidecar.start();
const engine = new SonicEngine(sidecar);

// Play a looping asset at 70% volume
const playbackId = await engine.play(
  { kind: 'asset', asset_ref: 'file:///path/to/ambient-rain.wav' },
  { loop: true, initial_volume: 0.7 }
);

// Adjust volume with a 200ms fade
await engine.set_volume(playbackId, 0.4, 200);

// Stop with a 500ms fade-out
await engine.stop(playbackId, 500);

// Clean up
engine.dispose();
sidecar.dispose();
```

### Play a synthesis source

sonic-core also supports text-to-speech via the Kokoro TTS engine in sonic-runtime:

```typescript
const ttsId = await engine.play(
  { kind: 'synthesis', engine: 'kokoro', voice: 'af_heart', text: 'Hello world' },
  { initial_volume: 0.8 }
);
```

Note: Synthesis playback cannot be seeked. Calling `engine.seek()` on a synthesis source throws a `seek_unsupported` error.

## NullBackend (no audio)

For development and testing, omit `SONIC_RUNTIME_PATH`. The engine falls back to NullBackend, which accepts all commands but produces no audio output.

## MCP service mode

Start the FastMCP server to expose 13 audio tools over stdio:

```bash
SONIC_RUNTIME_PATH=./sonic-runtime npx @sonic-core/service
```

Any MCP-compatible client can then call tools like `play`, `stop`, `set_volume`, `get_devices`, etc.
