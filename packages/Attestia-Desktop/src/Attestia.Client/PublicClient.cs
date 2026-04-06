using System.Text.Json;
using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class PublicClient
{
    private readonly AttestiaHttpClient _http;

    internal PublicClient(AttestiaHttpClient http) => _http = http;

    public Task<JsonDocument> GetStateBundleAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<JsonDocument>("/public/v1/verify/state-bundle", ct);

    public Task<SubmitReportResponse> SubmitReportAsync(VerifierReport report, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<SubmitReportResponse>("/public/v1/verify/submit-report", report, ct);

    public Task<PaginatedList<VerifierReport>> ListReportsAsync(string? cursor = null, int? limit = null, CancellationToken ct = default)
    {
        var query = System.Web.HttpUtility.ParseQueryString(string.Empty);
        if (cursor is not null) query["cursor"] = cursor;
        if (limit is not null) query["limit"] = limit.Value.ToString();

        var qs = query.ToString();
        var path = string.IsNullOrEmpty(qs) ? "/public/v1/verify/reports" : $"/public/v1/verify/reports?{qs}";
        return _http.GetAsync<PaginatedList<VerifierReport>>(path, ct);
    }

    public Task<ConsensusResult> GetConsensusAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<ConsensusResult>("/public/v1/verify/consensus", ct);

    public Task<ProofVerificationResult> VerifyProofAsync(AttestationProofPackage package, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<ProofVerificationResult>("/public/v1/proofs/verify", package, ct);

    public Task<IReadOnlyList<ComplianceSummary>> GetComplianceSummaryAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<IReadOnlyList<ComplianceSummary>>("/public/v1/compliance/summary", ct);
}

public sealed record SubmitReportResponse
{
    public required string ReportId { get; init; }
    public required bool Accepted { get; init; }
    public required int TotalReports { get; init; }
}

public sealed record ComplianceSummary
{
    public required ComplianceFramework Framework { get; init; }
    public required int TotalControls { get; init; }
    public required int ImplementedControls { get; init; }
    public required double Score { get; init; }
    public required string GeneratedAt { get; init; }
}
