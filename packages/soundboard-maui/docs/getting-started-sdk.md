# Getting Started with the Soundboard SDK

Integrate streaming TTS into any .NET application in under 5 minutes.

## Install

```bash
dotnet add package Soundboard.Client
```

Or add directly to your `.csproj`:

```xml
<PackageReference Include="Soundboard.Client" Version="1.0.0" />
```

## Prerequisites

A running voice engine on `localhost:8765` (or any URL you configure). See the [engine repository](https://github.com/mcp-tool-shop-org/voice-soundboard) for setup.

## Minimal example

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

// Create a client (defaults to localhost:8765)
await using var client = new SoundboardClient();

// 1. Check engine health
var health = await client.GetHealthAsync();
Console.WriteLine($"Engine: v{health.EngineVersion}, API: {health.ApiVersion}");

// 2. Discover presets and voices
var presets = await client.GetPresetsAsync();
var voices = await client.GetVoicesAsync();

Console.WriteLine($"Presets: {string.Join(", ", presets)}");
Console.WriteLine($"Voices: {string.Join(", ", voices)}");

// 3. Stream speech
var progress = new Progress<AudioChunk>(chunk =>
{
    Console.WriteLine($"  Received {chunk.PcmData.Length} bytes @ {chunk.SampleRate}Hz");
    // Feed chunk.PcmData to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the Soundboard SDK.", presets[0], voices[0]),
    progress);

Console.WriteLine("Done.");
```

## Configuration

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://192.168.1.50:8765",   // Remote engine
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

Or set the `SOUNDBOARD_BASE_URL` environment variable — the SDK reads it automatically.

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
services.AddSingleton(new SoundboardClientOptions { BaseUrl = "http://localhost:8765" });
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

## Next steps

- [Streaming model](streaming-model.md) — how audio flows from engine to your app
- [Error model](error-model.md) — failure modes and how to handle them
- [API reference](api.md) — complete public API surface
- [API contract](api-contract.md) — wire protocol between SDK and engine
