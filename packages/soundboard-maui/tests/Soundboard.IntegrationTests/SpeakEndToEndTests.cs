using Soundboard.Client;
using Soundboard.Client.Models;
using Xunit;

namespace Soundboard.IntegrationTests;

public sealed class SpeakEndToEndTests : IAsyncLifetime
{
    private FakeEngineServer _engine = null!;
    private string _baseUrl = null!;

    public async Task InitializeAsync()
    {
        _engine = new FakeEngineServer();
        _baseUrl = await _engine.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _engine.DisposeAsync();
    }

    [Fact]
    public async Task Health_ReturnsEngineInfo()
    {
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        var health = await client.GetHealthAsync();

        Assert.Equal("ready", health.Status);
        Assert.Equal("fake-1.0", health.EngineVersion);
        Assert.Equal("1", health.ApiVersion);
    }

    [Fact]
    public async Task Presets_ReturnsNonEmptyList()
    {
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        var presets = await client.GetPresetsAsync();

        Assert.NotEmpty(presets);
        Assert.Contains("assistant", presets);
    }

    [Fact]
    public async Task Voices_ReturnsNonEmptyList()
    {
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        var voices = await client.GetVoicesAsync();

        Assert.NotEmpty(voices);
        Assert.Contains("af_bella", voices);
    }

    [Fact]
    public async Task Speak_StreamsAudioChunksAndFinishes()
    {
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        var chunks = new List<AudioChunk>();
        var tcs = new TaskCompletionSource();
        var progress = new Progress<AudioChunk>(chunk =>
        {
            lock (chunks)
            {
                chunks.Add(chunk);
                if (chunks.Count >= 5) tcs.TrySetResult();
            }
        });

        await client.SpeakAsync(
            new SpeakRequest("Hello from integration test", "assistant", "af_bella"),
            progress,
            CancellationToken.None);

        // Wait for all Progress<T> callbacks to fire (they marshal asynchronously)
        await Task.WhenAny(tcs.Task, Task.Delay(2000));

        Assert.Equal(5, chunks.Count);
        Assert.All(chunks, c =>
        {
            Assert.Equal(24000, c.SampleRate);
            Assert.Equal(1024, c.PcmData.Length);
        });
    }

    [Fact]
    public async Task Stop_DoesNotThrow()
    {
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        await client.StopAsync();
    }
}
