using System.Text.Json;
using CodeTeam.Core;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests for signable payload structures per CodeTeam Signature Spec v0.1.
/// </summary>
public class SignablePayloadTests
{
    private const string TestPackageDigest = "sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1";

    #region Payload Builder Tests

    [Fact]
    public void ForPackageAttestation_ShouldCreateValidPayload()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "release-signer");

        payload.SignableVersion.Should().Be("0.1");
        payload.Purpose.Should().Be("codeteam.package_attestation");
        payload.PackageDigest.Should().Be(TestPackageDigest);
        payload.SchemaVersion.Should().Be("0.1");
        payload.Claims.Role.Should().Be("release-signer");
        payload.Claims.Scope.Should().Be("package");
    }

    [Fact]
    public void ForApproval_ShouldCreateValidPayload()
    {
        var payload = SignablePayloadBuilder.ForApproval(
            TestPackageDigest,
            role: "reviewer");

        payload.SignableVersion.Should().Be("0.1");
        payload.Purpose.Should().Be("codeteam.approval");
        payload.PackageDigest.Should().Be(TestPackageDigest);
        payload.SchemaVersion.Should().Be("0.1");
        payload.Claims.Role.Should().Be("reviewer");
        payload.Claims.Scope.Should().Be("package");
    }

    [Fact]
    public void ForPackageAttestation_WithCustomSchemaVersion_ShouldUseIt()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer",
            schemaVersion: "1.0");

        payload.SchemaVersion.Should().Be("1.0");
    }

    #endregion

    #region Signable Bytes Tests

    [Fact]
    public void GetSignableBytes_ShouldReturnUtf8Bytes()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer");

        var bytes = SignablePayloadBuilder.GetSignableBytes(payload);
        var json = System.Text.Encoding.UTF8.GetString(bytes);

        // Should be valid JSON
        var action = () => JsonDocument.Parse(json);
        action.Should().NotThrow();
    }

    [Fact]
    public void GetSignableBytes_SameInput_ShouldProduceIdenticalBytes()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer");

        var bytes1 = SignablePayloadBuilder.GetSignableBytes(payload);
        var bytes2 = SignablePayloadBuilder.GetSignableBytes(payload);

        bytes1.Should().Equal(bytes2);
    }

    [Fact]
    public void GetSignableBytes_DifferentPurpose_ShouldProduceDifferentBytes()
    {
        var payload1 = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer");

        var payload2 = SignablePayloadBuilder.ForApproval(
            TestPackageDigest,
            role: "signer");

        var bytes1 = SignablePayloadBuilder.GetSignableBytes(payload1);
        var bytes2 = SignablePayloadBuilder.GetSignableBytes(payload2);

        bytes1.Should().NotEqual(bytes2);
    }

    [Fact]
    public void GetSignableBytes_DifferentDigest_ShouldProduceDifferentBytes()
    {
        var payload1 = SignablePayloadBuilder.ForPackageAttestation(
            "sha256:aaaa",
            role: "signer");

        var payload2 = SignablePayloadBuilder.ForPackageAttestation(
            "sha256:bbbb",
            role: "signer");

        var bytes1 = SignablePayloadBuilder.GetSignableBytes(payload1);
        var bytes2 = SignablePayloadBuilder.GetSignableBytes(payload2);

        bytes1.Should().NotEqual(bytes2);
    }

    #endregion

    #region Canonical JSON Tests

    [Fact]
    public void GetCanonicalJson_ShouldBeMinimal()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer");

        var json = SignablePayloadBuilder.GetCanonicalJson(payload);

        // No whitespace
        json.Should().NotContain("\n");
        json.Should().NotContain("  ");
    }

    [Fact]
    public void GetCanonicalJson_ShouldHaveSortedKeys()
    {
        var payload = SignablePayloadBuilder.ForPackageAttestation(
            TestPackageDigest,
            role: "signer");

        var json = SignablePayloadBuilder.GetCanonicalJson(payload);

        // Keys should be in alphabetical order
        // claims < package_digest < purpose < schema_version < signable_version
        var claimsIndex = json.IndexOf("\"claims\"");
        var digestIndex = json.IndexOf("\"package_digest\"");
        var purposeIndex = json.IndexOf("\"purpose\"");
        var schemaIndex = json.IndexOf("\"schema_version\"");
        var versionIndex = json.IndexOf("\"signable_version\"");

        claimsIndex.Should().BeLessThan(digestIndex);
        digestIndex.Should().BeLessThan(purposeIndex);
        purposeIndex.Should().BeLessThan(schemaIndex);
        schemaIndex.Should().BeLessThan(versionIndex);
    }

    [Fact]
    public void GetCanonicalJson_KnownInput_ShouldProduceExpectedOutput()
    {
        var payload = new SignablePayload
        {
            SignableVersion = "0.1",
            Purpose = "codeteam.package_attestation",
            PackageDigest = "sha256:test",
            SchemaVersion = "0.1",
            Claims = new SignableClaims
            {
                Role = "signer",
                Scope = "package"
            }
        };

        var json = SignablePayloadBuilder.GetCanonicalJson(payload);

        // Exact expected canonical JSON
        var expected = """{"claims":{"role":"signer","scope":"package"},"package_digest":"sha256:test","purpose":"codeteam.package_attestation","schema_version":"0.1","signable_version":"0.1"}""";

        json.Should().Be(expected);
    }

    #endregion

    #region Purpose Validation Tests

    [Fact]
    public void Purpose_ShouldPreventCrossProtocolReplay()
    {
        // If you sign an approval, you can't use it as an attestation
        var approval = SignablePayloadBuilder.ForApproval(TestPackageDigest, "reviewer");
        var attestation = SignablePayloadBuilder.ForPackageAttestation(TestPackageDigest, "reviewer");

        var approvalBytes = SignablePayloadBuilder.GetSignableBytes(approval);
        var attestationBytes = SignablePayloadBuilder.GetSignableBytes(attestation);

        // Even with same digest and role, the purpose field makes them different
        approvalBytes.Should().NotEqual(attestationBytes);

        // Verify by checking the JSON directly
        var approvalJson = SignablePayloadBuilder.GetCanonicalJson(approval);
        var attestationJson = SignablePayloadBuilder.GetCanonicalJson(attestation);

        approvalJson.Should().Contain("codeteam.approval");
        attestationJson.Should().Contain("codeteam.package_attestation");
    }

    #endregion

    #region Envelope Structure Tests

    [Fact]
    public void SignatureEnvelope_ShouldSerializeCorrectly()
    {
        var signable = SignablePayloadBuilder.ForPackageAttestation(TestPackageDigest, "signer");

        var envelope = new SignatureEnvelope
        {
            SchemaVersion = "0.1",
            Algorithm = "ed25519",
            KeyId = "kid:test123",
            PublicKey = "base64pubkey",
            Signature = "base64signature",
            Signable = signable,
            CreatedAt = "2026-01-30T12:00:00Z"
        };

        var json = JsonSerializer.Serialize(envelope, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = false
        });

        json.Should().Contain("\"schema_version\":\"0.1\"");
        json.Should().Contain("\"algorithm\":\"ed25519\"");
        json.Should().Contain("\"key_id\":\"kid:test123\"");
        json.Should().Contain("\"signable\":");
        json.Should().Contain("\"created_at\":\"2026-01-30T12:00:00Z\"");
    }

    [Fact]
    public void ApprovalEnvelope_ShouldIncludeOptionalComment()
    {
        var signable = SignablePayloadBuilder.ForApproval(TestPackageDigest, "reviewer");

        var envelope = new ApprovalEnvelope
        {
            SchemaVersion = "0.1",
            Algorithm = "ed25519",
            KeyId = "kid:approver1",
            PublicKey = "base64pubkey",
            Signature = "base64signature",
            Signable = signable,
            CreatedAt = "2026-01-30T12:00:00Z",
            Comment = "LGTM!"
        };

        var json = JsonSerializer.Serialize(envelope, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        json.Should().Contain("\"comment\":\"LGTM!\"");
    }

    #endregion
}
