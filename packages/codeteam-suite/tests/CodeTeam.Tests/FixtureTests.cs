using System.Text.Json;
using CodeTeam.Core;
using CodeTeam.Crypto;
using CodeTeam.Packaging;
using FluentAssertions;
using NSec.Cryptography;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests verification against golden fixtures.
/// These tests validate that implementations match VERIFICATION.md v0.1 requirements.
/// </summary>
public class FixtureTests
{
    private static readonly string FixturesPath = Path.Combine(
        AppContext.BaseDirectory, "fixtures");

    [Theory]
    [InlineData("minimal_unsigned", VerificationStatus.OK_UNSIGNED)]
    [InlineData("approved_threshold_met", VerificationStatus.OK_UNSIGNED)]
    [InlineData("signed_verified", VerificationStatus.OK_VERIFIED)]
    [InlineData("tampered_artifact", VerificationStatus.FAIL_INTEGRITY)]
    [InlineData("invalid_manifest", VerificationStatus.FAIL_SCHEMA)]
    public async Task Fixture_ShouldMatchExpectedStatus(string fixtureName, VerificationStatus expectedStatus)
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, fixtureName);

        // Act - run actual verification
        var result = await VerifyPackageAsync(fixturePath);

        // Assert
        result.Status.Should().Be(expectedStatus, $"Fixture '{fixtureName}' should have status {expectedStatus}");
        result.ExitCode.Should().Be((int)expectedStatus, $"Exit code should match status");
    }

    [Theory]
    [InlineData("minimal_unsigned", VerificationStatus.OK_UNSIGNED)]
    [InlineData("approved_threshold_met", VerificationStatus.OK_UNSIGNED)]
    [InlineData("signed_verified", VerificationStatus.OK_VERIFIED)]
    [InlineData("tampered_artifact", VerificationStatus.FAIL_INTEGRITY)]
    [InlineData("invalid_manifest", VerificationStatus.FAIL_SCHEMA)]
    public async Task Fixture_ExpectedJsonShouldMatchStatus(string fixtureName, VerificationStatus expectedStatus)
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var expectedPath = Path.Combine(fixturePath, "expected.verify.json");

        // Act
        var expectedJson = await File.ReadAllTextAsync(expectedPath);
        var expected = JsonSerializer.Deserialize<ExpectedVerifyResult>(expectedJson, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        // Assert
        expected.Should().NotBeNull();
        expected!.Status.Should().Be(expectedStatus.ToString());
        expected.ExitCode.Should().Be((int)expectedStatus);
    }

    [Fact]
    public void AllFixtures_ShouldExist()
    {
        var requiredFixtures = new[]
        {
            "minimal_unsigned",
            "approved_threshold_met",
            "signed_verified",
            "tampered_artifact",
            "invalid_manifest"
        };

        foreach (var fixture in requiredFixtures)
        {
            var path = Path.Combine(FixturesPath, fixture);
            Directory.Exists(path).Should().BeTrue($"Fixture '{fixture}' should exist");

            var manifestPath = Path.Combine(path, "codeteam.manifest.json");
            File.Exists(manifestPath).Should().BeTrue($"Fixture '{fixture}' should have manifest");

            var expectedPath = Path.Combine(path, "expected.verify.json");
            File.Exists(expectedPath).Should().BeTrue($"Fixture '{fixture}' should have expected output");
        }
    }

    [Fact]
    public async Task TamperedArtifact_ShouldReportDigestMismatch()
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, "tampered_artifact");

        // Act
        var result = await VerifyPackageAsync(fixturePath);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_INTEGRITY);
        result.Errors.Should().ContainSingle(e => e.Code == ErrorCode.SIZE_MISMATCH || e.Code == ErrorCode.DIGEST_MISMATCH);
    }

    [Fact]
    public async Task InvalidManifest_ShouldReportSchemaInvalid()
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, "invalid_manifest");

        // Act
        var result = await VerifyPackageAsync(fixturePath);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_SCHEMA);
        result.Errors.Should().ContainSingle(e => e.Code == ErrorCode.SCHEMA_INVALID);
    }

    [Fact]
    public async Task Verification_ShouldBeDeterministic()
    {
        // Run the same verification twice and ensure identical results
        var fixturePath = Path.Combine(FixturesPath, "minimal_unsigned");

        var result1 = await VerifyPackageAsync(fixturePath);
        var result2 = await VerifyPackageAsync(fixturePath);

        result1.Status.Should().Be(result2.Status);
        result1.ExitCode.Should().Be(result2.ExitCode);
        result1.Summary.ArtifactsCount.Should().Be(result2.Summary.ArtifactsCount);
        result1.Summary.EvidenceCount.Should().Be(result2.Summary.EvidenceCount);
    }

    /// <summary>
    /// Helper to run verification on a fixture
    /// </summary>
    private static async Task<VerificationResult> VerifyPackageAsync(string fixturePath)
    {
        using var reader = new DirectoryPackageReader(fixturePath);
        var loader = new PackageLoaderImpl(reader);
        var digestComputer = new Sha256DigestComputer();

        // Load manifest
        var manifest = await loader.LoadManifestAsync(fixturePath);
        string? manifestJson = null;
        ManifestData? manifestData = null;

        if (reader.FileExists(PackageConstants.ManifestPath))
        {
            manifestJson = reader.ReadAllText(PackageConstants.ManifestPath);
            if (manifest is not null)
            {
                manifestData = MapToManifestData(manifest);
            }
        }

        // Compute artifact hashes
        var artifactFiles = new Dictionary<string, ArtifactFileInfo>();
        var evidenceFiles = new Dictionary<string, ArtifactFileInfo>();

        if (manifestData is not null)
        {
            foreach (var artifact in manifestData.Artifacts)
            {
                artifactFiles[artifact.Path] = GetArtifactFileInfo(reader, artifact.Path, digestComputer);
            }

            foreach (var evidence in manifestData.Evidence)
            {
                evidenceFiles[evidence.Path] = GetArtifactFileInfo(reader, evidence.Path, digestComputer);
            }
        }

        // Load approvals and signatures
        var approvals = await loader.LoadApprovalsAsync(fixturePath);
        var signatures = await loader.LoadSignaturesAsync(fixturePath);

        var input = new VerificationInput
        {
            PackagePath = fixturePath,
            Manifest = manifestData,
            ManifestJson = manifestJson,
            ArtifactFiles = artifactFiles,
            EvidenceFiles = evidenceFiles,
            Approvals = approvals.Select(MapToApprovalData).ToList(),
            Signatures = signatures.Select(MapToSignatureData).ToList()
        };

        return Verifier.Verify(input);
    }

    private static ArtifactFileInfo GetArtifactFileInfo(IPackageReader reader, string path, Sha256DigestComputer digestComputer)
    {
        if (!reader.FileExists(path))
        {
            return new ArtifactFileInfo
            {
                Path = path,
                Exists = false,
                SizeBytes = -1,
                ActualDigest = ""
            };
        }

        var size = reader.GetFileSize(path);
        var bytes = reader.ReadAllBytes(path);
        var digest = digestComputer.ComputeDigest(bytes);

        return new ArtifactFileInfo
        {
            Path = path,
            Exists = true,
            SizeBytes = size,
            ActualDigest = digest
        };
    }

    private static ManifestData MapToManifestData(PackageManifest m)
    {
        return new ManifestData
        {
            SchemaVersion = m.SchemaVersion,
            PackageVersion = m.PackageVersion,
            CreatedAt = m.CreatedAt,
            Intent = m.Intent,
            WorkspaceName = m.Workspace.Name,
            Artifacts = m.Artifacts.Select(a => new ArtifactData
            {
                Path = a.Path,
                ExpectedDigest = a.Sha256,
                ExpectedSize = a.SizeBytes
            }).ToList(),
            Evidence = m.Evidence.Select(e => new EvidenceData
            {
                Path = e.Path,
                ExpectedDigest = e.Sha256,
                ExpectedSize = e.SizeBytes,
                Category = e.Category
            }).ToList(),
            Policy = new PolicyData
            {
                RequiredApprovals = m.Policy.RequiredApprovals,
                AuthorizedKeys = m.Policy.ApproverKeys.Select(k => new AuthorizedKey
                {
                    Id = k.Id,
                    Algorithm = k.Algorithm,
                    PublicKey = k.PublicKey,
                    Name = k.Name
                }).ToList()
            }
        };
    }

    private static ApprovalData MapToApprovalData(ApprovalRecord r)
    {
        return new ApprovalData
        {
            Type = r.Type,
            PackageDigest = r.PackageDigest,
            ApproverId = r.ApproverId,
            Timestamp = r.Ts,
            Comment = r.Comment,
            Signature = r.Signature
        };
    }

    private static SignatureData MapToSignatureData(SignatureRecord r)
    {
        return new SignatureData
        {
            Type = r.Type,
            PackageDigest = r.PackageDigest,
            SignerId = r.SignerId,
            Role = r.Role,
            Timestamp = r.Ts,
            Signature = r.Signature
        };
    }

    private sealed record ExpectedVerifyResult
    {
        public required string Status { get; init; }
        public required int ExitCode { get; init; }
    }

    #region Real Ed25519 Signature Tests

    /// <summary>
    /// Test fixtures with real Ed25519 signatures.
    /// These require actual cryptographic verification.
    /// </summary>
    [Theory]
    [InlineData("signed_verified_real", VerificationStatus.OK_VERIFIED)]
    [InlineData("signed_invalid_sig", VerificationStatus.FAIL_SIGNATURE)]
    public async Task RealSignatureFixture_ShouldMatchExpectedStatus(string fixtureName, VerificationStatus expectedStatus)
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, fixtureName);

        // Act - run verification with real Ed25519 verification
        var result = await VerifyPackageWithRealSignaturesAsync(fixturePath);

        // Assert
        result.Status.Should().Be(expectedStatus, $"Fixture '{fixtureName}' should have status {expectedStatus}");
        result.ExitCode.Should().Be((int)expectedStatus, $"Exit code should match status");
    }

    [Fact]
    public async Task RealSignatureFixture_SignedVerifiedReal_ShouldHaveValidSignature()
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, "signed_verified_real");

        // Act
        var result = await VerifyPackageWithRealSignaturesAsync(fixturePath);

        // Assert
        result.Status.Should().Be(VerificationStatus.OK_VERIFIED);
        result.Summary.SignaturePresent.Should().BeTrue();
        result.Summary.SignatureValid.Should().BeTrue();
        result.Summary.SignerId.Should().Be("5ce7f1664c271688");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task RealSignatureFixture_SignedInvalidSig_ShouldFailSignatureVerification()
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, "signed_invalid_sig");

        // Act
        var result = await VerifyPackageWithRealSignaturesAsync(fixturePath);

        // Assert
        result.Status.Should().Be(VerificationStatus.FAIL_SIGNATURE);
        result.Summary.SignaturePresent.Should().BeTrue();
        result.Summary.SignatureValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == ErrorCode.SIGNATURE_INVALID);
    }

    [Fact]
    public void RealSignatureFixtures_ShouldExist()
    {
        var requiredFixtures = new[]
        {
            "signed_verified_real",
            "signed_invalid_sig"
        };

        foreach (var fixture in requiredFixtures)
        {
            var path = Path.Combine(FixturesPath, fixture);
            Directory.Exists(path).Should().BeTrue($"Fixture '{fixture}' should exist");

            var manifestPath = Path.Combine(path, "codeteam.manifest.json");
            File.Exists(manifestPath).Should().BeTrue($"Fixture '{fixture}' should have manifest");

            var expectedPath = Path.Combine(path, "expected.verify.json");
            File.Exists(expectedPath).Should().BeTrue($"Fixture '{fixture}' should have expected output");

            var signaturesPath = Path.Combine(path, "signatures", "signatures.jsonl");
            File.Exists(signaturesPath).Should().BeTrue($"Fixture '{fixture}' should have signatures");
        }
    }

    /// <summary>
    /// Helper to run verification with real Ed25519 signature verification
    /// </summary>
    private static async Task<VerificationResult> VerifyPackageWithRealSignaturesAsync(string fixturePath)
    {
        using var reader = new DirectoryPackageReader(fixturePath);
        var loader = new PackageLoaderImpl(reader);
        var digestComputer = new Sha256DigestComputer();

        // Load manifest
        var manifest = await loader.LoadManifestAsync(fixturePath);
        string? manifestJson = null;
        ManifestData? manifestData = null;

        if (reader.FileExists(PackageConstants.ManifestPath))
        {
            manifestJson = reader.ReadAllText(PackageConstants.ManifestPath);
            if (manifest is not null)
            {
                manifestData = MapToManifestData(manifest);
            }
        }

        // Compute artifact hashes
        var artifactFiles = new Dictionary<string, ArtifactFileInfo>();
        var evidenceFiles = new Dictionary<string, ArtifactFileInfo>();

        if (manifestData is not null)
        {
            foreach (var artifact in manifestData.Artifacts)
            {
                artifactFiles[artifact.Path] = GetArtifactFileInfo(reader, artifact.Path, digestComputer);
            }

            foreach (var evidence in manifestData.Evidence)
            {
                evidenceFiles[evidence.Path] = GetArtifactFileInfo(reader, evidence.Path, digestComputer);
            }
        }

        // Load approvals and signatures
        var approvals = await loader.LoadApprovalsAsync(fixturePath);
        var signatures = await loader.LoadSignaturesAsync(fixturePath);

        var input = new VerificationInput
        {
            PackagePath = fixturePath,
            Manifest = manifestData,
            ManifestJson = manifestJson,
            ArtifactFiles = artifactFiles,
            EvidenceFiles = evidenceFiles,
            Approvals = approvals.Select(MapToApprovalData).ToList(),
            Signatures = signatures.Select(MapToSignatureData).ToList()
        };

        // Use real Ed25519 signature verification
        var signatureVerifier = new Ed25519SignatureVerifier();
        var options = VerifierOptions.WithSignatureVerification(
            (publicKey, message, signature) => signatureVerifier.Verify(publicKey, message, signature));

        return Verifier.Verify(input, options);
    }

    #endregion
}
