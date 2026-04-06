using System.Web;
using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class ReconciliationClient
{
    private readonly AttestiaHttpClient _http;

    internal ReconciliationClient(AttestiaHttpClient http) => _http = http;

    public Task<ReconciliationReport> ReconcileAsync(ReconcileRequest request, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<ReconciliationReport>("/api/v1/reconcile", request, ct);

    public Task<AttestationRecord> AttestAsync(ReconcileRequest request, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<AttestationRecord>("/api/v1/attest", request, ct);

    public Task<PaginatedList<AttestationRecord>> ListAttestationsAsync(string? cursor = null, int? limit = null, CancellationToken ct = default)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        if (cursor is not null) query["cursor"] = cursor;
        if (limit is not null) query["limit"] = limit.Value.ToString();

        var qs = query.ToString();
        var path = string.IsNullOrEmpty(qs) ? "/api/v1/attestations" : $"/api/v1/attestations?{qs}";
        return _http.GetAsync<PaginatedList<AttestationRecord>>(path, ct);
    }
}

public sealed record ReconcileRequest
{
    public required IReadOnlyList<object> Intents { get; init; }
    public required IReadOnlyList<object> LedgerEntries { get; init; }
    public required IReadOnlyList<object> ChainEvents { get; init; }
    public ReconciliationScope? Scope { get; init; }
}
