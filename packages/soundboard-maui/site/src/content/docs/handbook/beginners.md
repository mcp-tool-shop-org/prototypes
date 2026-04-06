---
title: Beginner's Guide
description: A gentle introduction to Soundboard MAUI for first-time users and .NET newcomers.
sidebar:
  order: 99
---

New to Soundboard MAUI? This guide walks you through what the project is, what you need, and how to get speech playing from your own code.

## What is Soundboard MAUI?

Soundboard MAUI is a .NET SDK for streaming text-to-speech. You give it text, it sends that text to a voice engine, and audio comes back in real time as the engine generates it. The SDK (`Soundboard.Client`) is the core product -- a pure C# library with no UI dependencies that works in console apps, WPF, ASP.NET, MAUI, or any .NET 8+ project.

The repository also includes:

- **Soundboard.Maui.Audio** -- a Windows audio playback adapter using NAudio
- **Soundboard.Maui** -- a reference MAUI desktop app showing a complete integration
- **soundboard-cli** -- a reference console client that saves speech to WAV files

The SDK talks to any voice engine that implements the [API contract](/soundboard-maui/handbook/reference/). The reference engine is [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard), a Python server using Kokoro ONNX for inference.

## Prerequisites

Before you start, make sure you have:

| Requirement | Why |
|-------------|-----|
| [.NET 8.0+ SDK](https://dotnet.microsoft.com/) | Required to build and run the SDK, CLI, and examples |
| [Git](https://git-scm.com/) | Required to clone the repository |
| Windows 10 or 11 | Required for the MAUI app and NAudio playback (the SDK itself is cross-platform) |
| A running voice engine | Required for actual speech generation (tests work without one) |

You do **not** need: a NuGet account, API keys, cloud credentials, or a GPU. Everything runs locally.

## Installation

### Option A: NuGet package (recommended)

Add the SDK to any .NET 8+ project:

```bash
dotnet add package Soundboard.Client
```

This is all you need to start writing code against the SDK.

### Option B: Clone from source

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui
dotnet build
```

This gives you the SDK, both reference clients, examples, and the full test suite.

## Your first program

Create a new console app and add the SDK:

```bash
dotnet new console -n MySpeechApp
cd MySpeechApp
dotnet add package Soundboard.Client
```

Replace `Program.cs` with:

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

// Connect to the voice engine (defaults to localhost:8765)
await using var client = new SoundboardClient();

// Check that the engine is running
var health = await client.GetHealthAsync();
Console.WriteLine($"Engine status: {health.Status}");

// Discover available presets and voices
var presets = await client.GetPresetsAsync();
var voices = await client.GetVoicesAsync();

Console.WriteLine($"Presets: {string.Join(", ", presets)}");
Console.WriteLine($"Voices: {string.Join(", ", voices)}");

// Stream speech to console (just counting chunks here)
var chunkCount = 0;
var progress = new Progress<AudioChunk>(chunk =>
{
    chunkCount++;
    Console.Write(".");
});

await client.SpeakAsync(
    new SpeakRequest("Hello from Soundboard!", presets[0], voices[0]),
    progress);

Console.WriteLine();
Console.WriteLine($"Done — received {chunkCount} audio chunks.");
```

Run it:

```bash
dotnet run
```

If the engine is running, you will see dots appear as audio chunks arrive, followed by the total count. If the engine is not running, you will get an `HttpRequestException` -- see the troubleshooting section below.

## Key concepts

### Streaming, not batch

The SDK does not wait for the engine to finish generating all audio before returning. Instead, audio chunks arrive one at a time through `IProgress<AudioChunk>` as the engine produces them. This means your application can start playing audio before the full sentence is ready.

### Control plane vs data plane

The SDK uses two communication channels:

- **HTTP** (control plane) -- health checks, listing presets/voices, sending stop commands
- **WebSocket** (data plane) -- streaming audio during a speak operation

Each `SpeakAsync` call opens a fresh WebSocket connection. There is no connection pooling or persistent state between requests.

### Audio format

Every `AudioChunk` contains raw PCM16 audio: signed 16-bit little-endian, mono, typically at 24,000 Hz. The sample rate is included in each chunk. To hear the audio, you need an audio player -- NAudio on Windows, SDL2 or PortAudio cross-platform, or you can write the chunks to a WAV file (the CLI does exactly this).

### Engine independence

The SDK works with any engine that follows the [API contract](/soundboard-maui/handbook/reference/). You are not locked into a specific TTS model or backend. Swap engines by changing the URL.

## Common tasks

### Change the engine URL

By default, the SDK connects to `http://localhost:8765`. Override via environment variable or code:

```bash
# Environment variable
set SOUNDBOARD_BASE_URL=http://my-engine:9000
```

```csharp
// In code
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000"
});
```

### Save speech to a WAV file

The CLI reference client does this out of the box. Use `--output` to set the file path (defaults to `output.wav`):

```bash
dotnet run --project src/soundboard-cli -- speak "Hello world" --output hello.wav
```

You can also specify a preset and voice:

```bash
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator --voice af_bella --output hello.wav
```

### Use dependency injection

Register the SDK in your DI container:

```csharp
services.AddSingleton(new SoundboardClientOptions());
services.AddSingleton<ISoundboardClient>(sp =>
    new SoundboardClient(sp.GetRequiredService<SoundboardClientOptions>()));
```

### Cancel a speak operation

Every async method accepts `CancellationToken`:

```csharp
using var cts = new CancellationTokenSource();

// Cancel after 10 seconds
cts.CancelAfter(TimeSpan.FromSeconds(10));

try
{
    await client.SpeakAsync(request, progress, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Cancelled.");
}
```

### Try the MAUI desktop app

If you want to see a working GUI before writing code, run the reference desktop app:

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui
dotnet run --project src/Soundboard.Maui
```

The app connects to the engine automatically, shows available presets and voices in dropdown pickers, and streams speech when you type text and press Speak. It includes a welcome flow for first-time users and auto-reconnects if the engine goes offline. The MAUI app requires .NET 10 SDK with the MAUI workload and runs on Windows only.

## Troubleshooting

### "Engine not reachable" / HttpRequestException

The SDK cannot connect to the voice engine. Check:

1. Is the engine process running? Start it with `python main.py` in the voice-soundboard directory.
2. Is the URL correct? Verify with `curl http://localhost:8765/api/health`.
3. Is a firewall blocking the port?

### Audio chunks arrive but no sound

The SDK delivers raw PCM16 bytes. It does not play audio by itself. You need an audio player implementation. On Windows, use the `Soundboard.Maui.Audio` package with NAudio. On other platforms, implement the `IAudioPlayer` interface with your platform's audio API.

### Playback stutters or gaps

The engine may be generating audio slower than real time. This can happen with large models on slower hardware. There is no built-in buffering strategy -- audio plays as chunks arrive.

### Tests fail with "connection refused"

Unit tests (`Soundboard.Client.Tests`) do not need a running engine -- they use mock HTTP handlers. Integration tests (`Soundboard.IntegrationTests`) use a fake in-process engine server. If tests fail with connection errors, make sure you are running `dotnet test` from the repository root, not pointing at an external engine.

### Run the test suite

The repository includes 49 tests (32 unit + 17 integration) that run without a live engine:

```bash
cd soundboard-maui
dotnet test
```

Unit tests use mock HTTP handlers. Integration tests spin up a fake in-process engine server. If all 49 pass, your local setup is working correctly.

## Glossary

| Term | Meaning |
|------|---------|
| **SDK** | `Soundboard.Client` -- the NuGet package you reference in your project |
| **Engine** | The voice synthesis server (e.g. voice-soundboard) that generates audio |
| **Preset** | A named style configuration on the engine (e.g. "narrator", "conversational") |
| **Voice** | A named voice identity on the engine (e.g. "af_bella", "am_adam") |
| **AudioChunk** | A packet of raw PCM16 audio bytes with a sample rate |
| **Control plane** | HTTP endpoints for health, discovery, and commands |
| **Data plane** | WebSocket connection for streaming audio |
| **PCM16** | Pulse-code modulation, 16-bit signed little-endian -- the raw audio format |
| **NAudio** | A .NET audio library used by the Windows playback adapter |
| **Wire protocol** | The JSON message format between SDK and engine, documented in the [Reference](/soundboard-maui/handbook/reference/) |

## Next steps

- [Getting Started](/soundboard-maui/handbook/getting-started/) -- deeper installation and configuration guide
- [SDK Guide](/soundboard-maui/handbook/sdk-guide/) -- full streaming model and integration patterns
- [Architecture](/soundboard-maui/handbook/architecture/) -- how the four layers work together
- [Engine Setup](/soundboard-maui/handbook/engine-setup/) -- install and run the voice engine
- [Error Handling](/soundboard-maui/handbook/error-handling/) -- failure modes and troubleshooting
