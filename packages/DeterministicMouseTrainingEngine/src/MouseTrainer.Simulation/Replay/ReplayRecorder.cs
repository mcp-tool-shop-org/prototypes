using MouseTrainer.Domain.Input;
using MouseTrainer.Domain.Runs;
using MouseTrainer.Simulation.Session;

namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Mutable, session-scoped recorder. Captures per-tick input samples during live play.
/// Call Finalize() once at session end to produce an immutable ReplayEnvelope.
/// </summary>
public sealed class ReplayRecorder
{
    private readonly List<InputSample> _samples = new(capacity: 1024);
    private bool _finalized;

    public int TickCount => _samples.Count;

    /// <summary>
    /// Record a single tick's input. Quantizes the pointer coordinates.
    /// </summary>
    public void RecordTick(in PointerInput input)
    {
        if (_finalized)
            throw new InvalidOperationException("Cannot record after finalize.");

        _samples.Add(InputSample.Quantize(input.X, input.Y, input.PrimaryDown, input.SecondaryDown));
    }

    /// <summary>
    /// Build the final ReplayEnvelope. Single-use: throws on second call.
    /// </summary>
    public ReplayEnvelope Finalize(RunDescriptor run, int fixedHz, SessionResult result, VerificationHash hash)
    {
        if (_finalized)
            throw new InvalidOperationException("ReplayRecorder has already been finalized.");
        _finalized = true;

        return new ReplayEnvelope
        {
            FormatVersion = ReplayEnvelope.CurrentFormatVersion,
            RunId = run.Id,
            Mode = run.Mode,
            Seed = run.Seed,
            Difficulty = run.Difficulty,
            GeneratorVersion = run.GeneratorVersion,
            RulesetVersion = run.RulesetVersion,
            Mutators = run.Mutators,
            FixedHz = fixedHz,
            Trace = InputTrace.FromTickSamples(_samples),
            Hash = hash,
            FinalScore = result.TotalScore,
            FinalMaxCombo = result.MaxCombo,
        };
    }
}
