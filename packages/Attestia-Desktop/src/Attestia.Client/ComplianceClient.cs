using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class ComplianceClient
{
    private readonly AttestiaHttpClient _http;

    internal ComplianceClient(AttestiaHttpClient http) => _http = http;

    public Task<IReadOnlyList<ComplianceFramework>> ListFrameworksAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<IReadOnlyList<ComplianceFramework>>("/api/v1/compliance/frameworks", ct);

    public Task<ComplianceReport> GetReportAsync(string frameworkId, CancellationToken ct = default)
        => _http.GetEnvelopeAsync<ComplianceReport>(
            $"/api/v1/compliance/report/{Uri.EscapeDataString(frameworkId)}", ct);
}
