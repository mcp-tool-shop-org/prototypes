using Attestia.Core.Models;

namespace Attestia.Client;

public sealed class ProofsClient
{
    private readonly AttestiaHttpClient _http;

    internal ProofsClient(AttestiaHttpClient http) => _http = http;

    public Task<MerkleRootInfo> MerkleRootAsync(CancellationToken ct = default)
        => _http.GetEnvelopeAsync<MerkleRootInfo>("/api/v1/proofs/merkle-root", ct);

    public Task<AttestationProofPackage> GetAttestationAsync(string id, CancellationToken ct = default)
        => _http.GetEnvelopeAsync<AttestationProofPackage>(
            $"/api/v1/proofs/attestation/{Uri.EscapeDataString(id)}", ct);

    public Task<ProofVerificationResult> VerifyProofAsync(AttestationProofPackage package, CancellationToken ct = default)
        => _http.PostEnvelopeAsync<ProofVerificationResult>("/api/v1/proofs/verify", package, ct);
}
