using System.Text;
using System.Text.Json.Serialization;

namespace CodeTeam.Core;

/// <summary>
/// Signable payload structures per CodeTeam Signature Spec v0.1.
///
/// The signable payload is the canonical object that gets signed.
/// It is versioned, purpose-tagged, and binds to the package digest.
///
/// Signature bytes: Ed25519.Sign(private_key, canonical_json(signable_payload))
/// </summary>
public static class SignablePayloadBuilder
{
    /// <summary>
    /// Current signable version
    /// </summary>
    public const string SignableVersion = "0.1";

    /// <summary>
    /// Purpose tag for package attestations
    /// </summary>
    public const string PurposePackageAttestation = "codeteam.package_attestation";

    /// <summary>
    /// Purpose tag for approvals
    /// </summary>
    public const string PurposeApproval = "codeteam.approval";

    /// <summary>
    /// Build a signable payload for a package attestation (final signature).
    /// </summary>
    public static SignablePayload ForPackageAttestation(
        string packageDigest,
        string role,
        string schemaVersion = "0.1")
    {
        return new SignablePayload
        {
            SignableVersion = SignableVersion,
            Purpose = PurposePackageAttestation,
            PackageDigest = packageDigest,
            SchemaVersion = schemaVersion,
            Claims = new SignableClaims
            {
                Role = role,
                Scope = "package"
            }
        };
    }

    /// <summary>
    /// Build a signable payload for an approval.
    /// </summary>
    public static SignablePayload ForApproval(
        string packageDigest,
        string role,
        string schemaVersion = "0.1")
    {
        return new SignablePayload
        {
            SignableVersion = SignableVersion,
            Purpose = PurposeApproval,
            PackageDigest = packageDigest,
            SchemaVersion = schemaVersion,
            Claims = new SignableClaims
            {
                Role = role,
                Scope = "package"
            }
        };
    }

    /// <summary>
    /// Get the canonical bytes to sign for a signable payload.
    /// </summary>
    public static byte[] GetSignableBytes(SignablePayload payload)
    {
        var canonicalJson = CanonicalJson.Serialize(payload);
        return Encoding.UTF8.GetBytes(canonicalJson);
    }

    /// <summary>
    /// Get the canonical JSON representation of a signable payload.
    /// </summary>
    public static string GetCanonicalJson(SignablePayload payload)
    {
        return CanonicalJson.Serialize(payload);
    }
}

/// <summary>
/// The signable payload structure (v0.1).
/// This is the object whose canonical JSON is signed.
/// </summary>
public sealed record SignablePayload
{
    /// <summary>
    /// Signable structure version
    /// </summary>
    [JsonPropertyName("signable_version")]
    public required string SignableVersion { get; init; }

    /// <summary>
    /// Purpose tag (prevents cross-protocol signature replay)
    /// </summary>
    [JsonPropertyName("purpose")]
    public required string Purpose { get; init; }

    /// <summary>
    /// Package digest this signature covers
    /// </summary>
    [JsonPropertyName("package_digest")]
    public required string PackageDigest { get; init; }

    /// <summary>
    /// Schema version of the package manifest
    /// </summary>
    [JsonPropertyName("schema_version")]
    public required string SchemaVersion { get; init; }

    /// <summary>
    /// Claims about the signer's role and scope
    /// </summary>
    [JsonPropertyName("claims")]
    public required SignableClaims Claims { get; init; }
}

/// <summary>
/// Claims section of the signable payload.
/// </summary>
public sealed record SignableClaims
{
    /// <summary>
    /// Role of the signer (e.g., "maintainer", "reviewer", "release-signer")
    /// </summary>
    [JsonPropertyName("role")]
    public required string Role { get; init; }

    /// <summary>
    /// Scope of the signature (e.g., "package")
    /// </summary>
    [JsonPropertyName("scope")]
    public required string Scope { get; init; }
}

/// <summary>
/// Signature envelope structure (v0.1).
/// This is the stored artifact that contains both the signature and the signable.
/// </summary>
public sealed record SignatureEnvelope
{
    /// <summary>
    /// Envelope schema version
    /// </summary>
    [JsonPropertyName("schema_version")]
    public required string SchemaVersion { get; init; }

    /// <summary>
    /// Signature algorithm (e.g., "ed25519")
    /// </summary>
    [JsonPropertyName("algorithm")]
    public required string Algorithm { get; init; }

    /// <summary>
    /// Key identifier
    /// </summary>
    [JsonPropertyName("key_id")]
    public required string KeyId { get; init; }

    /// <summary>
    /// Base64-encoded public key
    /// </summary>
    [JsonPropertyName("public_key")]
    public required string PublicKey { get; init; }

    /// <summary>
    /// Base64-encoded signature bytes
    /// </summary>
    [JsonPropertyName("signature")]
    public required string Signature { get; init; }

    /// <summary>
    /// The signable payload that was signed
    /// </summary>
    [JsonPropertyName("signable")]
    public required SignablePayload Signable { get; init; }

    /// <summary>
    /// ISO-8601 timestamp when signature was created (not part of signable)
    /// </summary>
    [JsonPropertyName("created_at")]
    public required string CreatedAt { get; init; }
}

/// <summary>
/// Approval envelope structure (v0.1).
/// Similar to signature envelope but for approvals.
/// </summary>
public sealed record ApprovalEnvelope
{
    /// <summary>
    /// Envelope schema version
    /// </summary>
    [JsonPropertyName("schema_version")]
    public required string SchemaVersion { get; init; }

    /// <summary>
    /// Signature algorithm (e.g., "ed25519")
    /// </summary>
    [JsonPropertyName("algorithm")]
    public required string Algorithm { get; init; }

    /// <summary>
    /// Key identifier of the approver
    /// </summary>
    [JsonPropertyName("key_id")]
    public required string KeyId { get; init; }

    /// <summary>
    /// Base64-encoded public key
    /// </summary>
    [JsonPropertyName("public_key")]
    public required string PublicKey { get; init; }

    /// <summary>
    /// Base64-encoded signature bytes
    /// </summary>
    [JsonPropertyName("signature")]
    public required string Signature { get; init; }

    /// <summary>
    /// The signable payload that was signed
    /// </summary>
    [JsonPropertyName("signable")]
    public required SignablePayload Signable { get; init; }

    /// <summary>
    /// ISO-8601 timestamp when approval was created (not part of signable)
    /// </summary>
    [JsonPropertyName("created_at")]
    public required string CreatedAt { get; init; }

    /// <summary>
    /// Optional comment from the approver
    /// </summary>
    [JsonPropertyName("comment")]
    public string? Comment { get; init; }
}
