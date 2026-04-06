namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Compressed input timeline. RLE-encoded sequence of InputSpans.
/// Provides At(tick) lookup to recover the sample active at any tick.
///
/// At(tick) uses a prefix-sum array for O(log n) binary-search lookup.
/// This avoids the O(n*ticks) replay cost of the previous linear scan,
/// which became quadratic for long sessions with varied input.
/// </summary>
public sealed class InputTrace
{
    private readonly IReadOnlyList<InputSpan> _spans;
    private readonly int _totalTicks;

    /// <summary>
    /// Cumulative tick offsets: _prefixSums[i] = sum of DurationTicks for spans[0..i-1].
    /// Length == _spans.Count + 1. _prefixSums[0] == 0, _prefixSums[Count] == TotalTicks.
    /// Used by At() for O(log n) binary search.
    /// </summary>
    private readonly int[] _prefixSums;

    public IReadOnlyList<InputSpan> Spans => _spans;
    public int TotalTicks => _totalTicks;

    private InputTrace(IReadOnlyList<InputSpan> spans, int totalTicks)
    {
        _spans = spans;
        _totalTicks = totalTicks;

        // Build prefix-sum array for O(log n) At() lookup
        _prefixSums = new int[spans.Count + 1];
        _prefixSums[0] = 0;
        for (int i = 0; i < spans.Count; i++)
            _prefixSums[i + 1] = _prefixSums[i] + spans[i].DurationTicks;
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
    /// O(log n) via binary search on the prefix-sum array.
    /// </summary>
    public InputSample At(int tick)
    {
        if (tick < 0 || tick >= _totalTicks)
            throw new ArgumentOutOfRangeException(nameof(tick),
                $"Tick {tick} is out of range [0, {_totalTicks}).");

        // Binary search: find span index i where _prefixSums[i] <= tick < _prefixSums[i+1]
        int lo = 0;
        int hi = _spans.Count - 1;

        while (lo < hi)
        {
            int mid = (lo + hi) / 2;
            if (_prefixSums[mid + 1] <= tick)
                lo = mid + 1;
            else
                hi = mid;
        }

        return _spans[lo].Sample;
    }
}
