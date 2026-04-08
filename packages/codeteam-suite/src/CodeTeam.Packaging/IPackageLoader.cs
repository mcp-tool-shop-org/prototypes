namespace CodeTeam.Packaging;

/// <summary>
/// Loads and parses CodeTeam package contents
/// </summary>
public interface IPackageLoader
{
    /// <summary>
    /// Load a package manifest
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <returns>Parsed manifest or null if invalid</returns>
    Task<PackageManifest?> LoadManifestAsync(string packagePath);

    /// <summary>
    /// Load approval records from a package
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <returns>List of approval records</returns>
    Task<IReadOnlyList<ApprovalRecord>> LoadApprovalsAsync(string packagePath);

    /// <summary>
    /// Load signature records from a package
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <returns>List of signature records</returns>
    Task<IReadOnlyList<SignatureRecord>> LoadSignaturesAsync(string packagePath);
}

/// <summary>
/// Package manifest per CONTRACT.md v0.1
/// </summary>
public sealed record PackageManifest
{
    public required string SchemaVersion { get; init; }
    public required string PackageVersion { get; init; }
    public required string CreatedAt { get; init; }
    public required string Intent { get; init; }
    public required WorkspaceInfo Workspace { get; init; }
    public required IReadOnlyList<ArtifactEntry> Artifacts { get; init; }
    public required IReadOnlyList<EvidenceEntry> Evidence { get; init; }
    public required PolicyInfo Policy { get; init; }
}

public sealed record WorkspaceInfo
{
    public required string Name { get; init; }
}

public sealed record ArtifactEntry
{
    public required string Path { get; init; }
    public required string Sha256 { get; init; }
    public required long SizeBytes { get; init; }
}

public sealed record EvidenceEntry
{
    public required string Path { get; init; }
    public required string Sha256 { get; init; }
    public required long SizeBytes { get; init; }
    public required string Category { get; init; }
}

public sealed record PolicyInfo
{
    public required int RequiredApprovals { get; init; }
    public required IReadOnlyList<ApproverKey> ApproverKeys { get; init; }
}

public sealed record ApproverKey
{
    public required string Id { get; init; }
    public required string Algorithm { get; init; }
    public required string PublicKey { get; init; }
    public string? Name { get; init; }
}

/// <summary>
/// Approval record per approval.schema v0.1
/// </summary>
public sealed record ApprovalRecord
{
    public required string Type { get; init; }
    public required string PackageDigest { get; init; }
    public required string ApproverId { get; init; }
    public required string Ts { get; init; }
    public string? Comment { get; init; }
    public required string Signature { get; init; }
}

/// <summary>
/// Signature record per signature.schema v0.1
/// </summary>
public sealed record SignatureRecord
{
    public required string Type { get; init; }
    public required string PackageDigest { get; init; }
    public required string SignerId { get; init; }
    public required string Role { get; init; }
    public required string Ts { get; init; }
    public required string Signature { get; init; }
}
