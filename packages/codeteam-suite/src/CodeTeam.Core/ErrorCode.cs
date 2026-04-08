namespace CodeTeam.Core;

/// <summary>
/// Canonical error codes per VERIFICATION.md v0.1
/// </summary>
public static class ErrorCode
{
    /// <summary>Referenced file does not exist</summary>
    public const string MISSING_FILE = "MISSING_FILE";

    /// <summary>File size differs from manifest</summary>
    public const string SIZE_MISMATCH = "SIZE_MISMATCH";

    /// <summary>SHA-256 hash differs from manifest</summary>
    public const string DIGEST_MISMATCH = "DIGEST_MISMATCH";

    /// <summary>JSON does not match schema</summary>
    public const string SCHEMA_INVALID = "SCHEMA_INVALID";

    /// <summary>Ed25519 signature verification failed</summary>
    public const string SIGNATURE_INVALID = "SIGNATURE_INVALID";

    /// <summary>Approver/signer not in policy</summary>
    public const string ACTOR_NOT_AUTHORIZED = "ACTOR_NOT_AUTHORIZED";

    /// <summary>Approval count below required</summary>
    public const string THRESHOLD_NOT_MET = "THRESHOLD_NOT_MET";

    // Quorum-related error codes (Phase 3)

    /// <summary>Signature quorum not met (distinct signer count below threshold)</summary>
    public const string SIGNATURE_QUORUM_NOT_MET = "SIGNATURE_QUORUM_NOT_MET";

    /// <summary>Approval quorum not met (distinct approver count below threshold)</summary>
    public const string APPROVAL_QUORUM_NOT_MET = "APPROVAL_QUORUM_NOT_MET";

    /// <summary>Signature key not in policy allowlist</summary>
    public const string SIGNATURE_NOT_ALLOWED = "SIGNATURE_NOT_ALLOWED";

    /// <summary>Signature purpose does not match requirement</summary>
    public const string PURPOSE_MISMATCH = "PURPOSE_MISMATCH";

    /// <summary>Duplicate signer (same key_id) - only counted once</summary>
    public const string DUPLICATE_SIGNER = "DUPLICATE_SIGNER";

    // Format compatibility codes

    /// <summary>Legacy signature format not supported in quorum mode - ignored</summary>
    public const string LEGACY_SIGNATURE_IGNORED = "LEGACY_SIGNATURE_IGNORED";

    /// <summary>Signature format not recognized or unsupported</summary>
    public const string SIGNATURE_FORMAT_UNSUPPORTED = "SIGNATURE_FORMAT_UNSUPPORTED";
}
