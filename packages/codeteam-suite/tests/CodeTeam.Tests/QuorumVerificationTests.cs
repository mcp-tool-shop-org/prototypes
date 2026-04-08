using System.Security.Cryptography;
using System.Text;
using CodeTeam.Core;
using CodeTeam.Crypto;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Integration tests for quorum-based verification.
/// Tests the full verification pipeline with multi-signer policies.
/// </summary>
public class QuorumVerificationTests
{
    private readonly KeyFileData _key1;
    private readonly KeyFileData _key2;
    private readonly KeyFileData _key3;
    private readonly List<AuthorizedKey> _authorizedKeys;

    public QuorumVerificationTests()
    {
        // Generate deterministic test keys
        _key1 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("quorum-test-key-1")));
        _key2 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("quorum-test-key-2")));
        _key3 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("quorum-test-key-3")));

        _authorizedKeys = new List<AuthorizedKey>
        {
            new() { Id = _key1.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key1) },
            new() { Id = _key2.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key2) },
            new() { Id = _key3.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key3) }
        };
    }

    #region Basic Quorum Verification

    [Fact]
    public void QuorumVerification_SingleSignatureThreshold1_ShouldVerify()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest(); // Use computed digest to match manifest

        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key1, packageDigest)
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
        result.Summary.SignersMatched.Should().Be(1);
        result.Summary.SignersRequired.Should().Be(1);
        result.Summary.MatchedSignerIds.Should().Contain(_key1.Kid);
    }

    [Fact]
    public void QuorumVerification_TwoSignaturesThreshold2_ShouldVerify()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });

        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key1, packageDigest),
            CreateSignatureData(_key2, packageDigest)
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);
        var options = VerifierOptions.WithPolicy(policy, CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
        result.Summary.SignersMatched.Should().Be(2);
        result.Summary.SignersRequired.Should().Be(2);
        result.Summary.MatchedSignerIds.Should().HaveCount(2);
    }

    [Fact]
    public void QuorumVerification_OneSignatureThreshold2_ShouldBeUnsigned()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });

        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key1, packageDigest)
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);
        var options = VerifierOptions.WithPolicy(policy, CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_UNSIGNED);
        result.Summary.SignersMatched.Should().Be(1);
        result.Summary.SignersRequired.Should().Be(2);
        result.Errors.Should().Contain(e => e.Code == ErrorCode.SIGNATURE_QUORUM_NOT_MET);
    }

    [Fact]
    public void QuorumVerification_NoSignatures_ShouldBeUnsigned()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var input = CreateVerificationInput(manifest);
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_UNSIGNED);
        result.Summary.SignaturePresent.Should().BeFalse();
    }

    #endregion

    #region Duplicate Signer Tests

    [Fact]
    public void QuorumVerification_SameKeyTwice_ShouldCountOnlyOnce()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });

        // Same key signs twice
        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key1, packageDigest, "signer-1"),
            CreateSignatureData(_key1, packageDigest, "signer-2") // Duplicate
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);
        var options = VerifierOptions.WithPolicy(policy, CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_UNSIGNED, "duplicate signer should only count once");
        result.Summary.SignersMatched.Should().Be(1);
    }

    #endregion

    #region Legacy Policy Migration

    [Fact]
    public void QuorumVerification_LegacyPolicy_ShouldWorkWithApprovals()
    {
        // Arrange - use legacy required_approvals
        var manifest = CreateTestManifest(requiredApprovals: 1);
        var packageDigest = ComputeTestPackageDigest();

        var approvals = new List<ApprovalData>
        {
            CreateApprovalData(_key1, packageDigest)
        };

        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key2, packageDigest)
        };

        var input = CreateVerificationInput(manifest, approvals: approvals, signatures: signatures);
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
    }

    [Fact]
    public void QuorumVerification_LegacyPolicy_MissingApprovals_ShouldBeUnsigned()
    {
        // Arrange - requires 1 approval but has none
        var manifest = CreateTestManifest(requiredApprovals: 1);
        var packageDigest = ComputeTestPackageDigest();

        var signatures = new List<SignatureData>
        {
            CreateSignatureData(_key1, packageDigest)
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_UNSIGNED);
        result.Errors.Should().Contain(e => e.Code == ErrorCode.APPROVAL_QUORUM_NOT_MET);
    }

    #endregion

    #region Schema and Integrity Checks Still Work

    [Fact]
    public void QuorumVerification_NullManifest_ShouldFailSchema()
    {
        // Arrange
        var input = new VerificationInput
        {
            PackagePath = "/test/path",
            Manifest = null,
            ManifestJson = null,
            ArtifactFiles = new Dictionary<string, ArtifactFileInfo>(),
            EvidenceFiles = new Dictionary<string, ArtifactFileInfo>(),
            Approvals = Array.Empty<ApprovalData>(),
            Signatures = Array.Empty<SignatureData>()
        };
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_SCHEMA);
    }

    [Fact]
    public void QuorumVerification_WrongSchemaVersion_ShouldFailSchema()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var badManifest = manifest with { SchemaVersion = "99.0" };

        var input = CreateVerificationInput(badManifest);
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_SCHEMA);
    }

    [Fact]
    public void QuorumVerification_MissingArtifact_ShouldFailIntegrity()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var input = new VerificationInput
        {
            PackagePath = "/test/path",
            Manifest = manifest,
            ManifestJson = "{}",
            ArtifactFiles = new Dictionary<string, ArtifactFileInfo>
            {
                ["artifacts/code.cs"] = new ArtifactFileInfo
                {
                    Path = "artifacts/code.cs",
                    Exists = false,
                    SizeBytes = 0,
                    ActualDigest = ""
                }
            },
            EvidenceFiles = new Dictionary<string, ArtifactFileInfo>(),
            Approvals = Array.Empty<ApprovalData>(),
            Signatures = Array.Empty<SignatureData>()
        };
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_INTEGRITY);
    }

    #endregion

    #region Backward Compatibility

    [Fact]
    public void LegacyVerification_ShouldStillWork()
    {
        // Arrange - use legacy (non-quorum) verification with legacy format signatures
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        var signatures = new List<SignatureData>
        {
            CreateLegacySignatureData(_key1, packageDigest)
        };

        var input = CreateVerificationInput(manifest, signatures: signatures);

        // Use default options (no quorum) - uses legacy verification path
        var options = VerifierOptions.WithSignatureVerification(CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
        // Legacy mode doesn't populate quorum fields
        result.Summary.SignersMatched.Should().Be(0);
    }

    #endregion

    #region Format Separation Compatibility Tests

    /// <summary>
    /// Proves that legacy signatures work with legacy verifier.
    /// </summary>
    [Fact]
    public void FormatSeparation_LegacySignatureWithLegacyVerifier_ShouldPass()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        // Create signature with LEGACY format bytes
        var legacySig = CreateLegacySignatureData(_key1, packageDigest);
        var input = CreateVerificationInput(manifest, signatures: new List<SignatureData> { legacySig });

        // Use legacy verifier (no quorum)
        var options = VerifierOptions.WithSignatureVerification(CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert: Legacy signature validates with legacy verifier
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
    }

    /// <summary>
    /// Proves that legacy signatures do NOT work with envelope/quorum verifier.
    /// This is expected behavior - format must match.
    /// </summary>
    [Fact]
    public void FormatSeparation_LegacySignatureWithQuorumVerifier_ShouldFail()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        // Create signature with LEGACY format bytes
        var legacySig = CreateLegacySignatureData(_key1, packageDigest);
        var input = CreateVerificationInput(manifest, signatures: new List<SignatureData> { legacySig });

        // Use quorum verifier (expects envelope format)
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert: Legacy signature does NOT validate with quorum verifier
        // (quorum expects canonical JSON signables)
        result.Status.Should().Be(VerificationStatus.OK_UNSIGNED);
        result.Summary.SignersMatched.Should().Be(0);
    }

    /// <summary>
    /// Proves that envelope signatures work with quorum verifier.
    /// </summary>
    [Fact]
    public void FormatSeparation_EnvelopeSignatureWithQuorumVerifier_ShouldPass()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        // Create signature with ENVELOPE format bytes (canonical JSON)
        var envelopeSig = CreateSignatureData(_key1, packageDigest);
        var input = CreateVerificationInput(manifest, signatures: new List<SignatureData> { envelopeSig });

        // Use quorum verifier
        var options = CreateQuorumOptions();

        // Act
        var result = Verifier.Verify(input, options);

        // Assert: Envelope signature validates with quorum verifier
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
        result.Summary.SignersMatched.Should().Be(1);
    }

    /// <summary>
    /// Proves that envelope signatures do NOT work with legacy verifier.
    /// This is expected behavior - format must match.
    /// </summary>
    [Fact]
    public void FormatSeparation_EnvelopeSignatureWithLegacyVerifier_ShouldFail()
    {
        // Arrange
        var manifest = CreateTestManifest(requiredApprovals: 0);
        var packageDigest = ComputeTestPackageDigest();

        // Create signature with ENVELOPE format bytes (canonical JSON)
        var envelopeSig = CreateSignatureData(_key1, packageDigest);
        var input = CreateVerificationInput(manifest, signatures: new List<SignatureData> { envelopeSig });

        // Use legacy verifier (no quorum)
        var options = VerifierOptions.WithSignatureVerification(CreateSignatureVerifier());

        // Act
        var result = Verifier.Verify(input, options);

        // Assert: Envelope signature does NOT validate with legacy verifier
        // (legacy expects string format signables)
        result.Status.Should().Be(VerificationStatus.FAIL_SIGNATURE);
    }

    #endregion

    #region Helpers

    private ManifestData CreateTestManifest(int requiredApprovals)
    {
        return new ManifestData
        {
            SchemaVersion = "0.1",
            PackageVersion = "1.0.0",
            CreatedAt = "2025-01-01T00:00:00Z",
            Intent = "test",
            WorkspaceName = "test-workspace",
            Artifacts = new List<ArtifactData>
            {
                new()
                {
                    Path = "artifacts/code.cs",
                    ExpectedDigest = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    ExpectedSize = 100
                }
            },
            Evidence = Array.Empty<EvidenceData>(),
            Policy = new PolicyData
            {
                RequiredApprovals = requiredApprovals,
                AuthorizedKeys = _authorizedKeys
            }
        };
    }

    private VerificationInput CreateVerificationInput(
        ManifestData manifest,
        List<ApprovalData>? approvals = null,
        List<SignatureData>? signatures = null,
        string? manifestJson = null)
    {
        // Use a deterministic manifest JSON for consistent digest computation
        var json = manifestJson ?? CreateTestManifestJson();

        return new VerificationInput
        {
            PackagePath = "/test/path",
            Manifest = manifest,
            ManifestJson = json,
            ArtifactFiles = new Dictionary<string, ArtifactFileInfo>
            {
                ["artifacts/code.cs"] = new ArtifactFileInfo
                {
                    Path = "artifacts/code.cs",
                    Exists = true,
                    SizeBytes = 100,
                    ActualDigest = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                }
            },
            EvidenceFiles = new Dictionary<string, ArtifactFileInfo>(),
            Approvals = (IReadOnlyList<ApprovalData>?)approvals ?? Array.Empty<ApprovalData>(),
            Signatures = (IReadOnlyList<SignatureData>?)signatures ?? Array.Empty<SignatureData>()
        };
    }

    /// <summary>
    /// Create a deterministic manifest JSON for testing.
    /// </summary>
    private string CreateTestManifestJson()
    {
        return "{\"schema_version\":\"0.1\",\"package_version\":\"1.0.0\",\"created_at\":\"2025-01-01T00:00:00Z\",\"intent\":\"test\"}";
    }

    /// <summary>
    /// Compute the package digest from the test manifest JSON.
    /// </summary>
    private string ComputeTestPackageDigest()
    {
        var json = CreateTestManifestJson();
        var bytes = System.Text.Encoding.UTF8.GetBytes(json);
        var hash = System.Security.Cryptography.SHA256.HashData(bytes);
        return "sha256:" + Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>
    /// Create signature data using ENVELOPE format (canonical JSON signable).
    /// For use with quorum verification path.
    /// </summary>
    private SignatureData CreateSignatureData(KeyFileData key, string packageDigest, string role = "release-signer")
    {
        var signable = SignablePayloadBuilder.ForPackageAttestation(packageDigest, role);
        var signableBytes = SignablePayloadBuilder.GetSignableBytes(signable);
        var signature = KeyFile.SignToBase64(key, signableBytes);

        return new SignatureData
        {
            Type = "signature",
            PackageDigest = packageDigest,
            SignerId = key.Kid,
            Role = role,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Signature = signature
        };
    }

    /// <summary>
    /// Create signature data using LEGACY format (string-based signable).
    /// For use with legacy verification path.
    /// Format: "codeteam:signature:v0.1:{package_digest}:{signer_id}"
    /// </summary>
    private SignatureData CreateLegacySignatureData(KeyFileData key, string packageDigest, string role = "release-signer")
    {
        var signableBytes = SignableBytesResolver.GetLegacySignatureBytes(packageDigest, key.Kid);
        var signature = KeyFile.SignToBase64(key, signableBytes);

        return new SignatureData
        {
            Type = "signature",
            PackageDigest = packageDigest,
            SignerId = key.Kid,
            Role = role,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Signature = signature
        };
    }

    private ApprovalData CreateApprovalData(KeyFileData key, string packageDigest)
    {
        var signable = SignablePayloadBuilder.ForApproval(packageDigest, "reviewer");
        var signableBytes = SignablePayloadBuilder.GetSignableBytes(signable);
        var signature = KeyFile.SignToBase64(key, signableBytes);

        return new ApprovalData
        {
            Type = "approval",
            PackageDigest = packageDigest,
            ApproverId = key.Kid,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Comment = "Approved for testing",
            Signature = signature
        };
    }

    private VerifierOptions CreateQuorumOptions()
    {
        return VerifierOptions.WithQuorumPolicy(CreateSignatureVerifier());
    }

    private Func<string, byte[], string, bool> CreateSignatureVerifier()
    {
        var verifier = new Ed25519SignatureVerifier();
        return (publicKey, message, signature) => verifier.Verify(publicKey, message, signature);
    }

    #endregion
}
