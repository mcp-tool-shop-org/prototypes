---
title: Beginners
description: New to sonic-core? Start here for core concepts, terminology, and your first steps.
sidebar:
  order: 99
---

## What is sonic-core?

sonic-core is a TypeScript audio control plane. It tells a native runtime **what** to play, **when** to stop, **how loud**, and **which device** -- but it never touches audio buffers itself. The actual audio processing happens in [sonic-runtime](https://github.com/mcp-tool-shop-org/sonic-runtime), a C# NativeAOT sidecar that sonic-core manages over a strict ndjson-stdio protocol.

This split exists because TypeScript is great for control flow, tool interfaces, and state management, while C# with NativeAOT is great for low-latency audio. sonic-core handles the orchestration; sonic-runtime handles the sound.

## Key concepts

Before diving in, here are the terms you will encounter throughout the handbook:

- **Source** -- what you want to play. Either an `AssetSource` (a file path or registered asset reference) or a `SynthesisSource` (text-to-speech parameters).
- **Playback** -- an active audio stream. Each `play()` call creates a playback with a unique `playback_id` that you use for all subsequent control (pause, stop, volume, etc.).
- **Backend** -- the layer that does actual audio I/O. `SidecarBackend` connects to the real runtime binary. `NullBackend` is a no-op stand-in for development and testing.
- **Lease** -- an optional time limit on a playback. If you set `owner_lease_ms` when playing, the engine will auto-stop the playback when the lease expires unless you renew it with `renew_lease()`.
- **PlaybackRegistry** -- the engine's internal state tracker. It stores every active playback's status, volume, pan, position, and lease info.
- **ndjson-stdio-v1** -- the wire protocol between sonic-core and sonic-runtime. Newline-delimited JSON over stdin/stdout with request-response correlation by integer ID.

## Prerequisites

You need two things installed:

1. **Node.js 20 or later** -- sonic-core uses ES modules and modern TypeScript features.
2. **sonic-runtime** (optional for development) -- the NativeAOT binary that produces real audio. Without it, the engine falls back to `NullBackend`, which accepts all commands but produces no sound. This is fine for development and testing.

## Installation

```bash
git clone https://github.com/mcp-tool-shop-org/sonic-core
cd sonic-core
npm install
npm run build
```

This builds all four packages in the monorepo: `@sonic-core/types`, `@sonic-core/engine`, `@sonic-core/service`, and `@sonic-core/client`.

To verify everything works:

```bash
npm test
```

Tests run against `NullBackend` by default, so no runtime binary is required.

## Your first playback

Here is the minimal code to play an audio file using the engine directly:

```typescript
import { SonicEngine, NullBackend } from '@sonic-core/engine';

// Use NullBackend for now (no real audio, but the API works the same)
const engine = new SonicEngine(new NullBackend());

// Play an asset source
const playbackId = await engine.play(
  { kind: 'asset', asset_ref: 'file:///path/to/sound.wav' },
  { initial_volume: 0.8 }
);

// Check state
const state = await engine.get_playback_state(playbackId);
console.log(state.status);  // "playing"

// Adjust volume
await engine.set_volume(playbackId, 0.5);

// Stop
await engine.stop(playbackId);

// Clean up
engine.dispose();
```

When you are ready for real audio, swap `NullBackend` for `SidecarBackend`:

```typescript
import { SonicEngine, SidecarBackend } from '@sonic-core/engine';

const sidecar = new SidecarBackend({
  executablePath: process.env.SONIC_RUNTIME_PATH!,
});
await sidecar.start();

const engine = new SonicEngine(sidecar);
// ... use engine exactly the same way ...

engine.dispose();
sidecar.dispose();
```

## Common patterns

### Looping background audio

```typescript
const bgMusic = await engine.play(
  { kind: 'asset', asset_ref: 'file:///music/ambient.wav' },
  { loop: true, initial_volume: 0.3 }
);
```

### Crossfading between tracks

```typescript
const newTrack = await engine.replace_playback(
  bgMusic,
  { kind: 'asset', asset_ref: 'file:///music/battle.wav' },
  { crossfade_ms: 2000, loop: true }
);
```

### Text-to-speech

```typescript
const ttsId = await engine.play(
  { kind: 'synthesis', engine: 'kokoro', voice: 'af_heart', text: 'Welcome aboard.' },
  { initial_volume: 0.9 }
);
```

### Using the MCP service

Instead of using the engine API directly, you can run sonic-core as an MCP server that any MCP-compatible client can call:

```bash
SONIC_RUNTIME_PATH=./sonic-runtime npx @sonic-core/service
```

This exposes 13 tools (play, pause, resume, stop, seek, set_volume, set_pan, set_spatial_position, get_devices, set_output_device, renew_lease, get_playback_state, replace_playback) over stdio.

## Troubleshooting

**"Cannot seek synthesis playback"** -- Seeking is only supported for asset sources. Synthesis playbacks are generated on-the-fly and cannot be rewound.

**"No runtime handle for playback"** -- The runtime process restarted or the playback was already stopped. Handles are invalidated when the runtime exits. Create a new playback.

**"Runtime killed after N consecutive timeouts"** -- The runtime process stopped responding. SidecarBackend killed it after reaching `maxConsecutiveTimeouts` (default: 3). Check runtime stderr output via the `onStderr` callback for diagnostics.

**"Protocol mismatch"** -- Your sonic-core and sonic-runtime versions are incompatible. Both must support the same protocol version (currently `ndjson-stdio-v1`). Update whichever is older.

**"SONIC_RUNTIME_PATH set but file does not exist"** -- The environment variable points to a path that does not exist on disk. Verify the binary path and rebuild sonic-runtime if needed.

**No audio output but no errors** -- You are probably using `NullBackend`. Set the `SONIC_RUNTIME_PATH` environment variable to use `SidecarBackend` with the real runtime.
