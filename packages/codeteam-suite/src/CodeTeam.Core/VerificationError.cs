namespace CodeTeam.Core;

/// <summary>
/// Structured verification error per VERIFICATION.md v0.1
/// </summary>
public sealed record VerificationError
{
    /// <summary>
    /// Canonical error code (e.g., MISSING_FILE, DIGEST_MISMATCH)
    /// </summary>
    public required string Code { get; init; }

    /// <summary>
    /// Human-readable error message
    /// </summary>
    public required string Message { get; init; }

    /// <summary>
    /// Affected file path, if applicable
    /// </summary>
    public string? Path { get; init; }

    /// <summary>
    /// Expected value (for mismatches)
    /// </summary>
    public string? Expected { get; init; }

    /// <summary>
    /// Actual value (for mismatches)
    /// </summary>
    public string? Actual { get; init; }
}
