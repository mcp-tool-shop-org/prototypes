using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using NSec.Cryptography;

namespace CodeTeam.Crypto;

/// <summary>
/// Key file handling for Ed25519 keys.
///
/// Key files are JWK-like JSON for extensibility and tooling compatibility:
/// {
///   "kty": "OKP",
///   "crv": "Ed25519",
///   "d": "&lt;base64url-encoded-private-key-seed&gt;",
///   "x": "&lt;base64url-encoded-public-key&gt;",
///   "kid": "ed25519:&lt;first-16-hex-of-sha256-pubkey&gt;"
/// }
/// </summary>
public static class KeyFile
{
    private static readonly SignatureAlgorithm Algorithm = SignatureAlgorithm.Ed25519;

    /// <summary>
    /// Generate a new Ed25519 key pair and save to file.
    /// </summary>
    public static KeyFileData Generate()
    {
        // Generate a new key with NSec
        using var key = Key.Create(Algorithm, new KeyCreationParameters
        {
            ExportPolicy = KeyExportPolicies.AllowPlaintextExport
        });

        var privateKeyBytes = key.Export(KeyBlobFormat.RawPrivateKey);
        var publicKeyBytes = key.PublicKey.Export(KeyBlobFormat.RawPublicKey);

        var keyId = ComputeKeyId(publicKeyBytes);

        return new KeyFileData
        {
            Kty = "OKP",
            Crv = "Ed25519",
            D = Base64UrlEncode(privateKeyBytes),
            X = Base64UrlEncode(publicKeyBytes),
            Kid = keyId
        };
    }

    /// <summary>
    /// Generate a deterministic key from a seed (for testing).
    /// </summary>
    public static KeyFileData GenerateFromSeed(byte[] seed)
    {
        if (seed.Length != 32)
            throw new ArgumentException("Seed must be 32 bytes", nameof(seed));

        using var key = Key.Import(Algorithm, seed, KeyBlobFormat.RawPrivateKey,
            new KeyCreationParameters { ExportPolicy = KeyExportPolicies.AllowPlaintextExport });

        var privateKeyBytes = key.Export(KeyBlobFormat.RawPrivateKey);
        var publicKeyBytes = key.PublicKey.Export(KeyBlobFormat.RawPublicKey);

        var keyId = ComputeKeyId(publicKeyBytes);

        return new KeyFileData
        {
            Kty = "OKP",
            Crv = "Ed25519",
            D = Base64UrlEncode(privateKeyBytes),
            X = Base64UrlEncode(publicKeyBytes),
            Kid = keyId
        };
    }

    /// <summary>
    /// Load a key file from disk.
    /// </summary>
    public static KeyFileData Load(string path)
    {
        var json = File.ReadAllText(path);
        return Parse(json);
    }

    /// <summary>
    /// Parse a key file from JSON.
    /// </summary>
    public static KeyFileData Parse(string json)
    {
        var data = JsonSerializer.Deserialize<KeyFileData>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        if (data is null)
            throw new InvalidOperationException("Failed to parse key file");

        if (data.Kty != "OKP")
            throw new InvalidOperationException($"Unsupported key type: {data.Kty}");

        if (data.Crv != "Ed25519")
            throw new InvalidOperationException($"Unsupported curve: {data.Crv}");

        if (string.IsNullOrEmpty(data.D))
            throw new InvalidOperationException("Key file missing private key (d)");

        if (string.IsNullOrEmpty(data.X))
            throw new InvalidOperationException("Key file missing public key (x)");

        return data;
    }

    /// <summary>
    /// Save a key file to disk.
    /// </summary>
    public static void Save(KeyFileData data, string path)
    {
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });
        File.WriteAllText(path, json);
    }

    /// <summary>
    /// Serialize a key file to JSON.
    /// </summary>
    public static string Serialize(KeyFileData data)
    {
        return JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });
    }

    /// <summary>
    /// Compute the key ID from a public key.
    /// Format: "ed25519:" + first 16 hex chars of SHA256(public_key)
    /// </summary>
    public static string ComputeKeyId(byte[] publicKeyBytes)
    {
        var hash = SHA256.HashData(publicKeyBytes);
        var hex = Convert.ToHexString(hash).ToLowerInvariant();
        return hex.Substring(0, 16); // First 16 hex chars (8 bytes)
    }

    /// <summary>
    /// Get the private key bytes from a key file.
    /// </summary>
    public static byte[] GetPrivateKeyBytes(KeyFileData data)
    {
        return Base64UrlDecode(data.D!);
    }

    /// <summary>
    /// Get the public key bytes from a key file.
    /// </summary>
    public static byte[] GetPublicKeyBytes(KeyFileData data)
    {
        return Base64UrlDecode(data.X!);
    }

    /// <summary>
    /// Get the public key as Base64 (standard, not URL-safe).
    /// </summary>
    public static string GetPublicKeyBase64(KeyFileData data)
    {
        var bytes = GetPublicKeyBytes(data);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Sign a message using a key file.
    /// </summary>
    public static byte[] Sign(KeyFileData keyData, byte[] message)
    {
        var privateKeyBytes = GetPrivateKeyBytes(keyData);

        using var key = Key.Import(Algorithm, privateKeyBytes, KeyBlobFormat.RawPrivateKey);
        return Algorithm.Sign(key, message);
    }

    /// <summary>
    /// Sign a message and return Base64-encoded signature.
    /// </summary>
    public static string SignToBase64(KeyFileData keyData, byte[] message)
    {
        var signature = Sign(keyData, message);
        return Convert.ToBase64String(signature);
    }

    // Base64URL encoding (RFC 4648)
    private static string Base64UrlEncode(byte[] data)
    {
        var base64 = Convert.ToBase64String(data);
        return base64.Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private static byte[] Base64UrlDecode(string base64Url)
    {
        var base64 = base64Url.Replace('-', '+').Replace('_', '/');

        // Add padding if needed
        switch (base64.Length % 4)
        {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }

        return Convert.FromBase64String(base64);
    }
}

/// <summary>
/// Key file data structure (JWK-like).
/// </summary>
public sealed record KeyFileData
{
    /// <summary>
    /// Key type. Always "OKP" for Ed25519.
    /// </summary>
    [JsonPropertyName("kty")]
    public required string Kty { get; init; }

    /// <summary>
    /// Curve. Always "Ed25519".
    /// </summary>
    [JsonPropertyName("crv")]
    public required string Crv { get; init; }

    /// <summary>
    /// Private key (seed) as Base64URL.
    /// </summary>
    [JsonPropertyName("d")]
    public string? D { get; init; }

    /// <summary>
    /// Public key as Base64URL.
    /// </summary>
    [JsonPropertyName("x")]
    public required string X { get; init; }

    /// <summary>
    /// Key ID. Format: first 16 hex chars of SHA256(public_key).
    /// </summary>
    [JsonPropertyName("kid")]
    public required string Kid { get; init; }
}
