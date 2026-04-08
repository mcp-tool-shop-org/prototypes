namespace CodeTeam.Core;

/// <summary>
/// Verification status codes per CONTRACT.md and VERIFICATION.md v0.1
/// </summary>
public enum VerificationStatus
{
    /// <summary>
    /// Package verified with valid signature. Exit code 0.
    /// </summary>
    OK_VERIFIED = 0,

    /// <summary>
    /// Package valid but unsigned or approval threshold not met. Exit code 1.
    /// </summary>
    OK_UNSIGNED = 1,

    /// <summary>
    /// Integrity check failed (missing file, size mismatch, or digest mismatch). Exit code 2.
    /// </summary>
    FAIL_INTEGRITY = 2,

    /// <summary>
    /// Schema validation failed. Exit code 3.
    /// </summary>
    FAIL_SCHEMA = 3,

    /// <summary>
    /// Cryptographic signature verification failed. Exit code 4.
    /// </summary>
    FAIL_SIGNATURE = 4,

    /// <summary>
    /// Approval threshold not met when signature present. Exit code 5.
    /// </summary>
    FAIL_THRESHOLD = 5,

    /// <summary>
    /// Actor not authorized (approver or signer not in policy). Exit code 6.
    /// </summary>
    FAIL_UNAUTHORIZED = 6
}
