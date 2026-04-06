using MouseTrainer.MauiHost;
using Xunit;

namespace MouseTrainer.Tests;

public sealed class MotionAnalyzerTests
{
    private const float Dt = 1f / 60f; // 60Hz fixed timestep

    // ══════════════════════════════════════════════════════
    //  Initial state
    // ══════════════════════════════════════════════════════

    [Fact]
    public void InitialStability_IsOne()
    {
        var analyzer = new MotionAnalyzer();
        Assert.Equal(1f, analyzer.Stability);
    }

    [Fact]
    public void Reset_RestoresStabilityToOne()
    {
        var analyzer = new MotionAnalyzer();

        // Disturb it first
        analyzer.Update(0, 0, Dt);
        analyzer.Update(500, 0, Dt);
        analyzer.Update(0, 0, Dt);

        analyzer.Reset();
        Assert.Equal(1f, analyzer.Stability);
    }

    // ══════════════════════════════════════════════════════
    //  Stationary cursor
    // ══════════════════════════════════════════════════════

    [Fact]
    public void StationaryCursor_StabilityRemainsHigh()
    {
        var analyzer = new MotionAnalyzer();

        // Hold cursor still for many ticks
        for (int i = 0; i < 120; i++)
            analyzer.Update(500, 500, Dt);

        Assert.True(analyzer.Stability > 0.95f,
            $"Stationary cursor should have stability > 0.95, got {analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  Constant velocity (smooth motion)
    // ══════════════════════════════════════════════════════

    [Fact]
    public void ConstantVelocity_StabilityRemainsHigh()
    {
        var analyzer = new MotionAnalyzer();

        // Move at constant velocity: 200 px/s rightward
        float speed = 200f;
        float x = 100f;
        for (int i = 0; i < 120; i++)
        {
            analyzer.Update(x, 500, Dt);
            x += speed * Dt;
        }

        Assert.True(analyzer.Stability > 0.9f,
            $"Constant velocity should have stability > 0.9, got {analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  Sharp direction reversal
    // ══════════════════════════════════════════════════════

    [Fact]
    public void SharpReversal_StabilityDrops()
    {
        var analyzer = new MotionAnalyzer();

        // Steady rightward motion
        float x = 100f;
        for (int i = 0; i < 30; i++)
        {
            analyzer.Update(x, 500, Dt);
            x += 200f * Dt;
        }

        float stableBefore = analyzer.Stability;

        // Sharp reversal: sudden leftward
        for (int i = 0; i < 5; i++)
        {
            analyzer.Update(x, 500, Dt);
            x -= 400f * Dt;
        }

        Assert.True(analyzer.Stability < stableBefore,
            $"Sharp reversal should drop stability. Before={stableBefore}, After={analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  High acceleration
    // ══════════════════════════════════════════════════════

    [Fact]
    public void HighAcceleration_StabilityDrops()
    {
        var analyzer = new MotionAnalyzer();

        // Start still
        for (int i = 0; i < 30; i++)
            analyzer.Update(500, 500, Dt);

        float stableBefore = analyzer.Stability;

        // Sudden large displacement (high acceleration)
        analyzer.Update(900, 500, Dt);
        analyzer.Update(900, 500, Dt);

        Assert.True(analyzer.Stability < stableBefore,
            $"High acceleration should drop stability. Before={stableBefore}, After={analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  Recovery after disturbance
    // ══════════════════════════════════════════════════════

    [Fact]
    public void AfterDisturbance_StabilityRecovers()
    {
        var analyzer = new MotionAnalyzer();

        // Steady motion
        float x = 100f;
        for (int i = 0; i < 30; i++)
        {
            analyzer.Update(x, 500, Dt);
            x += 100f * Dt;
        }

        // Disturb: sharp reversal
        for (int i = 0; i < 5; i++)
        {
            analyzer.Update(x, 500, Dt);
            x -= 300f * Dt;
        }

        float disturbed = analyzer.Stability;

        // Calm down: hold still
        for (int i = 0; i < 120; i++)
            analyzer.Update(x, 500, Dt);

        Assert.True(analyzer.Stability > disturbed + 0.1f,
            $"Stability should recover after disturbance. Disturbed={disturbed}, Recovered={analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  Erratic motion (zig-zag)
    // ══════════════════════════════════════════════════════

    [Fact]
    public void ErraticZigZag_StabilityDropsSignificantly()
    {
        var analyzer = new MotionAnalyzer();

        // Seed initial position
        analyzer.Update(500, 500, Dt);

        // Zig-zag: alternating large displacements
        for (int i = 0; i < 30; i++)
        {
            float offset = (i % 2 == 0) ? 100f : -100f;
            analyzer.Update(500 + offset, 500, Dt);
        }

        Assert.True(analyzer.Stability < 0.7f,
            $"Erratic zig-zag should significantly drop stability, got {analyzer.Stability}");
    }

    // ══════════════════════════════════════════════════════
    //  Stability is always clamped to [0,1]
    // ══════════════════════════════════════════════════════

    [Fact]
    public void Stability_AlwaysClamped()
    {
        var analyzer = new MotionAnalyzer();

        // Extreme displacement
        analyzer.Update(0, 0, Dt);
        analyzer.Update(10000, 10000, Dt);
        analyzer.Update(0, 0, Dt);
        analyzer.Update(10000, 10000, Dt);

        Assert.InRange(analyzer.Stability, 0f, 1f);
    }

    // ══════════════════════════════════════════════════════
    //  Zero dt is a no-op
    // ══════════════════════════════════════════════════════

    [Fact]
    public void ZeroDt_DoesNotCrash()
    {
        var analyzer = new MotionAnalyzer();
        analyzer.Update(100, 200, 0f);
        Assert.Equal(1f, analyzer.Stability);
    }

    [Fact]
    public void NegativeDt_DoesNotCrash()
    {
        var analyzer = new MotionAnalyzer();
        analyzer.Update(100, 200, -1f);
        Assert.Equal(1f, analyzer.Stability);
    }
}
