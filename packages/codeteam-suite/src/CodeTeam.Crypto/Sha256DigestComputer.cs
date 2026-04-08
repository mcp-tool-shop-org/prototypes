using System.Security.Cryptography;
using System.Text;

namespace CodeTeam.Crypto;

/// <summary>
/// SHA-256 digest computation per CONTRACT.md v0.1:
/// - File digests use SHA-256 over raw bytes
/// - Digests are formatted as "sha256:{hex}"
/// </summary>
public sealed class Sha256DigestComputer : IDigestComputer
{
    /// <summary>
    /// Prefix for SHA-256 digests per manifest schema
    /// </summary>
    public const string DigestPrefix = "sha256:";

    public async Task<string> ComputeFileDigestAsync(string filePath)
    {
        using var sha256 = SHA256.Create();
        await using var stream = File.OpenRead(filePath);
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return FormatDigest(hashBytes);
    }

    /// <summary>
    /// Compute digest from a stream (doesn't close the stream)
    /// </summary>
    public async Task<string> ComputeStreamDigestAsync(Stream stream)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return FormatDigest(hashBytes);
    }

    public string ComputeDigest(ReadOnlySpan<byte> content)
    {
        Span<byte> hashBytes = stackalloc byte[32];
        SHA256.HashData(content, hashBytes);
        return FormatDigest(hashBytes);
    }

    /// <summary>
    /// Compute digest from UTF-8 string content
    /// </summary>
    public string ComputeStringDigest(string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return ComputeDigest(bytes);
    }

    /// <summary>
    /// Format hash bytes as "sha256:{hex}"
    /// </summary>
    public static string FormatDigest(ReadOnlySpan<byte> hashBytes)
    {
        return DigestPrefix + Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    /// <summary>
    /// Parse a digest string to extract the hex portion
    /// </summary>
    /// <returns>Hex string without prefix, or null if invalid format</returns>
    public static string? ParseDigest(string digest)
    {
        if (string.IsNullOrEmpty(digest))
            return null;

        if (!digest.StartsWith(DigestPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var hex = digest[DigestPrefix.Length..];
        if (hex.Length != 64)
            return null;

        // Validate hex characters
        foreach (var c in hex)
        {
            if (!char.IsAsciiHexDigit(c))
                return null;
        }

        return hex.ToLowerInvariant();
    }

    /// <summary>
    /// Compare two digests for equality (case-insensitive hex)
    /// </summary>
    public static bool DigestsEqual(string expected, string actual)
    {
        var expectedHex = ParseDigest(expected);
        var actualHex = ParseDigest(actual);

        if (expectedHex is null || actualHex is null)
            return false;

        return string.Equals(expectedHex, actualHex, StringComparison.OrdinalIgnoreCase);
    }
}
