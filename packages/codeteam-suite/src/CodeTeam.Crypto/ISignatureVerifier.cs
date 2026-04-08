namespace CodeTeam.Crypto;

/// <summary>
/// Verifies Ed25519 signatures
/// </summary>
public interface ISignatureVerifier
{
    /// <summary>
    /// Verify an Ed25519 signature
    /// </summary>
    /// <param name="publicKey">Base64-encoded public key</param>
    /// <param name="message">Message bytes that were signed</param>
    /// <param name="signature">Base64-encoded signature</param>
    /// <returns>True if signature is valid</returns>
    bool Verify(string publicKey, ReadOnlySpan<byte> message, string signature);
}
