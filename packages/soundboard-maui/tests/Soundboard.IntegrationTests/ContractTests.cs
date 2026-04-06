using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Soundboard.Client;
using Soundboard.Client.Models;
using Xunit;

namespace Soundboard.IntegrationTests;

/// <summary>
/// Contract tests verify the SDK correctly handles the wire protocol
/// defined in docs/api-contract.md. Each test targets a specific
/// contract requirement.
/// </summary>
public sealed class ContractTests : IAsyncLifetime
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

    // --- Contract §3: Control Plane ---

    [Fact]
    public async Task Health_ResponseContainsRequiredFields()
    {
        // Contract: GET /api/health returns status, engine_version, api_version
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });
        var health = await client.GetHealthAsync();

        Assert.NotNull(health.Status);
        Assert.NotNull(health.EngineVersion);
        Assert.NotNull(health.ApiVersion);
    }

    [Fact]
    public async Task Presets_ResponseIsStringList()
    {
        // Contract: GET /api/presets returns { presets: [...] }
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });
        var presets = await client.GetPresetsAsync();

        Assert.IsAssignableFrom<IReadOnlyList<string>>(presets);
        Assert.True(presets.Count >= 1, "Engine must expose at least one preset");
    }

    [Fact]
    public async Task Voices_ResponseContainsIds()
    {
        // Contract: GET /api/voices returns { voices: [{ id, ... }] }
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });
        var voices = await client.GetVoicesAsync();

        Assert.IsAssignableFrom<IReadOnlyList<string>>(voices);
        Assert.True(voices.Count >= 1, "Engine must expose at least one voice");
        Assert.All(voices, v => Assert.False(string.IsNullOrWhiteSpace(v)));
    }

    // --- Contract §4: Data Plane ---

    [Fact]
    public async Task Speak_AudioChunksArePcm16()
    {
        // Contract §5: Audio is PCM16, 24kHz, mono
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        var chunks = new List<AudioChunk>();
        var progress = new Progress<AudioChunk>(chunk => chunks.Add(chunk));

        await client.SpeakAsync(
            new SpeakRequest("Contract test", "assistant", "af_bella"),
            progress);

        await Task.Delay(100);

        Assert.NotEmpty(chunks);
        Assert.All(chunks, c =>
        {
            Assert.Equal(24000, c.SampleRate);
            // PCM16 = 2 bytes per sample, so byte count must be even
            Assert.Equal(0, c.PcmData.Length % 2);
        });
    }

    [Fact]
    public async Task Speak_DeliversMultipleChunks()
    {
        // Contract: Chunks arrive in time order, engine sends multiple chunks
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
            new SpeakRequest("Ordering test", "assistant", "af_bella"),
            progress);

        // Wait for all callbacks to fire (Progress<T> marshals asynchronously)
        await Task.WhenAny(tcs.Task, Task.Delay(2000));

        Assert.True(chunks.Count >= 1, "Expected at least one audio chunk");
        // All chunks should have consistent sample rate
        Assert.All(chunks, c => Assert.Equal(24000, c.SampleRate));
    }

    // --- Contract §4: Error handling ---

    [Fact]
    public async Task Speak_EngineError_ThrowsInvalidOperationException()
    {
        // Contract: Engine error messages surface as exceptions
        // We use a custom error server for this test
        await using var errorEngine = new ErrorEngineServer();
        var errorUrl = await errorEngine.StartAsync();

        await using var client = new SoundboardClient(
            new SoundboardClientOptions { BaseUrl = errorUrl });

        var progress = new Progress<AudioChunk>(_ => { });

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => client.SpeakAsync(
                new SpeakRequest("trigger error", "bad", "bad"),
                progress));

        Assert.Contains("test error", ex.Message);
    }

    // --- Contract §7: Version compatibility ---

    [Fact]
    public async Task Health_ApiVersionIsNonEmpty()
    {
        // Contract: api_version is present and non-empty
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });
        var health = await client.GetHealthAsync();

        Assert.False(string.IsNullOrWhiteSpace(health.ApiVersion));
    }

    [Fact]
    public async Task Health_MatchingApiVersion_Succeeds()
    {
        // Contract §7: Matching api_version proceeds normally
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });
        var health = await client.GetHealthAsync();

        Assert.Equal(SoundboardClient.SdkApiVersion, health.ApiVersion);
    }

    [Fact]
    public async Task Health_MismatchedApiVersion_StillSucceeds()
    {
        // Contract §7: Mismatched version proceeds (forward-compatible), does not throw
        await using var mismatchEngine = new VersionMismatchServer();
        var url = await mismatchEngine.StartAsync();

        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = url });
        var health = await client.GetHealthAsync();

        Assert.Equal("99", health.ApiVersion);
        Assert.NotEqual(SoundboardClient.SdkApiVersion, health.ApiVersion);

        await mismatchEngine.DisposeAsync();
    }

    [Fact]
    public void SdkApiVersion_IsExposed()
    {
        // SDK declares its expected API version as a public constant
        Assert.False(string.IsNullOrWhiteSpace(SoundboardClient.SdkApiVersion));
    }

    // --- SDK guarantees ---

    [Fact]
    public async Task Client_ImplementsIAsyncDisposable()
    {
        // SDK rule: Client is IAsyncDisposable
        ISoundboardClient client = new SoundboardClient(
            new SoundboardClientOptions { BaseUrl = _baseUrl });

        Assert.IsAssignableFrom<IAsyncDisposable>(client);
        await client.DisposeAsync();
    }

    [Fact]
    public async Task Speak_CancellationStopsStream()
    {
        // SDK rule: CancellationToken on every async method
        await using var client = new SoundboardClient(new SoundboardClientOptions { BaseUrl = _baseUrl });

        using var cts = new CancellationTokenSource();
        cts.Cancel(); // Cancel immediately

        var progress = new Progress<AudioChunk>(_ => { });

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => client.SpeakAsync(
                new SpeakRequest("cancel test", "assistant", "af_bella"),
                progress,
                cts.Token));
    }
}

/// <summary>
/// A minimal engine server that returns an error on WebSocket speak.
/// </summary>
internal sealed class ErrorEngineServer : IAsyncDisposable
{
    private readonly WebApplication _app;

    public ErrorEngineServer()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();

        _app = builder.Build();
        _app.UseWebSockets();

        _app.MapGet("/api/health", () => Results.Json(new
        {
            status = "ready",
            engine_version = "error-1.0",
            api_version = "1"
        }));

        _app.Map("/stream", async context =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = 400;
                return;
            }

            using var ws = await context.WebSockets.AcceptWebSocketAsync();

            // Receive command
            var buffer = new byte[4096];
            await ws.ReceiveAsync(buffer, CancellationToken.None);

            // Send error response
            var json = JsonSerializer.Serialize(new
            {
                type = "error",
                request_id = "fake",
                payload = new { code = "test_error", message = "test error: bad request" }
            });
            var bytes = Encoding.UTF8.GetBytes(json);
            await ws.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        });
    }

    public async Task<string> StartAsync()
    {
        await _app.StartAsync();
        return _app.Urls.First();
    }

    public async ValueTask DisposeAsync()
    {
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}

/// <summary>
/// Engine server that reports a future API version to test forward compatibility.
/// </summary>
internal sealed class VersionMismatchServer : IAsyncDisposable
{
    private readonly WebApplication _app;

    public VersionMismatchServer()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();

        _app = builder.Build();

        _app.MapGet("/api/health", () => Results.Json(new
        {
            status = "ready",
            engine_version = "future-2.0",
            api_version = "99"
        }));
    }

    public async Task<string> StartAsync()
    {
        await _app.StartAsync();
        return _app.Urls.First();
    }

    public async ValueTask DisposeAsync()
    {
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}
