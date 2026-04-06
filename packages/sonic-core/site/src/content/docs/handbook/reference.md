---
title: API Reference
description: Engine methods, MCP tools, and configuration options.
sidebar:
  order: 3
---

## SonicEngine

The main entry point for audio control. Implements the `SonicCommands` interface.

### Constructor

```typescript
const engine = new SonicEngine(backend: AudioBackend);
```

The engine accepts any `AudioBackend` implementation. Use `SidecarBackend` for real audio or `NullBackend` for dev/test.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `play` | `play(source: Source, options?: PlayOptions): Promise<string>` | Start playback. Returns a `playback_id` string. |
| `pause` | `pause(playback_id: string, fade_out_ms?: number): Promise<void>` | Pause a playback, optionally fading out first. |
| `resume` | `resume(playback_id: string, fade_in_ms?: number): Promise<void>` | Resume a paused playback, optionally fading in. |
| `stop` | `stop(playback_id: string, fade_out_ms?: number): Promise<void>` | Stop a playback and remove it from the registry. |
| `seek` | `seek(playback_id: string, position_ms: number): Promise<void>` | Seek to a position in milliseconds. Throws `seek_unsupported` for synthesis sources. |
| `set_volume` | `set_volume(target: string, level: number, fade_ms?: number): Promise<void>` | Set volume (0.0--1.0) with optional fade duration. |
| `set_pan` | `set_pan(target: string, value: number, ramp_ms?: number): Promise<void>` | Set stereo pan (-1.0 left to 1.0 right) with optional ramp. |
| `set_spatial_position` | `set_spatial_position(target: string, x: number, y: number, z: number, ramp_ms?: number): Promise<void>` | Set 3D spatial position. Not yet implemented -- throws `engine_busy`. |
| `get_devices` | `get_devices(): Promise<DeviceInfo[]>` | List available audio output devices. |
| `set_output_device` | `set_output_device(device_id: string): Promise<void>` | Set the default audio output device for new playbacks. |
| `renew_lease` | `renew_lease(playback_id: string, lease_ms: number): Promise<void>` | Extend the ownership lease to prevent auto-expiry. |
| `get_playback_state` | `get_playback_state(playback_id: string): Promise<PlaybackState>` | Get the current state of a playback (position, volume, status, etc.). |
| `replace_playback` | `replace_playback(target_playback_id: string, source: Source, options?: PlayOptions): Promise<string>` | Stop the target and start a new playback (crossfade supported via options). |
| `handlePlaybackEnded` | `handlePlaybackEnded(playbackId: string, reason: "completed" \| "stopped"): void` | Handle a runtime `playback_ended` event. Removes completed playbacks from the registry. |
| `dispose` | `dispose(): void` | Stop the lease watcher and clean up. |

### Source types

```typescript
// Play a file or registered asset
const assetSource: AssetSource = {
  kind: 'asset',
  asset_ref: 'file:///path/to/sound.wav'
};

// Play synthesized speech
const synthSource: SynthesisSource = {
  kind: 'synthesis',
  engine: 'kokoro',
  voice: 'af_heart',
  text: 'Hello world',
  speed: 1.0  // optional
};
```

### PlayOptions

```typescript
interface PlayOptions {
  loop?: boolean;              // Loop playback (default: false)
  delay_start_ms?: number;     // Delay before playback starts
  fade_in_ms?: number;         // Fade-in duration
  fade_out_ms?: number;        // Fade-out duration (used by stop/pause)
  crossfade_ms?: number;       // Crossfade duration for replace_playback
  initial_volume?: number;     // Starting volume 0.0--1.0 (default: 1.0)
  initial_pan?: number;        // Starting pan -1.0 to 1.0 (default: 0)
  output_device_id?: string;   // Route to a specific device
  owner_lease_ms?: number;     // Auto-expire after this many ms if not renewed
  interrupt_mode?: InterruptMode; // "replace" | "mix" | "reject"
}
```

### Error handling

Engine methods throw `SonicEngineError` with a structured `.sonic` property:

```typescript
interface SonicError {
  code: ErrorCode;    // e.g. "seek_unsupported", "engine_busy", "lease_expired"
  message: string;
  retryable: boolean;
}
```

## SidecarBackend

Manages the sonic-runtime process over ndjson-stdio-v1.

### Constructor options

```typescript
interface SidecarBackendOptions {
  executablePath: string;              // Path to sonic-runtime binary
  args?: string[];                     // Arguments to pass to runtime
  requestTimeoutMs?: number;           // Per-request timeout (default: 10000)
  handshakeTimeoutMs?: number;         // Startup handshake timeout (default: 5000)
  maxConsecutiveTimeouts?: number;     // Timeouts before killing runtime (default: 3)
  autoRestart?: boolean;               // Restart on crash (default: true)
  maxRestarts?: number;                // Max restart attempts (default: 3)
  onStderr?: (line: string) => void;   // Runtime stderr output
  onExit?: (code: number | null, signal: string | null) => void;
  onRestart?: (attempt: number) => void;
  onSuspect?: (count: number) => void; // Consecutive timeout warning
  onEvent?: (event: RuntimeEvent) => void; // Runtime events (playback_ended, etc.)
}
```

### Lifecycle

```typescript
const sidecar = new SidecarBackend(options);
await sidecar.start();         // Spawn process, validate handshake
sidecar.alive;                 // boolean — is runtime responding?
sidecar.runtimeVersion;        // { name, version, protocol } after start
sidecar.consecutiveTimeouts;   // current timeout streak count
sidecar.restartCount;          // how many times auto-restart has fired
sidecar.dispose();             // Kill process, reject pending, clean up
```

### Introspection methods (sidecar-specific)

| Method | Returns | Description |
|--------|---------|-------------|
| `getHealth()` | `HealthResult` | Runtime uptime, active handles, model status |
| `getCapabilities()` | `CapabilitiesResult` | Supported engines, features, protocol version |
| `listVoices()` | `VoiceInfo[]` | Available TTS voices |
| `preloadModel()` | `PreloadResult` | Pre-load the TTS model |
| `getModelStatus()` | `ModelStatusResult` | Model load state, inference count |
| `validateAssets()` | `ValidateAssetsResult` | Check model, voices, espeak, ONNX runtime availability |

## NullBackend

No-op backend for development and testing. Accepts all commands but produces no audio. Tracks calls in a `.calls` array for test assertions.

```typescript
import { SonicEngine, NullBackend } from '@sonic-core/engine';

const backend = new NullBackend();
const engine = new SonicEngine(backend);

await engine.play({ kind: 'asset', asset_ref: 'test.wav' });
console.log(backend.calls); // [{ method: 'play', args: [...] }]
```

## SonicClient

Transport-agnostic client SDK (`@sonic-core/client`). Implements `SonicCommands` by delegating to any `Transport` interface:

```typescript
interface Transport {
  call(method: string, params: Record<string, unknown>): Promise<unknown>;
}
```

## MCP Tools

The `@sonic-core/service` package exposes 13 tools via FastMCP over stdio:

| Tool | Parameters | Description |
|------|------------|-------------|
| `play` | `source: Source, options?: PlayOptions` | Start playback, returns `playback_id` |
| `pause` | `playback_id, fade_out_ms?` | Pause a playback |
| `resume` | `playback_id, fade_in_ms?` | Resume a paused playback |
| `stop` | `playback_id, fade_out_ms?` | Stop and release resources |
| `seek` | `playback_id, position_ms` | Seek to position in milliseconds (asset sources only) |
| `set_volume` | `target, level (0--1), fade_ms?` | Set volume with optional fade |
| `set_pan` | `target, value (-1 to 1), ramp_ms?` | Set stereo pan |
| `set_spatial_position` | `target, x, y, z, ramp_ms?` | Set 3D spatial position |
| `get_devices` | (none) | List audio output devices |
| `set_output_device` | `device_id` | Set default output device |
| `renew_lease` | `playback_id, lease_ms` | Extend ownership lease |
| `get_playback_state` | `playback_id` | Get current playback state |
| `replace_playback` | `target_playback_id, source, options?` | Hot-swap source (crossfade supported) |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SONIC_RUNTIME_PATH` | -- | Path to sonic-runtime binary. Omit for NullBackend. |
| `SONIC_ASSETS_DIR` | -- | Asset root for synthesis E2E tests (must contain `models/kokoro.onnx` and `voices/`). |
| `TEST_E2E` | -- | Set to `0` to explicitly disable E2E tests. |
