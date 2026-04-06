using Soundboard.Client.Models;

namespace Soundboard.Client;

/// <summary>
/// Client interface for communicating with a Soundboard-compatible voice engine.
/// </summary>
public interface ISoundboardClient : IAsyncDisposable
{
    /// <summary>Checks engine health and returns version information.</summary>
    Task<EngineInfo> GetHealthAsync(CancellationToken ct = default);

    /// <summary>Returns the list of available preset identifiers.</summary>
    Task<IReadOnlyList<string>> GetPresetsAsync(CancellationToken ct = default);

    /// <summary>Returns the list of available voice identifiers.</summary>
    Task<IReadOnlyList<string>> GetVoicesAsync(CancellationToken ct = default);

    /// <summary>
    /// Streams synthesized speech from the engine. Audio chunks are reported
    /// via <paramref name="audioProgress"/> as they arrive over WebSocket.
    /// </summary>
    Task SpeakAsync(
        SpeakRequest request,
        IProgress<AudioChunk> audioProgress,
        CancellationToken ct = default
    );

    /// <summary>Sends a stop command to the engine.</summary>
    Task StopAsync(CancellationToken ct = default);
}
