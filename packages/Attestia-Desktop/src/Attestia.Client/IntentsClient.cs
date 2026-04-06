using System.Web;
using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class IntentsClient
{
    private readonly AttestiaHttpClient _http;

    internal IntentsClient(AttestiaHttpClient http) => _http = http;

    public Task<Intent> DeclareAsync(DeclareIntentRequest request, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<Intent>("/api/v1/intents", request, ct);

    public Task<Intent> GetAsync(string id, CancellationToken ct = default)
        => _http.GetEnvelopeAsync<Intent>($"/api/v1/intents/{Uri.EscapeDataString(id)}", ct);

    public Task<PaginatedList<Intent>> ListAsync(string? status = null, string? cursor = null, int? limit = null, CancellationToken ct = default)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        if (status is not null) query["status"] = status;
        if (cursor is not null) query["cursor"] = cursor;
        if (limit is not null) query["limit"] = limit.Value.ToString();

        var qs = query.ToString();
        var path = string.IsNullOrEmpty(qs) ? "/api/v1/intents" : $"/api/v1/intents?{qs}";
        return _http.GetAsync<PaginatedList<Intent>>(path, ct);
    }

    public Task<Intent> ApproveAsync(string id, string? reason = null, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<Intent>(
            $"/api/v1/intents/{Uri.EscapeDataString(id)}/approve",
            reason is not null ? new { reason } : null,
            ct);

    public Task<Intent> RejectAsync(string id, string reason, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<Intent>(
            $"/api/v1/intents/{Uri.EscapeDataString(id)}/reject",
            new { reason },
            ct);

    public Task<Intent> ExecuteAsync(string id, string chainId, string txHash, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<Intent>(
            $"/api/v1/intents/{Uri.EscapeDataString(id)}/execute",
            new { chainId, txHash },
            ct);

    public Task<Intent> VerifyAsync(string id, bool matched, IReadOnlyList<string>? discrepancies = null, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<Intent>(
            $"/api/v1/intents/{Uri.EscapeDataString(id)}/verify",
            new { matched, discrepancies },
            ct);
}

public sealed record DeclareIntentRequest
{
    public required string Id { get; init; }
    public required string Kind { get; init; }
    public required string Description { get; init; }
    public required Dictionary<string, object?> Params { get; init; }
    public string? EnvelopeId { get; init; }
}
