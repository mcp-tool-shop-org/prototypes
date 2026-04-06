using System.Text;

namespace MouseTrainer.Domain.Utility;

/// <summary>
/// FNV-1a 64-bit hash primitives. Shared across RunDescriptor, EventStreamHasher,
/// and any future hashing needs. Platform-stable: explicit byte layout, little-endian integers.
/// </summary>
public static class Fnv1a
{
    public const ulong OffsetBasis = 14695981039346656037UL;
    public const ulong Prime = 1099511628211UL;

    public static ulong HashByte(ulong hash, byte b)
    {
        hash ^= b;
        hash *= Prime;
        return hash;
    }

    public static ulong HashInt32(ulong hash, int value)
    {
        hash = HashByte(hash, (byte)(value));
        hash = HashByte(hash, (byte)(value >> 8));
        hash = HashByte(hash, (byte)(value >> 16));
        hash = HashByte(hash, (byte)(value >> 24));
        return hash;
    }

    public static ulong HashUInt32(ulong hash, uint value)
    {
        hash = HashByte(hash, (byte)(value));
        hash = HashByte(hash, (byte)(value >> 8));
        hash = HashByte(hash, (byte)(value >> 16));
        hash = HashByte(hash, (byte)(value >> 24));
        return hash;
    }

    /// <summary>
    /// Hash a string as UTF-8 bytes (platform-stable).
    /// All ModeId and MutatorId values are ASCII in practice, so this is
    /// equivalent to the prior char-by-char approach for existing data —
    /// but is now correctly defined and safe for any Unicode input.
    /// </summary>
    public static ulong HashString(ulong hash, string value)
    {
        // Encode as UTF-8. For ASCII-only strings (all current ids),
        // this is a no-op byte-for-byte match with the prior implementation.
        byte[] bytes = Encoding.UTF8.GetBytes(value);
        foreach (byte b in bytes)
            hash = HashByte(hash, b);
        return hash;
    }
}
