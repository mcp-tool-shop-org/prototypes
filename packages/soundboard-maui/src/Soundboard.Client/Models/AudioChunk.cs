namespace Soundboard.Client.Models;

/// <summary>A chunk of PCM16 audio received from the engine during streaming.</summary>
/// <param name="PcmData">Raw PCM16 audio bytes (signed 16-bit little-endian, mono).</param>
/// <param name="SampleRate">Sample rate in Hz (typically 24000).</param>
public sealed record AudioChunk(
    byte[] PcmData,
    int SampleRate
);
