using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Replay;
using Xunit;

namespace MouseTrainer.Tests.Replay;

public class EventStreamHasherTests
{
    // ── 1. Determinism: same events, same hash ──

    [Fact]
    public void Determinism_SameEvents_SameHash()
    {
        var events = new List<GameEvent>
        {
            new(GameEventType.EnteredGate, Intensity: 1f, Arg0: 0, Arg1: 100),
            new(GameEventType.HitWall, Intensity: 0.5f, Arg0: 1, Arg1: 500),
            new(GameEventType.LevelComplete, Intensity: 1f, Arg0: 200, Arg1: 3),
        };

        var h1 = EventStreamHasher.Compute(events);
        var h2 = EventStreamHasher.Compute(events);

        Assert.Equal(h1, h2);
    }

    // ── 2. Order sensitivity ──

    [Fact]
    public void OrderSensitivity_DifferentOrder_DifferentHash()
    {
        var evA = new GameEvent(GameEventType.EnteredGate, Intensity: 1f, Arg0: 0, Arg1: 100);
        var evB = new GameEvent(GameEventType.HitWall, Intensity: 0.5f, Arg0: 1, Arg1: 500);

        var hash1 = EventStreamHasher.Compute(new List<GameEvent> { evA, evB });
        var hash2 = EventStreamHasher.Compute(new List<GameEvent> { evB, evA });

        Assert.NotEqual(hash1, hash2);
    }

    // ── 3. Tick exclusion ──

    [Fact]
    public void TickEvents_AreExcluded()
    {
        var gate = new GameEvent(GameEventType.EnteredGate, Intensity: 1f, Arg0: 0, Arg1: 100);
        var tick = new GameEvent(GameEventType.Tick, Intensity: 0f, Arg0: 42, Arg1: 0);

        var withoutTick = EventStreamHasher.Compute(new List<GameEvent> { gate });
        var withTick = EventStreamHasher.Compute(new List<GameEvent> { gate, tick });
        var tickOnly = EventStreamHasher.Compute(new List<GameEvent> { tick });

        Assert.Equal(withoutTick, withTick);
        Assert.Equal(new VerificationHash(Fnv1a.OffsetBasis), tickOnly);
    }

    // ── 4. Empty events → OffsetBasis ──

    [Fact]
    public void EmptyEvents_ReturnsOffsetBasis()
    {
        var hash = EventStreamHasher.Compute(new List<GameEvent>());
        Assert.Equal(new VerificationHash(Fnv1a.OffsetBasis), hash);
    }

    // ── 5. Incremental FoldEvent matches batch Compute ──

    [Fact]
    public void Incremental_MatchesBatch()
    {
        var events = new List<GameEvent>
        {
            new(GameEventType.EnteredGate, Intensity: 1f, Arg0: 0, Arg1: 100),
            new(GameEventType.Tick, Intensity: 0f, Arg0: 1, Arg1: 0),
            new(GameEventType.HitWall, Intensity: 0.5f, Arg0: 2, Arg1: 500),
            new(GameEventType.EnteredGate, Intensity: 0.8f, Arg0: 3, Arg1: 80),
            new(GameEventType.Tick, Intensity: 0f, Arg0: 4, Arg1: 0),
            new(GameEventType.LevelComplete, Intensity: 1f, Arg0: 0, Arg1: 0),
        };

        var batchHash = EventStreamHasher.Compute(events);

        ulong running = Fnv1a.OffsetBasis;
        foreach (var ev in events)
            running = EventStreamHasher.FoldEvent(running, ev);

        Assert.Equal(batchHash, new VerificationHash(running));
    }

    // ── 6. Golden hash for known event sequence (frozen) ──

    [Fact]
    public void GoldenHash_KnownEventSequence()
    {
        // Frozen golden vector: if this changes, hashing is broken.
        var events = new List<GameEvent>
        {
            new(GameEventType.EnteredGate, Intensity: 1f, Arg0: 0, Arg1: 100),
            new(GameEventType.HitWall, Intensity: 0.5f, Arg0: 1, Arg1: 500),
            new(GameEventType.LevelComplete, Intensity: 1f, Arg0: 0, Arg1: 0),
        };

        var hash = EventStreamHasher.Compute(events);

        // Capture the actual hash on first run, then freeze it.
        // This test will be updated once the golden value is captured.
        Assert.NotEqual(new VerificationHash(Fnv1a.OffsetBasis), hash);

        // Frozen golden value — regression firewall
        Assert.Equal(new VerificationHash(0x969CC0D6A7696C0BUL), hash);
    }
}
