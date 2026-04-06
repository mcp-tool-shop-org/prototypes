using System.Security.Cryptography;
using System.Text;

namespace DevOpTyper.Content.Services;

public static class ContentId
{
    // Stable, content-derived ID: SHA-256(language + \n + normalizedCode), first 16 bytes as hex
    public static string From(string language, string normalizedCode)
    {
        language ??= "text";
        normalizedCode ??= string.Empty;

        var payload = $"{language.ToLowerInvariant()}\n{normalizedCode}";
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
