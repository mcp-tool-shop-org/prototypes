using CodeTeam.Core;

namespace CodeTeam.Packaging;

/// <summary>
/// Verifies CodeTeam packages according to VERIFICATION.md v0.1
/// </summary>
public interface IPackageVerifier
{
    /// <summary>
    /// Verify a package at the specified path
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <returns>Verification result</returns>
    Task<VerificationResult> VerifyAsync(string packagePath);
}
