using System.Text;

namespace CodeTeam.Core;

/// <summary>
/// Resolves the exact signable bytes for verification, supporting both legacy and envelope formats.
///
/// Format detection rule:
/// - If artifact contains a `signable` or `signable_version` field → envelope format → canonical JSON bytes
/// - If artifact has `type: "signature"` with `package_digest`, `signer_id` fields → legacy format → string bytes
///
/// This enables verification of both old packages (legacy format) and new packages (envelope format)
/// without breaking backward compatibility.
/// </summary>
public static class SignableBytesResolver
{
    /// <summary>
    /// Signature format types
    /// </summary>
    public enum SignableFormat
    {
        /// <summary>Legacy string format: "codeteam:signature:v0.1:{package_digest}:{signer_id}"</summary>
        LegacyString,

        /// <summary>Envelope format: canonical JSON of signable payload</summary>
        CanonicalJsonEnvelope
    }

    #region Signature Bytes Resolution

    /// <summary>
    /// Get signable bytes for a signature, detecting format automatically.
    /// </summary>
    public static byte[] GetSignatureSignableBytes(SignatureData signature)
    {
        // Legacy format: uses simple string-based signable
        // Format: "codeteam:signature:v0.1:{package_digest}:{signer_id}"
        return GetLegacySignatureBytes(signature.PackageDigest, signature.SignerId);
    }

    /// <summary>
    /// Get signable bytes for a signature envelope (new format).
    /// </summary>
    public static byte[] GetSignatureSignableBytes(SignablePayload signable)
    {
        // Envelope format: canonical JSON bytes
        return SignablePayloadBuilder.GetSignableBytes(signable);
    }

    /// <summary>
    /// Get signable bytes with explicit format.
    /// </summary>
    public static byte[] GetSignatureSignableBytes(
        string packageDigest,
        string signerId,
        string role,
        SignableFormat format)
    {
        return format switch
        {
            SignableFormat.LegacyString => GetLegacySignatureBytes(packageDigest, signerId),
            SignableFormat.CanonicalJsonEnvelope => GetEnvelopeSignatureBytes(packageDigest, role),
            _ => throw new ArgumentOutOfRangeException(nameof(format))
        };
    }

    /// <summary>
    /// Get legacy format signature bytes.
    /// </summary>
    public static byte[] GetLegacySignatureBytes(string packageDigest, string signerId)
    {
        return Encoding.UTF8.GetBytes($"codeteam:signature:v0.1:{packageDigest}:{signerId}");
    }

    /// <summary>
    /// Get envelope format signature bytes (canonical JSON).
    /// </summary>
    public static byte[] GetEnvelopeSignatureBytes(string packageDigest, string role, string schemaVersion = "0.1")
    {
        var signable = SignablePayloadBuilder.ForPackageAttestation(packageDigest, role, schemaVersion);
        return SignablePayloadBuilder.GetSignableBytes(signable);
    }

    #endregion

    #region Approval Bytes Resolution

    /// <summary>
    /// Get signable bytes for an approval, detecting format automatically.
    /// </summary>
    public static byte[] GetApprovalSignableBytes(ApprovalData approval)
    {
        // Legacy format: uses simple string-based signable
        // Format: "codeteam:approval:v0.1:{package_digest}:{approver_id}"
        return GetLegacyApprovalBytes(approval.PackageDigest, approval.ApproverId);
    }

    /// <summary>
    /// Get signable bytes for an approval envelope (new format).
    /// </summary>
    public static byte[] GetApprovalSignableBytes(SignablePayload signable)
    {
        // Envelope format: canonical JSON bytes
        return SignablePayloadBuilder.GetSignableBytes(signable);
    }

    /// <summary>
    /// Get signable bytes with explicit format.
    /// </summary>
    public static byte[] GetApprovalSignableBytes(
        string packageDigest,
        string approverId,
        string role,
        SignableFormat format)
    {
        return format switch
        {
            SignableFormat.LegacyString => GetLegacyApprovalBytes(packageDigest, approverId),
            SignableFormat.CanonicalJsonEnvelope => GetEnvelopeApprovalBytes(packageDigest, role),
            _ => throw new ArgumentOutOfRangeException(nameof(format))
        };
    }

    /// <summary>
    /// Get legacy format approval bytes.
    /// </summary>
    public static byte[] GetLegacyApprovalBytes(string packageDigest, string approverId)
    {
        return Encoding.UTF8.GetBytes($"codeteam:approval:v0.1:{packageDigest}:{approverId}");
    }

    /// <summary>
    /// Get envelope format approval bytes (canonical JSON).
    /// </summary>
    public static byte[] GetEnvelopeApprovalBytes(string packageDigest, string role, string schemaVersion = "0.1")
    {
        var signable = SignablePayloadBuilder.ForApproval(packageDigest, role, schemaVersion);
        return SignablePayloadBuilder.GetSignableBytes(signable);
    }

    #endregion

    #region Format Detection

    /// <summary>
    /// Detect signature format from SignatureCandidate.
    /// </summary>
    /// <remarks>
    /// Detection rule:
    /// - If SignablePayload is present → CanonicalJsonEnvelope
    /// - Otherwise → LegacyString
    /// </remarks>
    public static SignableFormat DetectSignatureFormat(SignatureCandidate candidate, SignablePayload? signable)
    {
        // If we have the signable payload, it's envelope format
        return signable != null ? SignableFormat.CanonicalJsonEnvelope : SignableFormat.LegacyString;
    }

    /// <summary>
    /// Detect approval format from ApprovalCandidate.
    /// </summary>
    public static SignableFormat DetectApprovalFormat(ApprovalCandidate candidate, SignablePayload? signable)
    {
        return signable != null ? SignableFormat.CanonicalJsonEnvelope : SignableFormat.LegacyString;
    }

    #endregion
}
