namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Compressed input timeline. RLE-encoded sequence of InputSpans.
/// Provides At(tick) lookup to recover the sample active at any tick.
/// </summary>
public sealed class InputTrace
{
    private readonly IReadOnlyList<InputSpan> _spans;
    private readonly int _totalTicks;

    public IReadOnlyList<InputSpan> Spans => _spans;
    public int TotalTicks => _totalTicks;

    private InputTrace(IReadOnlyList<InputSpan> spans, int totalTicks)
    {
        _spans = spans;
        _totalTicks = totalTicks;
    }

    /// <summary>
    /// Build a trace from per-tick samples via RLE compression.
    /// Adjacent identical samples are merged into a single span.
    /// </summary>
    public static InputTrace FromTickSamples(IReadOnlyList<InputSample> samples)
    {
        if (samples.Count == 0)
            return new InputTrace(Array.Empty<InputSpan>(), 0);

        var spans = new List<InputSpan>();
        var current = samples[0];
        int count = 1;

        for (int i = 1; i < samples.Count; i++)
        {
            if (samples[i] == current)
            {
                count++;
            }
            else
            {
                spans.Add(new InputSpan(count, current));
                current = samples[i];
                count = 1;
            }
        }

        spans.Add(new InputSpan(count, current));
        return new InputTrace(spans.AsReadOnly(), samples.Count);
    }

    /// <summary>
    /// Build a trace directly from pre-built spans.
    /// </summary>
    public static InputTrace FromSpans(IReadOnlyList<InputSpan> spans)
    {
        int total = 0;
        foreach (var s in spans) total += s.DurationTicks;
        return new InputTrace(spans, total);
    }

    /// <summary>
    /// Look up the input sample active at the given tick (0-based).
    /// </summary>
    public InputSample At(int tick)
    {
        if (tick < 0 || tick >= _totalTicks)
            throw new ArgumentOutOfRangeException(nameof(tick),
                $"Tick {tick} is out of range [0, {_totalTicks}).");

        int offset = 0;
        foreach (var span in _spans)
        {
            if (tick < offset + span.DurationTicks)
                return span.Sample;
            offset += span.DurationTicks;
        }

        // Should be unreachable if TotalTicks is correct
        throw new InvalidOperationException("Tick lookup failed — corrupted trace.");
    }
}
