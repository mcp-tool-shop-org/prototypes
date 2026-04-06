---
title: Getting Started
description: Install the SDK and produce speech in under five minutes.
sidebar:
  order: 1
---

Integrate streaming TTS into any .NET application in under five minutes.

## NuGet packages

| Package | Description |
|---|---|
| **Soundboard.Client** | Front-door SDK — streaming TTS client for any Soundboard-compatible voice engine. Pure C#, zero UI deps. |
| **Soundboard.Maui.Audio** | NAudio-based PCM16 streaming playback adapter for Windows. Buffering, thread-safe, state tracking. |

## Install the SDK

```bash
dotnet add package Soundboard.Client
```

Or add directly to your `.csproj`:

```xml
<PackageReference Include="Soundboard.Client" Version="1.2.2" />
```

## Prerequisites

- .NET 8.0+ SDK (sufficient for the SDK and CLI)
- .NET 10.0 SDK with MAUI workload (only for the desktop reference app)
- Windows 10/11 (for the MAUI app and NAudio playback)
- A running voice engine on `localhost:8765` (see [Engine Setup](/soundboard-maui/handbook/engine-setup/))

## Speak in five lines

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

## Configuration

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

## Cancellation

Every async method accepts `CancellationToken`:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

try
{
    await client.SpeakAsync(request, progress, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Speech cancelled.");
}
```

## Dependency injection

```csharp
// In your DI setup (e.g. ASP.NET, MAUI, Generic Host)
services.AddSingleton(new SoundboardClientOptions
{
    BaseUrl = "http://localhost:8765"
});
services.AddSingleton<ISoundboardClient>(sp =>
    new SoundboardClient(sp.GetRequiredService<SoundboardClientOptions>()));
```

## Audio output

The SDK delivers raw PCM16 chunks. How you play them is up to you:

| Platform | Suggested approach |
|----------|-------------------|
| Windows | NAudio `BufferedWaveProvider` + `WaveOutEvent` |
| Cross-platform | SDL2, PortAudio, or platform audio APIs |
| Server | Write to file or forward to clients |

See `Soundboard.Maui.Audio` for a working NAudio implementation.

## Install from source

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

## Examples

| Example | What it shows |
|---|---|
| Quickstart | Connect, speak, save WAV — zero config |
| Agent Tool | SDK as a callable tool in an AI agent pipeline |

## Fresh install validation

Run these commands on a clean machine to verify everything works with no prior setup:

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Tests (no engine needed) — 49 tests pass
dotnet test tests/Soundboard.Client.Tests
dotnet test tests/Soundboard.IntegrationTests

# Build everything
dotnet build src/Soundboard.Client
dotnet build src/soundboard-cli
dotnet build examples/Quickstart
dotnet build examples/AgentTool
```

Only prerequisites: .NET SDK and Git. No accounts, no API keys, no environment configuration.

## Next steps

- [Architecture](/soundboard-maui/handbook/architecture/) — how the layers fit together
- [SDK Guide](/soundboard-maui/handbook/sdk-guide/) — streaming model and integration patterns
- [Engine Setup](/soundboard-maui/handbook/engine-setup/) — install and run the voice engine
