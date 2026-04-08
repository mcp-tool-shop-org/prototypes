using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;

namespace CodeTeam.Core;

/// <summary>
/// Package digest computation per CodeTeam Digest Spec v0.1.
///
/// The package digest is computed from a normalized digest payload that:
/// - Is deterministic regardless of file enumeration order
/// - Is independent of absolute paths (machine-portable)
/// - Includes manifest digest and all artifact digests
/// - Uses canonical JSON for byte-identical output across platforms
///
/// Formula: package_digest = "sha256:" + SHA256(canonical_json(normalized_payload))
/// </summary>
public static class PackageDigest
{
    /// <summary>
    /// Current payload version
    /// </summary>
    public const string PayloadVersion = "0.1";

    /// <summary>
    /// Compute the package digest from a manifest and artifact file info.
    /// </summary>
    /// <param name="manifestDigest">SHA256 digest of the manifest JSON</param>
    /// <param name="artifacts">Artifact information (path, digest, size)</param>
    /// <returns>Package digest in format "sha256:[hex64]"</returns>
    public static string Compute(string manifestDigest, IEnumerable<ArtifactDigestInfo> artifacts)
    {
        var payload = BuildPayload(manifestDigest, artifacts);
        return ComputeFromPayload(payload);
    }

    /// <summary>
    /// Build the normalized digest payload.
    /// </summary>
    public static DigestPayload BuildPayload(string manifestDigest, IEnumerable<ArtifactDigestInfo> artifacts)
    {
        // Sort artifacts by path for deterministic ordering
        var sortedArtifacts = artifacts
            .OrderBy(a => a.Path, StringComparer.Ordinal)
            .Select(a => new DigestPayloadArtifact
            {
                Path = NormalizePath(a.Path),
                Sha256 = a.Sha256,
                SizeBytes = a.SizeBytes.ToString()
            })
            .ToList();

        return new DigestPayload
        {
            PayloadVersion = PayloadVersion,
            Manifest = new DigestPayloadManifest
            {
                ManifestDigest = manifestDigest
            },
            Artifacts = sortedArtifacts
        };
    }

    /// <summary>
    /// Compute the package digest from a payload.
    /// </summary>
    public static string ComputeFromPayload(DigestPayload payload)
    {
        var canonicalJson = CanonicalJson.Serialize(payload);
        var bytes = Encoding.UTF8.GetBytes(canonicalJson);
        var hash = SHA256.HashData(bytes);
        return "sha256:" + Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>
    /// Get the canonical JSON representation of a payload (for debugging/verification).
    /// </summary>
    public static string GetCanonicalJson(DigestPayload payload)
    {
        return CanonicalJson.Serialize(payload);
    }

    /// <summary>
    /// Normalize a path for digest computation.
    /// - Always uses forward slashes
    /// - Never includes leading/trailing slashes
    /// - Collapses redundant separators
    /// </summary>
    private static string NormalizePath(string path)
    {
        // Replace backslashes with forward slashes
        var normalized = path.Replace('\\', '/');

        // Remove leading/trailing slashes
        normalized = normalized.Trim('/');

        // Collapse redundant slashes
        while (normalized.Contains("//"))
        {
            normalized = normalized.Replace("//", "/");
        }

        return normalized;
    }
}

/// <summary>
/// Artifact information for digest computation.
/// </summary>
public sealed record ArtifactDigestInfo
{
    /// <summary>
    /// Relative path to the artifact
    /// </summary>
    public required string Path { get; init; }

    /// <summary>
    /// SHA256 digest in format "sha256:[hex64]"
    /// </summary>
    public required string Sha256 { get; init; }

    /// <summary>
    /// Size in bytes
    /// </summary>
    public required long SizeBytes { get; init; }
}

/// <summary>
/// The digest payload structure (v0.1).
/// This is the object that gets canonicalized and hashed.
/// </summary>
public sealed record DigestPayload
{
    /// <summary>
    /// Payload structure version
    /// </summary>
    [JsonPropertyName("payload_version")]
    public required string PayloadVersion { get; init; }

    /// <summary>
    /// Manifest digest information
    /// </summary>
    [JsonPropertyName("manifest")]
    public required DigestPayloadManifest Manifest { get; init; }

    /// <summary>
    /// Artifact digests (sorted by path)
    /// </summary>
    [JsonPropertyName("artifacts")]
    public required List<DigestPayloadArtifact> Artifacts { get; init; }
}

/// <summary>
/// Manifest section of the digest payload.
/// </summary>
public sealed record DigestPayloadManifest
{
    /// <summary>
    /// SHA256 digest of the manifest JSON
    /// </summary>
    [JsonPropertyName("manifest_digest")]
    public required string ManifestDigest { get; init; }
}

/// <summary>
/// Artifact entry in the digest payload.
/// </summary>
public sealed record DigestPayloadArtifact
{
    /// <summary>
    /// Normalized relative path (forward slashes, no leading/trailing slashes)
    /// </summary>
    [JsonPropertyName("path")]
    public required string Path { get; init; }

    /// <summary>
    /// SHA256 digest in format "sha256:[hex64]"
    /// </summary>
    [JsonPropertyName("sha256")]
    public required string Sha256 { get; init; }

    /// <summary>
    /// Size in bytes as string (avoids JSON number issues)
    /// </summary>
    [JsonPropertyName("size_bytes")]
    public required string SizeBytes { get; init; }
}
