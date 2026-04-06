using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Soundboard.IntegrationTests;

public sealed class FakeEngineServer : IAsyncDisposable
{
    private readonly WebApplication _app;
    public string BaseUrl { get; }

    public FakeEngineServer(int port = 0)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls(port == 0 ? "http://127.0.0.1:0" : $"http://127.0.0.1:{port}");
        builder.Logging.ClearProviders();

        _app = builder.Build();
        _app.UseWebSockets();

        _app.MapGet("/api/health", () => Results.Json(new
        {
            status = "ready",
            engine_version = "fake-1.0",
            api_version = "1"
        }));

        _app.MapGet("/api/presets", () => Results.Json(new
        {
            presets = new[] { "assistant", "narrator" }
        }));

        _app.MapGet("/api/voices", () => Results.Json(new
        {
            voices = new[] { new { id = "af_bella", name = "Bella" }, new { id = "am_adam", name = "Adam" } }
        }));

        _app.MapPost("/api/stop", () => Results.Ok());

        _app.Map("/stream", async context =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = 400;
                return;
            }

            using var ws = await context.WebSockets.AcceptWebSocketAsync();
            await HandleWebSocket(ws);
        });

        BaseUrl = "will be set after start";
    }

    public async Task<string> StartAsync()
    {
        await _app.StartAsync();
        var address = _app.Urls.First();
        return address;
    }

    private static async Task HandleWebSocket(WebSocket ws)
    {
        // Receive the speak command
        var buffer = new byte[4096];
        await ws.ReceiveAsync(buffer, CancellationToken.None);

        // Send state: started
        await SendJson(ws, new { type = "state", request_id = "fake", payload = new { state = "started" } });

        // Send 5 audio chunks
        var pcmData = new byte[1024]; // 512 samples of silence
        for (int i = 0; i < 5; i++)
        {
            await SendJson(ws, new
            {
                type = "audio_chunk",
                request_id = "fake",
                payload = new
                {
                    data = Convert.ToBase64String(pcmData),
                    sample_rate = 24000
                }
            });
        }

        // Send state: finished
        await SendJson(ws, new { type = "state", request_id = "fake", payload = new { state = "finished" } });
    }

    private static async Task SendJson(WebSocket ws, object message)
    {
        var json = JsonSerializer.Serialize(message);
        var bytes = Encoding.UTF8.GetBytes(json);
        await ws.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
    }

    public async ValueTask DisposeAsync()
    {
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}
