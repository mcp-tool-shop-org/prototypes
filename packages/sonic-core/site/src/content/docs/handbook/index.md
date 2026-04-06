---
title: Handbook
description: Complete guide to building with sonic-core.
sidebar:
  order: 0
---

Welcome to the sonic-core handbook. This is the complete guide to integrating audio playback, synthesis, and device routing into your TypeScript applications.

## What's inside

- **[Beginners](/sonic-core/handbook/beginners/)** — New to sonic-core? Start here for core concepts and first steps
- **[Getting Started](/sonic-core/handbook/getting-started/)** — Clone, build, and run your first playback
- **[Architecture](/sonic-core/handbook/architecture/)** — Packages, protocol boundary, and event flow
- **[API Reference](/sonic-core/handbook/reference/)** — Engine methods, MCP tools, and configuration
- **[Security](/sonic-core/handbook/security/)** — Threat model and security posture

## What sonic-core is

sonic-core is the TypeScript control plane for audio. It decides *what* to play, *when* to stop, *how loud*, and *which device*. The actual audio processing happens in [sonic-runtime](https://github.com/mcp-tool-shop-org/sonic-runtime), a NativeAOT C# sidecar that sonic-core manages over a strict ndjson-stdio protocol.

## What sonic-core is not

- Not a DAW or audio editor
- Not a streaming service or media player
- Not a standalone audio library — it requires sonic-runtime for real audio output
- Not a user-facing application (see [Stillpoint](https://github.com/mcp-tool-shop-org/stillpoint) for that)
