<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Cross-platform .NET MAUI desktop client for the Sound Board voice engine.**

---

## Why Soundboard MAUI?

- **SDK-first design** — `Soundboard.Client` is a standalone .NET 8+ library with zero UI dependencies. Use it in console apps, WPF, ASP.NET, MAUI, or anything that targets .NET.
- **Real-time streaming** — Audio arrives chunk-by-chunk over WebSocket via `IProgress<AudioChunk>`. No waiting for the full synthesis to finish.
- **Engine-agnostic** — The SDK speaks a documented [API contract](docs/api-contract.md). Swap engines without changing your code.
- **Multi-target** — Ships for `net8.0`, `net9.0`, and `net10.0` so you can reference it from any modern .NET project.
- **Structured logging** — Built-in `ILogger` support for diagnostics without pulling in a logging framework.
- **Reference clients included** — A MAUI desktop app and a CLI tool show real integration patterns you can copy.

---

## NuGet Packages

| Package | Description | Version |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | Front-door SDK — streaming TTS client for any Soundboard-compatible voice engine. Pure C#, zero UI deps. | 1.2.2 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | NAudio-based PCM16 streaming playback adapter for Windows. Provides `IAudioPlayer` with buffering, thread-safe start/stop/flush, and playback state tracking. | 1.0.2 |

---

## Quick Start

### Install the SDK

```bash
dotnet add package Soundboard.Client
```

### Speak in five lines

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

No MAUI dependency. Works in console apps, WPF, ASP.NET, or anything targeting .NET 8+.

### Configuration

The client reads `SOUNDBOARD_BASE_URL` from the environment, defaulting to `http://localhost:8765`. Override it in code:

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### SDK surface

| Method | Description |
|---|---|
| `GetHealthAsync()` | Engine health check — returns version info and readiness status |
| `GetPresetsAsync()` | Lists available preset identifiers (e.g. `narrator`, `conversational`) |
| `GetVoicesAsync()` | Lists available voice identifiers |
| `SpeakAsync(request, progress)` | Streams synthesized speech; reports `AudioChunk` via `IProgress<T>` |
| `StopAsync()` | Sends a stop command to the engine |

All methods accept `CancellationToken`. The client implements `IAsyncDisposable`.

---

## Architecture

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

**Control plane** (HTTP) — health, presets, voices, stop.
**Data plane** (WebSocket) — bidirectional: speak commands go up, PCM16 audio chunks stream down.

The SDK handles connection lifecycle, JSON framing, base64 decoding, graceful WebSocket close, and API version compatibility checks automatically.

---

## Installation from Source

### Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/) with MAUI workload (for the desktop app)
- .NET 8.0 SDK (sufficient for the SDK and CLI alone)
- Windows 10/11 (for the MAUI app and NAudio playback)
- A running [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) engine

### Clone and run

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## Project Structure

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         32 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## Examples

| Example | What it shows |
|---|---|
| [Quickstart](examples/Quickstart/) | Connect, speak, save WAV — zero config |
| [Agent Tool](examples/AgentTool/) | SDK as a callable tool in an AI agent pipeline |

---

## Documentation

- [Getting started with the SDK](docs/getting-started-sdk.md)
- [Streaming model](docs/streaming-model.md)
- [Error model](docs/error-model.md)
- [API reference](docs/api.md)
- [API contract](docs/api-contract.md)
- [Compatibility & trust](docs/compatibility.md)
- [Engine setup](docs/engine-setup.md)
- [Upgrade & rollback playbook](docs/upgrade-playbook.md)
- [Publishing the SDK](docs/publishing.md)
- [Fresh install validation](docs/fresh-install.md)
- [Evaluation guide](docs/evaluation-guide.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

---

## FAQ

**What is the SDK?**
`Soundboard.Client` is a standalone .NET 8+ library that handles all engine communication — health checks, discovery, and streaming speech over WebSocket. Reference it from any .NET project.

**What is the MAUI app?**
A reference client that demonstrates the SDK with a desktop UI. It is not the product — it shows one way to use the SDK.

**Is this production-ready?**
The SDK API (v1.0) is stable. The MAUI app is demo-grade. See [known limitations](docs/known-limitations.md).

**Can I build my own UI?**
Yes. That is the point. The SDK has zero UI dependencies. Implement `IAudioPlayer` for your platform and go.

**Where does the engine live?**
In a separate repository: [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard). This repo contains zero engine code.

---

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | WebSocket connections to local voice engine, audio playback, engine configuration |
| **Data NOT touched** | No telemetry, no analytics, no cloud sync, no credentials stored |
| **Permissions** | Network: WebSocket to configurable engine URL (default localhost). Audio: playback device access |
| **Network** | Local only — connects to voice engine on user-configured host |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

This project is licensed under the [MIT License](LICENSE).

---

## Links

- [Engine repository](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client on NuGet](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio on NuGet](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [Known limitations](docs/known-limitations.md)
