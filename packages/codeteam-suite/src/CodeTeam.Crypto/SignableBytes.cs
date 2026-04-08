using System.Text;

namespace CodeTeam.Crypto;

/// <summary>
/// Creates canonical signable byte sequences for approvals and signatures.
/// The format MUST be deterministic and match what signers use.
/// </summary>
public static class SignableBytes
{
    /// <summary>
    /// Create signable bytes for an approval.
    /// Format: "codeteam:approval:v0.1:{package_digest}:{approver_id}"
    /// </summary>
    public static byte[] ForApproval(string packageDigest, string approverId)
    {
        return Encoding.UTF8.GetBytes($"codeteam:approval:v0.1:{packageDigest}:{approverId}");
    }

    /// <summary>
    /// Create signable bytes for a final signature.
    /// Format: "codeteam:signature:v0.1:{package_digest}:{signer_id}"
    /// </summary>
    public static byte[] ForSignature(string packageDigest, string signerId)
    {
        return Encoding.UTF8.GetBytes($"codeteam:signature:v0.1:{packageDigest}:{signerId}");
    }
}
