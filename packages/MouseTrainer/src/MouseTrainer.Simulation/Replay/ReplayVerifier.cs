using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Input;
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Levels;
using MouseTrainer.Simulation.Mutators;

namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Replays a ReplayEnvelope through a fresh IGameSimulation and verifies
/// that the event stream hash, score, and combo match the envelope's claims.
/// Tick-level replay: calls FixedUpdate directly per tick, bypasses DeterministicLoop.
///
/// When mutators are present in the envelope, the verifier MUST be given a
/// LevelGeneratorRegistry and MutatorRegistry so it can reconstruct the
/// exact mutated blueprint used during the original session. Without this,
/// the sim would reset from the bare seed (unmutated gates) and produce
/// incorrect verification results.
/// </summary>
public static class ReplayVerifier
{
    /// <summary>
    /// Verify a replay without mutator support.
    /// Only valid for envelopes with no mutators (envelope.Mutators.Count == 0).
    /// Throws InvalidOperationException if the envelope contains mutator specs.
    /// </summary>
    public static ReplayVerification Verify(ReplayEnvelope envelope, IGameSimulation sim)
    {
        if (envelope.Mutators.Count > 0)
            throw new InvalidOperationException(
                "This envelope contains mutators. Use the overload that accepts " +
                "LevelGeneratorRegistry and MutatorRegistry to reconstruct the correct blueprint.");

        return VerifyCore(envelope, sim, null, null);
    }

    /// <summary>
    /// Verify a replay with full mutator support.
    /// When the envelope has mutators, the generator and mutator registries are used
    /// to reconstruct the exact mutated blueprint before replaying.
    /// Pass null for both registries only when mutators are guaranteed absent.
    /// </summary>
    public static ReplayVerification Verify(
        ReplayEnvelope envelope,
        IGameSimulation sim,
        LevelGeneratorRegistry? generatorRegistry,
        MutatorRegistry? mutatorRegistry)
    {
        return VerifyCore(envelope, sim, generatorRegistry, mutatorRegistry);
    }

    private static ReplayVerification VerifyCore(
        ReplayEnvelope envelope,
        IGameSimulation sim,
        LevelGeneratorRegistry? generatorRegistry,
        MutatorRegistry? mutatorRegistry)
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

        // Reset the simulation.
        // When mutators are present, reconstruct the mutated blueprint so the
        // replay runs on the exact gates the player saw — not the bare seeded gates.
        if (envelope.Mutators.Count > 0)
        {
            if (generatorRegistry == null)
                throw new ArgumentNullException(nameof(generatorRegistry),
                    "A LevelGeneratorRegistry is required when the envelope contains mutators.");
            if (mutatorRegistry == null)
                throw new ArgumentNullException(nameof(mutatorRegistry),
                    "A MutatorRegistry is required when the envelope contains mutators.");
            if (sim is not IGameSimulationWithBlueprint bpSim)
                throw new InvalidOperationException(
                    $"The simulation '{sim.GetType().Name}' does not implement " +
                    "IGameSimulationWithBlueprint, which is required for mutator replay.");

            var generator = generatorRegistry.Resolve(reconstructed);
            var rawBlueprint = generator.Generate(reconstructed);
            var pipeline = new MutatorPipeline(mutatorRegistry);
            var mutatedBlueprint = pipeline.Apply(rawBlueprint, envelope.Mutators);
            bpSim.Reset(mutatedBlueprint);
        }
        else
        {
            sim.Reset(envelope.Seed);
        }

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
