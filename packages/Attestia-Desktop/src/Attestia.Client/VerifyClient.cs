using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class VerifyClient
{
    private readonly AttestiaHttpClient _http;

    internal VerifyClient(AttestiaHttpClient http) => _http = http;

    public Task<GlobalStateHash> StateHashAsync(object ledgerSnapshot, object registrumSnapshot, string expectedHash, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<GlobalStateHash>("/api/v1/verify/hash",
            new { ledgerSnapshot, registrumSnapshot, expectedHash }, ct);

    public Task<ReplayResult> ReplayAsync(object ledgerSnapshot, object registrumSnapshot, string? expectedHash = null, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<ReplayResult>("/api/v1/verify/replay",
            new { ledgerSnapshot, registrumSnapshot, expectedHash }, ct);
}
