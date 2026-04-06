using System.Web;
using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class EventsClient
{
    private readonly AttestiaHttpClient _http;

    internal EventsClient(AttestiaHttpClient http) => _http = http;

    public Task<PaginatedList<StoredEvent>> ListAsync(int? afterPosition = null, string? cursor = null, int? limit = null, CancellationToken ct = default)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        if (afterPosition is not null) query["afterPosition"] = afterPosition.Value.ToString();
        if (cursor is not null) query["cursor"] = cursor;
        if (limit is not null) query["limit"] = limit.Value.ToString();

        var qs = query.ToString();
        var path = string.IsNullOrEmpty(qs) ? "/api/v1/events" : $"/api/v1/events?{qs}";
        return _http.GetAsync<PaginatedList<StoredEvent>>(path, ct);
    }

    public Task<PaginatedList<StoredEvent>> ListStreamAsync(string streamId, int? afterVersion = null, string? cursor = null, int? limit = null, CancellationToken ct = default)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        if (afterVersion is not null) query["afterVersion"] = afterVersion.Value.ToString();
        if (cursor is not null) query["cursor"] = cursor;
        if (limit is not null) query["limit"] = limit.Value.ToString();

        var qs = query.ToString();
        var path = $"/api/v1/events/{Uri.EscapeDataString(streamId)}";
        if (!string.IsNullOrEmpty(qs)) path += $"?{qs}";
        return _http.GetAsync<PaginatedList<StoredEvent>>(path, ct);
    }
}
