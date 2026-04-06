---
title: Architecture
description: Design, project structure, and layer responsibilities.
sidebar:
  order: 2
---

Soundboard MAUI separates concerns into four layers. The SDK is the product. Everything else is a reference implementation.

## System diagram

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**Control plane** (HTTP) handles health checks, preset/voice discovery, and stop commands.

**Data plane** (WebSocket) carries bidirectional data: speak commands go up, PCM16 audio chunks stream down.

## Project structure

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect, speak, save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         32 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests
```

## Layers and responsibilities

### UI layer (MAUI views)

Responsibilities: text input, preset/voice selection, speak/stop buttons, status display.

Non-responsibilities: no networking, no audio processing, no engine assumptions.

Files: `Views/MainPage.xaml`, `Views/MainPage.xaml.cs`

### ViewModel layer

Responsibilities: command orchestration, state tracking, binding UI to Client to Audio.

Files: `ViewModels/SoundboardViewModel.cs`

### Client layer (SDK)

Responsibilities: HTTP + WebSocket communication, streaming audio chunks, engine state events. Handles connection lifecycle, JSON framing, base64 decoding, graceful WebSocket close, and API version compatibility checks.

Files: `Soundboard.Client/*`

### Audio layer

Responsibilities: buffer PCM16 data, play/stop audio, thread-safe start/stop/flush. No engine knowledge.

Files: `Soundboard.Maui.Audio/*`

## Feature-to-layer mapping

| Feature | UI | ViewModel | Client | Audio |
|---------|:--:|:---------:|:------:|:-----:|
| Health check | | x | x | |
| List presets | x | x | x | |
| List voices | x | x | x | |
| Speak | x | x | x | x |
| Stop | x | x | x | x |
| Streaming audio | | | x | x |
| Status display | x | x | | |

## Design principles

1. **SDK-first.** The SDK is a standalone .NET 8+ library with zero UI dependencies. Use it anywhere.
2. **Streaming-first.** Audio arrives via `IProgress<AudioChunk>` -- no buffering, no files.
3. **Engine-agnostic.** The SDK speaks a documented API contract. Swap engines without changing your code.
4. **Sealed types.** All models and the client implementation are `sealed`. Extend by composition, not inheritance.
5. **Cancellation everywhere.** Every async method accepts `CancellationToken`.
6. **The MAUI app is a control surface, not a logic layer.** All behavior lives in the SDK, audio adapter, and ViewModels.

## Explicit non-features

The MAUI app deliberately excludes: vocology controls, engine tuning, research flags, pipeline editing, settings drawer, and multiple pages or tabs. If a PR adds UI code beyond these boundaries, it needs justification.
