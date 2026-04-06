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

    public static ulong HashString(ulong hash, string value)
    {
        foreach (char c in value)
        {
            hash ^= (byte)c;
            hash *= Prime;
            if (c > 0x7F)
            {
                hash ^= (byte)(c >> 8);
                hash *= Prime;
            }
        }
        return hash;
    }
}
