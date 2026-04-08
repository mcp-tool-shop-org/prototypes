namespace CodeTeam.Core;

/// <summary>
/// Complete verification result per CLI schema v0.1
/// </summary>
public sealed record VerificationResult
{
    /// <summary>
    /// Verification status code
    /// </summary>
    public required VerificationStatus Status { get; init; }

    /// <summary>
    /// CLI exit code (matches Status numeric value)
    /// </summary>
    public int ExitCode => (int)Status;

    /// <summary>
    /// Path to verified package
    /// </summary>
    public required string PackagePath { get; init; }

    /// <summary>
    /// Package digest (sha256:...)
    /// </summary>
    public string? PackageDigest { get; init; }

    /// <summary>
    /// Manifest digest (sha256:...)
    /// </summary>
    public string? ManifestDigest { get; init; }

    /// <summary>
    /// Verification summary
    /// </summary>
    public required VerificationSummary Summary { get; init; }

    /// <summary>
    /// Individual check results
    /// </summary>
    public required VerificationChecks Checks { get; init; }

    /// <summary>
    /// Errors encountered during verification
    /// </summary>
    public required IReadOnlyList<VerificationError> Errors { get; init; }

    /// <summary>
    /// Warnings (non-fatal issues)
    /// </summary>
    public required IReadOnlyList<string> Warnings { get; init; }
}

/// <summary>
/// Verification summary counts
/// </summary>
public sealed record VerificationSummary
{
    public int ArtifactsCount { get; init; }
    public int EvidenceCount { get; init; }
    public int ApprovalsValid { get; init; }
    public int ApprovalsRequired { get; init; }
    public bool SignaturePresent { get; init; }
    public bool SignatureValid { get; init; }
    public string? SignerId { get; init; }

    // Quorum-related fields (Phase 3)

    /// <summary>Number of distinct signers that matched policy</summary>
    public int SignersMatched { get; init; }

    /// <summary>Number of signers required by policy</summary>
    public int SignersRequired { get; init; }

    /// <summary>Key IDs of signers that matched</summary>
    public IReadOnlyList<string>? MatchedSignerIds { get; init; }
}

/// <summary>
/// Individual verification check results
/// </summary>
public sealed record VerificationChecks
{
    public bool SchemaValid { get; init; }
    public bool ArtifactsValid { get; init; }
    public bool EvidenceValid { get; init; }
    public bool PathsValid { get; init; }
}
