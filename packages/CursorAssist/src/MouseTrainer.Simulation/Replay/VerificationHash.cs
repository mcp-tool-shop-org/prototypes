namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Typed wrapper for an FNV-1a 64-bit event stream hash.
/// Format: "V-" + 16 hex digits (uppercase).
/// </summary>
public readonly record struct VerificationHash(ulong Value)
{
    public override string ToString() => $"V-{Value:X16}";
}
