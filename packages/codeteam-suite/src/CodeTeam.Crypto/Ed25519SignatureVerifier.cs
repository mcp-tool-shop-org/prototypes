using NSec.Cryptography;

namespace CodeTeam.Crypto;

/// <summary>
/// Ed25519 signature verification using NSec.
/// </summary>
public sealed class Ed25519SignatureVerifier : ISignatureVerifier
{
    private static readonly SignatureAlgorithm Algorithm = SignatureAlgorithm.Ed25519;

    /// <summary>
    /// Verify an Ed25519 signature cryptographically.
    /// </summary>
    /// <param name="publicKey">Base64-encoded 32-byte Ed25519 public key</param>
    /// <param name="message">Message bytes that were signed</param>
    /// <param name="signature">Base64-encoded 64-byte Ed25519 signature</param>
    /// <returns>True if signature is cryptographically valid</returns>
    public bool Verify(string publicKey, ReadOnlySpan<byte> message, string signature)
    {
        // Basic validation
        if (string.IsNullOrWhiteSpace(publicKey))
            return false;

        if (string.IsNullOrWhiteSpace(signature))
            return false;

        try
        {
            // Decode base64
            var sigBytes = Convert.FromBase64String(signature);
            var keyBytes = Convert.FromBase64String(publicKey);

            // Validate sizes
            if (sigBytes.Length != 64) // Ed25519 signatures are 64 bytes
                return false;

            if (keyBytes.Length != 32) // Ed25519 public keys are 32 bytes
                return false;

            // Import the public key
            var pubKey = PublicKey.Import(Algorithm, keyBytes, KeyBlobFormat.RawPublicKey);

            // Verify the signature cryptographically
            return Algorithm.Verify(pubKey, message, sigBytes);
        }
        catch (Exception)
        {
            // Any exception means verification failed
            return false;
        }
    }
}

/// <summary>
/// Stub verifier for backward compatibility with Phase 1 fixtures.
/// Use this only for tests that have synthetic signatures.
/// </summary>
public sealed class StubSignatureVerifier : ISignatureVerifier
{
    /// <summary>
    /// Always returns true if signature format is valid.
    /// ONLY use for testing with synthetic signatures.
    /// </summary>
    public bool Verify(string publicKey, ReadOnlySpan<byte> message, string signature)
    {
        if (string.IsNullOrWhiteSpace(publicKey))
            return false;

        if (string.IsNullOrWhiteSpace(signature))
            return false;

        try
        {
            var sigBytes = Convert.FromBase64String(signature);
            var keyBytes = Convert.FromBase64String(publicKey);

            return sigBytes.Length == 64 && keyBytes.Length == 32;
        }
        catch
        {
            return false;
        }
    }
}
