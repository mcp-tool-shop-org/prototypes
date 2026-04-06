using MouseTrainer.Simulation.Replay;
using Xunit;

namespace MouseTrainer.Tests.Replay;

public class QuantizationTests
{
    // ── 1. Round-trip fidelity ──

    [Theory]
    [InlineData(960f, 540f)]
    [InlineData(0f, 0f)]
    [InlineData(1920f, 1080f)]
    [InlineData(123.45f, 678.9f)]
    public void RoundTrip_ErrorBelowThreshold(float x, float y)
    {
        var sample = InputSample.Quantize(x, y, false, false);
        var (dx, dy) = sample.Dequantize();

        Assert.True(MathF.Abs(x - dx) < 0.05f, $"X error: {MathF.Abs(x - dx)}");
        Assert.True(MathF.Abs(y - dy) < 0.05f, $"Y error: {MathF.Abs(y - dy)}");
    }

    // ── 2. Edge values within Int16 range ──

    [Fact]
    public void EdgeValues_WithinInt16Range()
    {
        // 1920 * 10 = 19200, well within Int16.MaxValue (32767)
        var sample = InputSample.Quantize(1920f, 1080f, false, false);
        Assert.Equal((short)19200, sample.X);
        Assert.Equal((short)10800, sample.Y);
    }

    // ── 3. Zero coordinates ──

    [Fact]
    public void Zero_Quantizes_ToZero()
    {
        var sample = InputSample.Quantize(0f, 0f, false, false);
        Assert.Equal((short)0, sample.X);
        Assert.Equal((short)0, sample.Y);
        Assert.Equal((byte)0, sample.Buttons);
    }

    // ── 4. Button encoding ──

    [Theory]
    [InlineData(true, false, 0x01)]
    [InlineData(false, true, 0x02)]
    [InlineData(true, true, 0x03)]
    [InlineData(false, false, 0x00)]
    public void ButtonEncoding_CorrectBitFlags(bool primary, bool secondary, byte expected)
    {
        var sample = InputSample.Quantize(0f, 0f, primary, secondary);
        Assert.Equal(expected, sample.Buttons);
        Assert.Equal(primary, sample.PrimaryDown);
        Assert.Equal(secondary, sample.SecondaryDown);
    }

    // ── 5. Negative coordinates ──

    [Fact]
    public void NegativeCoordinates_QuantizeCorrectly()
    {
        var sample = InputSample.Quantize(-10f, -5f, false, false);
        Assert.Equal((short)-100, sample.X);
        Assert.Equal((short)-50, sample.Y);
        var (dx, dy) = sample.Dequantize();
        Assert.Equal(-10f, dx);
        Assert.Equal(-5f, dy);
    }
}
