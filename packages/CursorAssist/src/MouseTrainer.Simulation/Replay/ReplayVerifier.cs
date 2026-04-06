using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Input;
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;

namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Replays a ReplayEnvelope through a fresh IGameSimulation and verifies
/// that the event stream hash, score, and combo match the envelope's claims.
/// Tick-level replay: calls FixedUpdate directly per tick, bypasses DeterministicLoop.
/// </summary>
public static class ReplayVerifier
{
    public static ReplayVerification Verify(ReplayEnvelope envelope, IGameSimulation sim)
    {
        // Reconstruct RunDescriptor and validate RunId
        var reconstructed = RunDescriptor.Create(
            envelope.Mode,
            envelope.Seed,
            envelope.Difficulty,
            envelope.GeneratorVersion,
            envelope.RulesetVersion,
            envelope.Mutators);

        if (reconstructed.Id != envelope.RunId)
        {
            return new ReplayVerification(
                IsValid: false,
                ExpectedHash: envelope.Hash,
                ActualHash: default,
                ExpectedScore: envelope.FinalScore,
                ActualScore: 0,
                ExpectedMaxCombo: envelope.FinalMaxCombo,
                ActualMaxCombo: 0);
        }

        // Reset simulation with envelope seed
        sim.Reset(envelope.Seed);

        float dt = 1f / envelope.FixedHz;
        int totalTicks = envelope.Trace.TotalTicks;
        var events = new List<GameEvent>();
        ulong hash = Fnv1a.OffsetBasis;
        int score = 0;
        int combo = 0;
        int maxCombo = 0;

        for (int tick = 0; tick < totalTicks; tick++)
        {
            var sample = envelope.Trace.At(tick);
            var (x, y) = sample.Dequantize();
            var input = new PointerInput(x, y, sample.PrimaryDown, sample.SecondaryDown, 0);

            events.Clear();
            sim.FixedUpdate(tick, dt, input, events);

            foreach (var ev in events)
            {
                hash = EventStreamHasher.FoldEvent(hash, ev);

                switch (ev.Type)
                {
                    case GameEventType.EnteredGate:
                        score += ev.Arg1;
                        combo++;
                        if (combo > maxCombo) maxCombo = combo;
                        break;
                    case GameEventType.HitWall:
                        combo = 0;
                        break;
                }
            }
        }

        var actualHash = new VerificationHash(hash);
        bool isValid = actualHash == envelope.Hash
                       && score == envelope.FinalScore
                       && maxCombo == envelope.FinalMaxCombo;

        return new ReplayVerification(
            IsValid: isValid,
            ExpectedHash: envelope.Hash,
            ActualHash: actualHash,
            ExpectedScore: envelope.FinalScore,
            ActualScore: score,
            ExpectedMaxCombo: envelope.FinalMaxCombo,
            ActualMaxCombo: maxCombo);
    }
}
