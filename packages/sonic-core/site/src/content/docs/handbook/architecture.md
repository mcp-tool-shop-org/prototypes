---
title: Architecture
description: Packages, protocol boundary, SidecarBackend, and event flow.
sidebar:
  order: 2
---

## Package overview

sonic-core is a monorepo with four packages:

| Package | Role |
|---------|------|
| **@sonic-core/types** | Shared contract — command schemas, source models, playback state, device info, error shapes |
| **@sonic-core/engine** | Core engine — SonicEngine, SidecarBackend, NullBackend, playback registry, gain/pan/fade |
| **@sonic-core/service** | FastMCP server — 13 audio tools exposed over stdio for MCP clients |
| **@sonic-core/client** | Client SDK — typed command caller for TypeScript consumers |

## The protocol boundary

sonic-core never touches audio buffers. All DSP happens in sonic-runtime (C# NativeAOT with OpenAL Soft). Communication uses **ndjson-stdio-v1** — newline-delimited JSON over stdin/stdout.

```
sonic-core (TypeScript)          sonic-runtime (C#)
┌──────────────────┐             ┌──────────────────┐
│  SonicEngine     │   stdin →   │  CommandLoop      │
│  SidecarBackend  │─────────────│  PlaybackEngine   │
│                  │   ← stdout  │  DeviceManager    │
└──────────────────┘             └──────────────────┘
```

**Why this split?** TypeScript is excellent for control flow, tool interfaces, and state management. C# with NativeAOT is excellent for low-latency audio. The protocol boundary keeps each side focused on what it does best.

## SidecarBackend

SidecarBackend is the bridge between SonicEngine and the runtime binary:

- **Spawn management** — starts the runtime process, validates the handshake
- **Protocol negotiation** — hard-fails on version mismatch
- **Auto-restart** — restarts the runtime on unexpected exit (up to `maxRestarts`, default 3)
- **Timeout detection** — tracks consecutive timeouts and kills the process when `maxConsecutiveTimeouts` is reached
- **Handle mapping** — maps runtime-level string handles to application-level playbackId strings via a bidirectional map
- **Event routing** — parses event envelopes from stdout and dispatches to callbacks

## Event flow

Events flow from runtime to engine:

1. Runtime emits a JSON event on stdout (e.g., `{"event": "playback_ended", "data": {"handle": 3, "reason": "completed"}}`)
2. SidecarBackend parses the envelope, resolves the handle to a playbackId
3. SidecarBackend calls the registered `onEvent` callback
4. SonicEngine updates its internal registry (removes completed playbacks)
5. Application-level code receives the state change

## Device routing

sonic-core supports per-playback device routing:

- `engine.get_devices()` — enumerate available audio output devices
- `engine.play(source, { output_device_id: "..." })` — route a specific playback to a specific device
- Different playbacks can use different devices simultaneously

## Decision records

Architecture decisions are documented in [docs/adr/](https://github.com/mcp-tool-shop-org/sonic-core/tree/main/docs/adr):

- **ADR-0003** — Shared audio core contract
- **ADR-0005** — Native runtime boundary
- **ADR-0006** — Runtime language stack (why C#)
- **ADR-0007** — Kokoro synthesis contract
- **ADR-0008** — Runtime events and observability
- **ADR-0009** — Synthesis streaming boundary
- **ADR-0010** — Audio backend replacement (SoundFlow → OpenAL)
