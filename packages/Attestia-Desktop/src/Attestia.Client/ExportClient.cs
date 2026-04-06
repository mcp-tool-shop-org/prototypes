using System.Text.Json;

namespace Attestia.Client;

public sealed class ExportClient
{
    private readonly AttestiaHttpClient _http;

    internal ExportClient(AttestiaHttpClient http) => _http = http;

    public Task<string> ExportEventsNdjsonAsync(CancellationToken ct = default)
        => _http.GetStringAsync("/api/v1/export/events", ct);

    public Task<JsonDocument> ExportStateAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<JsonDocument>("/api/v1/export/state", ct);
}
