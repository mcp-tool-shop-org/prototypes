using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CodeTeam.Core;
using CodeTeam.Crypto;
using CodeTeam.Packaging;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Round-trip integration tests for approve → sign → verify workflow.
/// These tests verify the complete trust loop is deterministic and schema-valid.
/// </summary>
public class RoundTripTests : IDisposable
{
    private readonly string _tempDir;
    private readonly string _approverKeyPath;
    private readonly string _signerKeyPath;
    private readonly KeyFileData _approverKey;
    private readonly KeyFileData _signerKey;

    public RoundTripTests()
    {
        // Create temp directory for test artifacts
        _tempDir = Path.Combine(Path.GetTempPath(), $"codeteam-test-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);

        // Generate deterministic test keys
        var approverSeed = SHA256.HashData(Encoding.UTF8.GetBytes("codeteam-test-approver-roundtrip"));
        var signerSeed = SHA256.HashData(Encoding.UTF8.GetBytes("codeteam-test-signer-roundtrip"));

        _approverKey = KeyFile.GenerateFromSeed(approverSeed);
        _signerKey = KeyFile.GenerateFromSeed(signerSeed);

        _approverKeyPath = Path.Combine(_tempDir, "approver.key.json");
        _signerKeyPath = Path.Combine(_tempDir, "signer.key.json");

        KeyFile.Save(_approverKey, _approverKeyPath);
        KeyFile.Save(_signerKey, _signerKeyPath);
    }

    public void Dispose()
    {
        // Clean up temp directory
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, true);
        }
    }

    #region Core Round-Trip Tests

    [Fact]
    public async Task ApproveSignVerify_ShouldProduceValidSignatures()
    {
        // Arrange: Create a test package
        var packagePath = CreateTestPackage("roundtrip-test");

        // Act: Approve the package
        var approvalPath = Path.Combine(_tempDir, "approval.json");
        var (approveExitCode, approveStdout, _) = await RunCliAsync(
            $"approve \"{packagePath}\" --key \"{_approverKeyPath}\" --role reviewer --out \"{approvalPath}\"");

        approveExitCode.Should().Be(0, "approve command should succeed");

        // Act: Sign the package
        var signaturePath = Path.Combine(_tempDir, "signature.json");
        var (signExitCode, signStdout, _) = await RunCliAsync(
            $"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role release-signer --out \"{signaturePath}\"");

        signExitCode.Should().Be(0, "sign command should succeed");

        // Assert: Verify the signatures are valid
        var approvalJson = await File.ReadAllTextAsync(approvalPath);
        var signatureJson = await File.ReadAllTextAsync(signaturePath);

        // Parse and verify approval
        var approval = JsonSerializer.Deserialize<ApprovalEnvelope>(approvalJson, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });
        approval.Should().NotBeNull();
        approval!.Algorithm.Should().Be("ed25519");
        approval.Signable.Purpose.Should().Be("codeteam.approval");

        // Parse and verify signature
        var signature = JsonSerializer.Deserialize<SignatureEnvelope>(signatureJson, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });
        signature.Should().NotBeNull();
        signature!.Algorithm.Should().Be("ed25519");
        signature.Signable.Purpose.Should().Be("codeteam.package_attestation");

        // Both should bind to the same package digest
        approval.Signable.PackageDigest.Should().Be(signature.Signable.PackageDigest);
    }

    [Fact]
    public async Task SignatureVerification_ShouldBeValidWithEd25519()
    {
        // Arrange
        var packagePath = CreateTestPackage("verify-sig-test");

        // Act: Sign the package
        var signaturePath = Path.Combine(_tempDir, "signature.json");
        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role release-signer --out \"{signaturePath}\"");

        // Parse the signature
        var signatureJson = await File.ReadAllTextAsync(signaturePath);
        var envelope = JsonSerializer.Deserialize<SignatureEnvelope>(signatureJson, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        // Recreate the signable bytes
        var signableBytes = SignablePayloadBuilder.GetSignableBytes(envelope!.Signable);

        // Verify with our Ed25519 verifier
        var verifier = new Ed25519SignatureVerifier();
        var isValid = verifier.Verify(envelope.PublicKey, signableBytes, envelope.Signature);

        isValid.Should().BeTrue("signature should verify cryptographically");
    }

    [Fact]
    public async Task SamePackage_ShouldProduceSameDigest()
    {
        // Arrange
        var packagePath = CreateTestPackage("digest-stability-test");

        // Act: Sign twice
        var sig1Path = Path.Combine(_tempDir, "sig1.json");
        var sig2Path = Path.Combine(_tempDir, "sig2.json");

        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role signer --out \"{sig1Path}\"");
        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role signer --out \"{sig2Path}\"");

        // Parse both
        var sig1 = JsonSerializer.Deserialize<SignatureEnvelope>(await File.ReadAllTextAsync(sig1Path),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        var sig2 = JsonSerializer.Deserialize<SignatureEnvelope>(await File.ReadAllTextAsync(sig2Path),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        // Assert: Same package digest
        sig1!.Signable.PackageDigest.Should().Be(sig2!.Signable.PackageDigest);

        // Same signature (deterministic)
        sig1.Signature.Should().Be(sig2.Signature);
    }

    #endregion

    #region Tamper Detection Tests

    [Fact]
    public async Task TamperedPackage_ShouldProduceDifferentDigest()
    {
        // Arrange: Create and sign a package
        var packagePath = CreateTestPackage("tamper-test");

        var originalSigPath = Path.Combine(_tempDir, "original-sig.json");
        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role signer --out \"{originalSigPath}\"");

        var originalSig = JsonSerializer.Deserialize<SignatureEnvelope>(await File.ReadAllTextAsync(originalSigPath),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        // Act: Tamper with the artifact
        var artifactPath = Path.Combine(packagePath, "artifacts", "hello.txt");
        await File.AppendAllTextAsync(artifactPath, " tampered!");

        // Sign again
        var tamperedSigPath = Path.Combine(_tempDir, "tampered-sig.json");
        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role signer --out \"{tamperedSigPath}\"");

        var tamperedSig = JsonSerializer.Deserialize<SignatureEnvelope>(await File.ReadAllTextAsync(tamperedSigPath),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        // Assert: Different digest and signature
        tamperedSig!.Signable.PackageDigest.Should().NotBe(originalSig!.Signable.PackageDigest);
        tamperedSig.Signature.Should().NotBe(originalSig.Signature);
    }

    #endregion

    #region Purpose Separation Tests

    [Fact]
    public async Task ApprovalAndSignature_ShouldHaveDifferentPurposes()
    {
        // Arrange
        var packagePath = CreateTestPackage("purpose-test");

        var approvalPath = Path.Combine(_tempDir, "approval.json");
        var signaturePath = Path.Combine(_tempDir, "signature.json");

        // Act
        await RunCliAsync($"approve \"{packagePath}\" --key \"{_approverKeyPath}\" --role reviewer --out \"{approvalPath}\"");
        await RunCliAsync($"sign \"{packagePath}\" --key \"{_signerKeyPath}\" --role signer --out \"{signaturePath}\"");

        // Parse
        var approval = JsonSerializer.Deserialize<ApprovalEnvelope>(await File.ReadAllTextAsync(approvalPath),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        var signature = JsonSerializer.Deserialize<SignatureEnvelope>(await File.ReadAllTextAsync(signaturePath),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        // Assert: Different purposes (prevents cross-protocol replay)
        approval!.Signable.Purpose.Should().Be("codeteam.approval");
        signature!.Signable.Purpose.Should().Be("codeteam.package_attestation");

        // Different signable bytes (even with same package digest)
        var approvalBytes = SignablePayloadBuilder.GetSignableBytes(approval.Signable);
        var signatureBytes = SignablePayloadBuilder.GetSignableBytes(signature.Signable);
        approvalBytes.Should().NotEqual(signatureBytes);
    }

    #endregion

    #region CLI Output Format Tests

    [Fact]
    public async Task KeygenOutput_ShouldBeValidKeyFile()
    {
        var keyPath = Path.Combine(_tempDir, "new-key.json");

        var (exitCode, _, _) = await RunCliAsync($"keygen --out \"{keyPath}\"");

        exitCode.Should().Be(0);

        var keyJson = await File.ReadAllTextAsync(keyPath);
        var key = KeyFile.Parse(keyJson);

        key.Kty.Should().Be("OKP");
        key.Crv.Should().Be("Ed25519");
        key.Kid.Should().MatchRegex("^[0-9a-f]{16}$");
    }

    [Fact]
    public async Task ApproveWithComment_ShouldIncludeComment()
    {
        var packagePath = CreateTestPackage("comment-test");
        var approvalPath = Path.Combine(_tempDir, "approval.json");

        await RunCliAsync($"approve \"{packagePath}\" --key \"{_approverKeyPath}\" --comment \"LGTM!\" --out \"{approvalPath}\"");

        var approval = JsonSerializer.Deserialize<ApprovalEnvelope>(await File.ReadAllTextAsync(approvalPath),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        approval!.Comment.Should().Be("LGTM!");
    }

    #endregion

    #region Helpers

    private string CreateTestPackage(string name)
    {
        var packagePath = Path.Combine(_tempDir, name);
        Directory.CreateDirectory(packagePath);
        Directory.CreateDirectory(Path.Combine(packagePath, "artifacts"));

        // Create a simple artifact
        var artifactContent = "Hello, World!\n";
        var artifactPath = Path.Combine(packagePath, "artifacts", "hello.txt");
        File.WriteAllText(artifactPath, artifactContent);

        // Compute artifact hash
        var artifactBytes = Encoding.UTF8.GetBytes(artifactContent);
        var artifactHash = SHA256.HashData(artifactBytes);
        var artifactDigest = "sha256:" + Convert.ToHexString(artifactHash).ToLowerInvariant();

        // Create manifest with our test keys as authorized
        var manifest = new
        {
            schema_version = "0.1",
            package_version = "1.0.0",
            created_at = "2026-01-30T12:00:00Z",
            intent = "release",
            workspace = new { name = name },
            artifacts = new[]
            {
                new
                {
                    path = "artifacts/hello.txt",
                    sha256 = artifactDigest,
                    size_bytes = artifactBytes.Length
                }
            },
            evidence = Array.Empty<object>(),
            policy = new
            {
                required_approvals = 1,
                approver_keys = new[]
                {
                    new
                    {
                        id = _approverKey.Kid,
                        algorithm = "ed25519",
                        public_key = KeyFile.GetPublicKeyBase64(_approverKey),
                        name = "Test Approver"
                    },
                    new
                    {
                        id = _signerKey.Kid,
                        algorithm = "ed25519",
                        public_key = KeyFile.GetPublicKeyBase64(_signerKey),
                        name = "Test Signer"
                    }
                }
            }
        };

        var manifestJson = JsonSerializer.Serialize(manifest, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = true
        });
        File.WriteAllText(Path.Combine(packagePath, "codeteam.manifest.json"), manifestJson);

        return packagePath;
    }

    private static async Task<(int exitCode, string stdout, string stderr)> RunCliAsync(string arguments)
    {
        var cliPath = Path.Combine(AppContext.BaseDirectory, "codeteam.dll");

        var psi = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"\"{cliPath}\" {arguments}",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi)!;
        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return (process.ExitCode, stdout, stderr);
    }

    #endregion
}
