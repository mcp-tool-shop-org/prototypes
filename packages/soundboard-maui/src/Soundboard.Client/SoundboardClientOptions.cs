namespace Soundboard.Client;

/// <summary>Configuration options for <see cref="SoundboardClient"/>.</summary>
public sealed record SoundboardClientOptions
{
    private const string DefaultBaseUrl = "http://localhost:8765";
    private const string EnvVarName = "SOUNDBOARD_BASE_URL";

    /// <summary>Engine base URL. Defaults to <c>SOUNDBOARD_BASE_URL</c> env var or <c>http://localhost:8765</c>.</summary>
    public string BaseUrl { get; init; } =
        Environment.GetEnvironmentVariable(EnvVarName) ?? DefaultBaseUrl;

    /// <summary>Timeout for HTTP requests (health, presets, voices, stop).</summary>
    public TimeSpan HttpTimeout { get; init; } = TimeSpan.FromSeconds(10);

    /// <summary>Timeout for the initial WebSocket connection handshake.</summary>
    public TimeSpan WebSocketConnectTimeout { get; init; } = TimeSpan.FromSeconds(5);

    /// <summary>Timeout between consecutive WebSocket messages during streaming.</summary>
    public TimeSpan WebSocketReceiveTimeout { get; init; } = TimeSpan.FromSeconds(30);

    internal Uri WsUri
    {
        get
        {
            var builder = new UriBuilder(BaseUrl);
            builder.Scheme = builder.Scheme switch
            {
                "https" => "wss",
                _ => "ws"
            };
            builder.Path = builder.Path.TrimEnd('/') + "/stream";
            return builder.Uri;
        }
    }
}
