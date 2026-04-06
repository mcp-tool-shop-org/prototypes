namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// RLE run: a single input sample held for a number of consecutive ticks.
/// </summary>
public readonly record struct InputSpan
{
    public int DurationTicks { get; }
    public InputSample Sample { get; }

    public InputSpan(int durationTicks, InputSample sample)
    {
        if (durationTicks < 1)
            throw new ArgumentOutOfRangeException(nameof(durationTicks), "Duration must be >= 1.");
        DurationTicks = durationTicks;
        Sample = sample;
    }
}
