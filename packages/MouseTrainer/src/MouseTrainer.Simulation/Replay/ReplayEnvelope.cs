using MouseTrainer.Domain.Runs;

namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Immutable, self-contained replay artifact. Stores everything needed to reproduce
/// and verify a session: run identity, compressed input trace, and verification hash.
/// No events stored, no score stored — the replay proves them.
/// In-memory only for now; binary serialization is a future phase.
/// </summary>
public sealed record ReplayEnvelope
{
    public const ushort CurrentFormatVersion = 1;

    public required ushort FormatVersion { get; init; }
    public required RunId RunId { get; init; }
    public required ModeId Mode { get; init; }
    public required uint Seed { get; init; }
    public required DifficultyTier Difficulty { get; init; }
    public required int GeneratorVersion { get; init; }
    public required int RulesetVersion { get; init; }
    public required IReadOnlyList<MutatorSpec> Mutators { get; init; }
    public required int FixedHz { get; init; }
    public required InputTrace Trace { get; init; }
    public required VerificationHash Hash { get; init; }
    public required int FinalScore { get; init; }
    public required int FinalMaxCombo { get; init; }
}
