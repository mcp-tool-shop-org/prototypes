# Soundboard.Client

Streaming TTS client SDK for .NET. Connects to any voice engine implementing the [Soundboard API contract](https://github.com/mcp-tool-shop-org/soundboard-maui/blob/main/docs/api-contract.md).

## Quick start

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Check engine health
var health = await client.GetHealthAsync();
Console.WriteLine($"Engine v{health.EngineVersion}");

// Discover available presets and voices
var presets = await client.GetPresetsAsync();
var voices = await client.GetVoicesAsync();

// Stream speech — audio arrives chunk by chunk
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData to your audio output
    // PCM16 mono at chunk.SampleRate (24kHz)
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

## Features

- Streaming audio via WebSocket (`IProgress<AudioChunk>`)
- `CancellationToken` on every async method
- Zero UI dependencies — works in console, WPF, ASP.NET, anywhere
- Engine-agnostic — any compliant engine works
- Single dependency: `Microsoft.Extensions.Logging.Abstractions`

## Configuration

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://localhost:8765",
    HttpTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(30)
});
```

Or set `SOUNDBOARD_BASE_URL` environment variable.

## Links

- [API reference](https://github.com/mcp-tool-shop-org/soundboard-maui/blob/main/docs/api.md)
- [API contract](https://github.com/mcp-tool-shop-org/soundboard-maui/blob/main/docs/api-contract.md)
- [Getting started guide](https://github.com/mcp-tool-shop-org/soundboard-maui/blob/main/docs/getting-started-sdk.md)
