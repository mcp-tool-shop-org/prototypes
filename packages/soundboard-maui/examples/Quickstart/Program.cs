// Soundboard SDK Quickstart
//
// Connects to a running voice engine, picks the first available
// preset and voice, speaks a sentence, and saves it as a WAV file.
//
// Prerequisites:
//   Engine running on localhost:8765 (or set SOUNDBOARD_BASE_URL)
//
// Run:
//   dotnet run --project examples/Quickstart

using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// 1. Connect
var health = await client.GetHealthAsync();
Console.WriteLine($"Connected: engine v{health.EngineVersion}, API {health.ApiVersion}");

// 2. Discover
var presets = await client.GetPresetsAsync();
var voices = await client.GetVoicesAsync();
Console.WriteLine($"Available: {presets.Count} presets, {voices.Count} voices");

// 3. Speak — audio streams chunk by chunk
var chunks = new List<byte[]>();
var sampleRate = 24000;

var progress = new Progress<AudioChunk>(chunk =>
{
    chunks.Add(chunk.PcmData);
    sampleRate = chunk.SampleRate;
    Console.Write(".");
});

Console.Write("Streaming");
await client.SpeakAsync(
    new SpeakRequest("This is the Soundboard SDK. One interface, streaming audio, zero configuration.", presets[0], voices[0]),
    progress);
Console.WriteLine(" done.");

// 4. Save to WAV
var path = "quickstart-output.wav";
WriteWav(path, chunks, sampleRate);
Console.WriteLine($"Saved: {path} ({new FileInfo(path).Length:N0} bytes)");

static void WriteWav(string path, List<byte[]> chunks, int sampleRate)
{
    var totalBytes = chunks.Sum(c => c.Length);
    using var fs = File.Create(path);
    using var bw = new BinaryWriter(fs);

    bw.Write("RIFF"u8);
    bw.Write(36 + totalBytes);
    bw.Write("WAVE"u8);
    bw.Write("fmt "u8);
    bw.Write(16);
    bw.Write((short)1);          // PCM
    bw.Write((short)1);          // Mono
    bw.Write(sampleRate);
    bw.Write(sampleRate * 2);    // ByteRate
    bw.Write((short)2);          // BlockAlign
    bw.Write((short)16);         // BitsPerSample
    bw.Write("data"u8);
    bw.Write(totalBytes);

    foreach (var chunk in chunks)
        bw.Write(chunk);
}
