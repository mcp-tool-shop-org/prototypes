namespace CodeTeam.Core;

/// <summary>
/// Input data for verification - the "loaded package" abstraction.
/// Core verification operates on this model, not on file I/O.
/// </summary>
public sealed record VerificationInput
{
    /// <summary>
    /// Path to the package (for reporting)
    /// </summary>
    public required string PackagePath { get; init; }

    /// <summary>
    /// Parsed manifest (null if couldn't be loaded)
    /// </summary>
    public ManifestData? Manifest { get; init; }

    /// <summary>
    /// Raw manifest JSON for schema validation
    /// </summary>
    public string? ManifestJson { get; init; }

    /// <summary>
    /// Computed artifact digests (path -> actual digest)
    /// </summary>
    public required IReadOnlyDictionary<string, ArtifactFileInfo> ArtifactFiles { get; init; }

    /// <summary>
    /// Computed evidence digests (path -> actual digest)
    /// </summary>
    public required IReadOnlyDictionary<string, ArtifactFileInfo> EvidenceFiles { get; init; }

    /// <summary>
    /// Approval records loaded from package
    /// </summary>
    public required IReadOnlyList<ApprovalData> Approvals { get; init; }

    /// <summary>
    /// Signature records loaded from package
    /// </summary>
    public required IReadOnlyList<SignatureData> Signatures { get; init; }
}

/// <summary>
/// Actual file info for verification
/// </summary>
public sealed record ArtifactFileInfo
{
    public required string Path { get; init; }
    public required bool Exists { get; init; }
    public required long SizeBytes { get; init; }
    public required string ActualDigest { get; init; }
}

/// <summary>
/// Manifest data for verification (typed model)
/// </summary>
public sealed record ManifestData
{
    public required string SchemaVersion { get; init; }
    public required string PackageVersion { get; init; }
    public required string CreatedAt { get; init; }
    public required string Intent { get; init; }
    public required string WorkspaceName { get; init; }
    public required IReadOnlyList<ArtifactData> Artifacts { get; init; }
    public required IReadOnlyList<EvidenceData> Evidence { get; init; }
    public required PolicyData Policy { get; init; }
}

public sealed record ArtifactData
{
    public required string Path { get; init; }
    public required string ExpectedDigest { get; init; }
    public required long ExpectedSize { get; init; }
}

public sealed record EvidenceData
{
    public required string Path { get; init; }
    public required string ExpectedDigest { get; init; }
    public required long ExpectedSize { get; init; }
    public required string Category { get; init; }
}

public sealed record PolicyData
{
    public required int RequiredApprovals { get; init; }
    public required IReadOnlyList<AuthorizedKey> AuthorizedKeys { get; init; }
}

public sealed record AuthorizedKey
{
    public required string Id { get; init; }
    public required string Algorithm { get; init; }
    public required string PublicKey { get; init; }
    public string? Name { get; init; }
}

public sealed record ApprovalData
{
    public required string Type { get; init; }
    public required string PackageDigest { get; init; }
    public required string ApproverId { get; init; }
    public required string Timestamp { get; init; }
    public string? Comment { get; init; }
    public required string Signature { get; init; }
    /// <summary>
    /// Role of the approver. Defaults to "reviewer" if not specified.
    /// </summary>
    public string Role { get; init; } = "reviewer";
}

public sealed record SignatureData
{
    public required string Type { get; init; }
    public required string PackageDigest { get; init; }
    public required string SignerId { get; init; }
    public required string Role { get; init; }
    public required string Timestamp { get; init; }
    public required string Signature { get; init; }
}
