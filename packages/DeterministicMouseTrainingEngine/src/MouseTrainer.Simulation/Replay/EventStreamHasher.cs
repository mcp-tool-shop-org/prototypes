using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Utility;

namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Computes a deterministic FNV-1a 64-bit hash over a stream of GameEvents.
/// Tick events are excluded (heartbeat only, no scoring info).
/// Canonical packing per event: Type(int) + Arg0(int) + Arg1(int) + Intensity(float as uint32 bits).
/// </summary>
public static class EventStreamHasher
{
    /// <summary>
    /// Compute verification hash from a complete event list (batch mode).
    /// </summary>
    public static VerificationHash Compute(IReadOnlyList<GameEvent> events)
    {
        ulong hash = Fnv1a.OffsetBasis;

        foreach (var ev in events)
        {
            if (ev.Type == GameEventType.Tick) continue;

            hash = HashEvent(hash, ev);
        }

        return new VerificationHash(hash);
    }

    /// <summary>
    /// Incrementally fold a single event into a running hash.
    /// Returns the updated hash, or the same hash if the event is a Tick.
    /// </summary>
    public static ulong FoldEvent(ulong hash, in GameEvent ev)
    {
        if (ev.Type == GameEventType.Tick) return hash;
        return HashEvent(hash, ev);
    }

    private static ulong HashEvent(ulong hash, in GameEvent ev)
    {
        hash = Fnv1a.HashInt32(hash, (int)ev.Type);
        hash = Fnv1a.HashInt32(hash, ev.Arg0);
        hash = Fnv1a.HashInt32(hash, ev.Arg1);
        hash = Fnv1a.HashUInt32(hash, BitConverter.SingleToUInt32Bits(ev.Intensity));
        return hash;
    }
}
