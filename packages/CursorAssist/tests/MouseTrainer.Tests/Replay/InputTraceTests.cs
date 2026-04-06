using MouseTrainer.Simulation.Replay;
using Xunit;

namespace MouseTrainer.Tests.Replay;

public class InputTraceTests
{
    // ── 1. Constant input → single span ──

    [Fact]
    public void ConstantInput_CompressesToSingleSpan()
    {
        var sample = InputSample.Quantize(960f, 540f, false, false);
        var samples = Enumerable.Repeat(sample, 100).ToList();

        var trace = InputTrace.FromTickSamples(samples);

        Assert.Single(trace.Spans);
        Assert.Equal(100, trace.Spans[0].DurationTicks);
        Assert.Equal(100, trace.TotalTicks);
    }

    // ── 2. Alternating input → N spans ──

    [Fact]
    public void AlternatingInput_ProducesCorrectSpanCount()
    {
        var a = InputSample.Quantize(100f, 200f, false, false);
        var b = InputSample.Quantize(300f, 400f, false, false);

        var samples = new List<InputSample>();
        for (int i = 0; i < 10; i++)
            samples.Add(i % 2 == 0 ? a : b);

        var trace = InputTrace.FromTickSamples(samples);

        Assert.Equal(10, trace.Spans.Count);
        Assert.Equal(10, trace.TotalTicks);
        foreach (var span in trace.Spans)
            Assert.Equal(1, span.DurationTicks);
    }

    // ── 3. At() boundaries ──

    [Fact]
    public void At_ReturnsSampleAtBoundary()
    {
        var a = InputSample.Quantize(100f, 100f, false, false);
        var b = InputSample.Quantize(200f, 200f, false, false);

        // 3 ticks of A, 2 ticks of B
        var samples = new List<InputSample> { a, a, a, b, b };
        var trace = InputTrace.FromTickSamples(samples);

        Assert.Equal(a, trace.At(0));
        Assert.Equal(a, trace.At(2));
        Assert.Equal(b, trace.At(3));
        Assert.Equal(b, trace.At(4));
    }

    // ── 4. At() out of range throws ──

    [Fact]
    public void At_OutOfRange_Throws()
    {
        var sample = InputSample.Quantize(0f, 0f, false, false);
        var trace = InputTrace.FromTickSamples(new List<InputSample> { sample, sample });

        Assert.Throws<ArgumentOutOfRangeException>(() => trace.At(-1));
        Assert.Throws<ArgumentOutOfRangeException>(() => trace.At(2));
    }

    // ── 5. Round-trip identity ──

    [Fact]
    public void RoundTrip_AllSamplesRecovered()
    {
        var rng = new Random(42);
        var samples = new List<InputSample>();
        for (int i = 0; i < 200; i++)
        {
            samples.Add(InputSample.Quantize(
                rng.NextSingle() * 1920f,
                rng.NextSingle() * 1080f,
                rng.Next(2) == 1,
                rng.Next(2) == 1));
        }

        var trace = InputTrace.FromTickSamples(samples);

        Assert.Equal(200, trace.TotalTicks);
        for (int i = 0; i < 200; i++)
            Assert.Equal(samples[i], trace.At(i));
    }

    // ── 6. Empty trace ──

    [Fact]
    public void EmptyTrace_ZeroTotalTicks()
    {
        var trace = InputTrace.FromTickSamples(new List<InputSample>());
        Assert.Equal(0, trace.TotalTicks);
        Assert.Empty(trace.Spans);
    }

    // ── 7. FromSpans construction ──

    [Fact]
    public void FromSpans_CorrectTotalTicks()
    {
        var a = InputSample.Quantize(100f, 100f, false, false);
        var b = InputSample.Quantize(200f, 200f, true, false);

        var spans = new List<InputSpan>
        {
            new(5, a),
            new(3, b),
        };

        var trace = InputTrace.FromSpans(spans);

        Assert.Equal(8, trace.TotalTicks);
        Assert.Equal(2, trace.Spans.Count);
        Assert.Equal(a, trace.At(0));
        Assert.Equal(a, trace.At(4));
        Assert.Equal(b, trace.At(5));
        Assert.Equal(b, trace.At(7));
    }

    // ── 8. InputSpan validates duration ──

    [Fact]
    public void InputSpan_ZeroDuration_Throws()
    {
        var sample = InputSample.Quantize(0f, 0f, false, false);
        Assert.Throws<ArgumentOutOfRangeException>(() => new InputSpan(0, sample));
        Assert.Throws<ArgumentOutOfRangeException>(() => new InputSpan(-1, sample));
    }
}
