namespace CodeTeam.Crypto;

/// <summary>
/// Computes SHA-256 digests for files and content
/// </summary>
public interface IDigestComputer
{
    /// <summary>
    /// Compute SHA-256 digest of a file
    /// </summary>
    /// <param name="filePath">Path to file</param>
    /// <returns>Digest in "sha256:hex" format</returns>
    Task<string> ComputeFileDigestAsync(string filePath);

    /// <summary>
    /// Compute SHA-256 digest of byte content
    /// </summary>
    /// <param name="content">Content bytes</param>
    /// <returns>Digest in "sha256:hex" format</returns>
    string ComputeDigest(ReadOnlySpan<byte> content);
}
