using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Soundboard.Client.Models;

namespace Soundboard.Client;

/// <summary>
/// Default implementation of <see cref="ISoundboardClient"/>.
/// Communicates with the engine over HTTP (control plane) and WebSocket (streaming audio).
/// </summary>
public sealed class SoundboardClient : ISoundboardClient
{
    /// <summary>The API contract version this SDK was built against.</summary>
    public const string SdkApiVersion = "1";

    private readonly HttpClient _http;
    private readonly SoundboardClientOptions _options;
    private readonly ILogger _logger;

    /// <summary>Creates a new client with optional configuration, HTTP client, and logger.</summary>
    public SoundboardClient(
        SoundboardClientOptions? options = null,
        HttpClient? httpClient = null,
        ILogger? logger = null)
    {
        _options = options ?? new SoundboardClientOptions();
        _logger = logger ?? NullLogger.Instance;
        _http = httpClient ?? new HttpClient();
        _http.BaseAddress = new Uri(_options.BaseUrl);
        _http.Timeout = _options.HttpTimeout;
        _logger.LogDebug("SoundboardClient created: base={BaseUrl}, httpTimeout={Timeout}s",
            _options.BaseUrl, _options.HttpTimeout.TotalSeconds);
    }

    internal SoundboardClient(HttpClient http, SoundboardClientOptions options, ILogger? logger = null)
    {
        _http = http;
        _options = options;
        _logger = logger ?? NullLogger.Instance;
    }

    /// <inheritdoc />
    public async Task<EngineInfo> GetHealthAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("GET /api/health");
        var health = await _http.GetFromJsonAsync<EngineInfo>(
            "/api/health",
            ct
        ).ConfigureAwait(false) ?? throw new InvalidOperationException("Invalid health response");

        if (!string.IsNullOrEmpty(health.ApiVersion) && health.ApiVersion != SdkApiVersion)
        {
            _logger.LogWarning(
                "API version mismatch: SDK expects {SdkVersion}, engine reports {EngineVersion}. " +
                "Proceeding, but some features may not work as expected.",
                SdkApiVersion, health.ApiVersion);
        }

        return health;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetPresetsAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("GET /api/presets");
        var response = await _http.GetFromJsonAsync<JsonElement>("/api/presets", ct).ConfigureAwait(false);
        var presets = response.GetProperty("presets").EnumerateArray()
            .Select(x => x.GetString()!)
            .ToList();
        _logger.LogDebug("Received {Count} presets", presets.Count);
        return presets;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetVoicesAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("GET /api/voices");
        var response = await _http.GetFromJsonAsync<JsonElement>("/api/voices", ct).ConfigureAwait(false);
        var voices = response.GetProperty("voices").EnumerateArray()
            .Select(x => x.GetProperty("id").GetString()!)
            .ToList();
        _logger.LogDebug("Received {Count} voices", voices.Count);
        return voices;
    }

    /// <inheritdoc />
    public async Task SpeakAsync(
        SpeakRequest request,
        IProgress<AudioChunk> audioProgress,
        CancellationToken ct = default)
    {
        using var ws = new ClientWebSocket();

        using var connectCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        connectCts.CancelAfter(_options.WebSocketConnectTimeout);

        _logger.LogDebug("Connecting WebSocket to {Uri}", _options.WsUri);
        await ws.ConnectAsync(_options.WsUri, connectCts.Token).ConfigureAwait(false);

        var requestId = request.ResolvedRequestId;
        _logger.LogInformation("SpeakAsync started: requestId={RequestId}, text={TextLength}chars",
            requestId, request.Text.Length);

        var message = JsonSerializer.Serialize(new
        {
            type = "speak",
            request_id = requestId,
            payload = new { text = request.Text, preset = request.Preset, voice = request.Voice }
        });

        await ws.SendAsync(
            Encoding.UTF8.GetBytes(message),
            WebSocketMessageType.Text,
            true,
            ct
        ).ConfigureAwait(false);

        var buffer = new byte[8192];
        using var msgStream = new MemoryStream();
        var chunkCount = 0;

        try
        {
            while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
            {
                using var receiveCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                receiveCts.CancelAfter(_options.WebSocketReceiveTimeout);

                var result = await ws.ReceiveAsync(buffer, receiveCts.Token).ConfigureAwait(false);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogDebug("WebSocket closed by server");
                    break;
                }

                msgStream.Write(buffer, 0, result.Count);

                if (!result.EndOfMessage)
                    continue;

                using var json = JsonDocument.Parse(msgStream.ToArray());
                msgStream.SetLength(0);

                var msgType = json.RootElement.GetProperty("type").GetString();

                if (msgType == "audio_chunk")
                {
                    var payload = json.RootElement.GetProperty("payload");
                    var pcm = Convert.FromBase64String(payload.GetProperty("data").GetString()!);
                    var rate = payload.GetProperty("sample_rate").GetInt32();

                    chunkCount++;
                    audioProgress.Report(new AudioChunk(pcm, rate));
                }
                else if (msgType == "state")
                {
                    var state = json.RootElement.GetProperty("payload")
                        .GetProperty("state").GetString();
                    _logger.LogDebug("State event: {State} (requestId={RequestId})", state, requestId);
                    if (state == "finished")
                        break;
                }
                else if (msgType == "error")
                {
                    var errorMsg = json.RootElement.GetProperty("payload")
                        .GetProperty("message").GetString() ?? "Engine error";
                    _logger.LogError("Engine error: {Message} (requestId={RequestId})", errorMsg, requestId);
                    throw new InvalidOperationException(errorMsg);
                }
            }
        }
        finally
        {
            // Gracefully close the WebSocket if it's still open
            if (ws.State is WebSocketState.Open or WebSocketState.CloseReceived)
            {
                try
                {
                    using var closeCts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                    await ws.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "done",
                        closeCts.Token
                    ).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("WebSocket close failed (non-critical): {Message}", ex.Message);
                }
            }
        }

        _logger.LogInformation("SpeakAsync completed: requestId={RequestId}, chunks={ChunkCount}",
            requestId, chunkCount);
    }

    /// <inheritdoc />
    public async Task StopAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("POST /api/stop");
        await _http.PostAsync("/api/stop", null, ct).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        _logger.LogDebug("SoundboardClient disposing");
        _http.Dispose();
        return ValueTask.CompletedTask;
    }
}
