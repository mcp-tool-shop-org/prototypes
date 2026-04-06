using System.Text.Json;
using Soundboard.Client.Models;

namespace Soundboard.Client.Tests;

public class AudioChunkParsingTests
{
    [Fact]
    public void AudioChunk_ContractEnvelope_ParsesCorrectly()
    {
        // Simulate what the engine sends over WebSocket
        var pcmBytes = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        var base64 = Convert.ToBase64String(pcmBytes);
        var json = $$"""
            {
                "type": "audio_chunk",
                "request_id": "abc-123",
                "payload": {
                    "data": "{{base64}}",
                    "sample_rate": 24000
                }
            }
            """;

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("audio_chunk", root.GetProperty("type").GetString());

        var payload = root.GetProperty("payload");
        var pcm = Convert.FromBase64String(payload.GetProperty("data").GetString()!);
        var rate = payload.GetProperty("sample_rate").GetInt32();

        var chunk = new AudioChunk(pcm, rate);

        Assert.Equal(pcmBytes, chunk.PcmData);
        Assert.Equal(24000, chunk.SampleRate);
    }

    [Fact]
    public void StateMessage_Finished_ParsesCorrectly()
    {
        var json = """
            {
                "type": "state",
                "request_id": "abc-123",
                "payload": {
                    "state": "finished"
                }
            }
            """;

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("state", root.GetProperty("type").GetString());
        Assert.Equal("finished", root.GetProperty("payload").GetProperty("state").GetString());
    }

    [Fact]
    public void ErrorMessage_ParsesCorrectly()
    {
        var json = """
            {
                "type": "error",
                "request_id": "abc-123",
                "payload": {
                    "code": "voice_not_found",
                    "message": "Voice 'nonexistent' not available"
                }
            }
            """;

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("error", root.GetProperty("type").GetString());
        Assert.Equal("voice_not_found", root.GetProperty("payload").GetProperty("code").GetString());
        Assert.Equal("Voice 'nonexistent' not available",
            root.GetProperty("payload").GetProperty("message").GetString());
    }

    [Fact]
    public void EngineEvent_Record_Works()
    {
        var evt = new EngineEvent("streaming");

        Assert.Equal("streaming", evt.State);
    }

    [Fact]
    public void EngineInfo_Record_Works()
    {
        var info = new EngineInfo("ok", "0.9.0", "1");

        Assert.Equal("ok", info.Status);
        Assert.Equal("0.9.0", info.EngineVersion);
        Assert.Equal("1", info.ApiVersion);
    }

    [Fact]
    public void EngineInfo_DeserializesSnakeCase()
    {
        var json = """
            {
                "status": "ready",
                "engine_version": "1.0.0",
                "api_version": "1"
            }
            """;

        var info = System.Text.Json.JsonSerializer.Deserialize<EngineInfo>(json);

        Assert.NotNull(info);
        Assert.Equal("ready", info!.Status);
        Assert.Equal("1.0.0", info.EngineVersion);
        Assert.Equal("1", info.ApiVersion);
    }
}
