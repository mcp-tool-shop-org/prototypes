namespace CodeTeam.Core;

/// <summary>
/// Options for verification behavior.
/// </summary>
public sealed record VerifierOptions
{
    /// <summary>
    /// Signature verification delegate.
    /// Parameters: (publicKey, message, signature) -> isValid
    /// </summary>
    public Func<string, byte[], string, bool>? SignatureVerifier { get; init; }

    /// <summary>
    /// Whether to verify signatures cryptographically.
    /// If false, signatures are checked for presence but not verified.
    /// Default: true
    /// </summary>
    public bool VerifySignatures { get; init; } = true;

    /// <summary>
    /// Whether to use quorum-based policy evaluation.
    /// When true, uses PolicyEvaluator for multi-signer quorum semantics.
    /// When false, uses legacy single-signer verification.
    /// Default: false (backward compatible)
    /// </summary>
    public bool UseQuorumPolicy { get; init; } = false;

    /// <summary>
    /// Optional explicit verification policy.
    /// If null and UseQuorumPolicy is true, policy is derived from manifest.
    /// </summary>
    public VerificationPolicy? Policy { get; init; }

    /// <summary>
    /// Default options (no signature verification - for backward compatibility)
    /// </summary>
    public static VerifierOptions Default => new()
    {
        VerifySignatures = false,
        UseQuorumPolicy = false
    };

    /// <summary>
    /// Options with real signature verification
    /// </summary>
    public static VerifierOptions WithSignatureVerification(Func<string, byte[], string, bool> verifier) => new()
    {
        VerifySignatures = true,
        SignatureVerifier = verifier
    };

    /// <summary>
    /// Options with quorum-based policy evaluation
    /// </summary>
    public static VerifierOptions WithQuorumPolicy(Func<string, byte[], string, bool> verifier) => new()
    {
        VerifySignatures = true,
        SignatureVerifier = verifier,
        UseQuorumPolicy = true
    };

    /// <summary>
    /// Options with explicit verification policy
    /// </summary>
    public static VerifierOptions WithPolicy(VerificationPolicy policy, Func<string, byte[], string, bool> verifier) => new()
    {
        VerifySignatures = true,
        SignatureVerifier = verifier,
        UseQuorumPolicy = true,
        Policy = policy
    };
}
