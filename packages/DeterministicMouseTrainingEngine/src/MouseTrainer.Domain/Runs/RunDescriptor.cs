using MouseTrainer.Domain.Utility;

namespace MouseTrainer.Domain.Runs;

/// <summary>
/// Complete immutable run identity. Protocol type: stable hashing, canonical serialization.
/// Contains no config data — identity only. The generator resolves config from Mode + Difficulty.
/// </summary>
public readonly record struct RunDescriptor
{
    public required ModeId Mode { get; init; }
    public required uint Seed { get; init; }
    public required DifficultyTier Difficulty { get; init; }
    public required int GeneratorVersion { get; init; }
    public required int RulesetVersion { get; init; }

    /// <summary>
    /// Ordered mutator specifications. Part of run identity — order matters for hashing.
    /// Empty list = no mutators applied.
    /// </summary>
    public required IReadOnlyList<MutatorSpec> Mutators { get; init; }

    /// <summary>
    /// Deterministic identity hash. Computed once at creation, never recomputed.
    /// </summary>
    public required RunId Id { get; init; }

    /// <summary>
    /// Canonical factory. Computes RunId via FNV-1a 64-bit over canonical byte representation.
    /// When mutators is null or empty, hash is identical to pre-4C1 behavior.
    /// </summary>
    public static RunDescriptor Create(
        ModeId mode,
        uint seed,
        DifficultyTier difficulty = DifficultyTier.Standard,
        int generatorVersion = 1,
        int rulesetVersion = 1,
        IReadOnlyList<MutatorSpec>? mutators = null)
    {
        var specs = mutators ?? Array.Empty<MutatorSpec>();
        var id = ComputeId(mode, seed, difficulty, generatorVersion, rulesetVersion, specs);
        return new RunDescriptor
        {
            Mode = mode,
            Seed = seed,
            Difficulty = difficulty,
            GeneratorVersion = generatorVersion,
            RulesetVersion = rulesetVersion,
            Mutators = specs,
            Id = id,
        };
    }

    /// <summary>
    /// FNV-1a 64-bit over canonical byte representation.
    /// Platform-stable: explicit byte layout, all integers little-endian.
    /// Mode/MutatorId strings encoded as UTF-8 bytes (ASCII-only in practice).
    /// Mutator data is only hashed when the list is non-empty (backward compat).
    /// </summary>
    private static RunId ComputeId(
        ModeId mode, uint seed, DifficultyTier difficulty,
        int generatorVersion, int rulesetVersion,
        IReadOnlyList<MutatorSpec> mutators)
    {
        ulong hash = Fnv1a.OffsetBasis;

        // Mode string as UTF-8 bytes (ASCII path: one byte per char)
        hash = Fnv1a.HashString(hash, mode.Value);

        // Seed: 4 bytes little-endian
        hash = Fnv1a.HashUInt32(hash, seed);

        // Difficulty: 4 bytes little-endian
        hash = Fnv1a.HashInt32(hash, (int)difficulty);

        // GeneratorVersion: 4 bytes little-endian
        hash = Fnv1a.HashInt32(hash, generatorVersion);

        // RulesetVersion: 4 bytes little-endian
        hash = Fnv1a.HashInt32(hash, rulesetVersion);

        // Mutators: only hashed when non-empty (preserves golden hash for empty list)
        if (mutators.Count > 0)
        {
            // Mutator count as sentinel/delimiter
            hash = Fnv1a.HashInt32(hash, mutators.Count);

            for (int m = 0; m < mutators.Count; m++)
            {
                var spec = mutators[m];

                // MutatorId string (same encoding as ModeId)
                hash = Fnv1a.HashString(hash, spec.Id.Value);

                // Version: 4 bytes LE
                hash = Fnv1a.HashInt32(hash, spec.Version);

                // Param count
                hash = Fnv1a.HashInt32(hash, spec.Params.Count);

                // Each param: key string + value float (IEEE 754 bits)
                for (int p = 0; p < spec.Params.Count; p++)
                {
                    var param = spec.Params[p];
                    hash = Fnv1a.HashString(hash, param.Key);

                    uint bits = BitConverter.SingleToUInt32Bits(param.Value);
                    hash = Fnv1a.HashUInt32(hash, bits);
                }
            }
        }

        return new RunId(hash);
    }
}
