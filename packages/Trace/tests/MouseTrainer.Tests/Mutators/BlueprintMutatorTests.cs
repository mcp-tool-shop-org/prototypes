using MouseTrainer.Domain.Runs;
using MouseTrainer.Simulation.Levels;
using MouseTrainer.Simulation.Modes.ReflexGates;
using MouseTrainer.Simulation.Mutators;
using Xunit;

namespace MouseTrainer.Tests.Mutators;

/// <summary>
/// Tests for blueprint transform mutators: correctness, composition, immutability, registry.
/// All tests use a standard blueprint generated from seed 0xC0FFEE.
/// </summary>
public class BlueprintMutatorTests
{
    // ─────────────────────────────────────────────────────
    //  1. NarrowMargin
    // ─────────────────────────────────────────────────────

    [Fact]
    public void NarrowMargin_ScalesApertureHeight()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new NarrowMarginMutator(0.75f);
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.Gates.Count, result.Gates.Count);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float expected = blueprint.Gates[i].ApertureHeight * 0.75f;
            Assert.Equal(expected, result.Gates[i].ApertureHeight);
        }
    }

    [Fact]
    public void NarrowMargin_PreservesOtherFields()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new NarrowMarginMutator(0.75f);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].WallX, result.Gates[i].WallX);
            Assert.Equal(blueprint.Gates[i].RestCenterY, result.Gates[i].RestCenterY);
            Assert.Equal(blueprint.Gates[i].Amplitude, result.Gates[i].Amplitude);
            Assert.Equal(blueprint.Gates[i].Phase, result.Gates[i].Phase);
            Assert.Equal(blueprint.Gates[i].FreqHz, result.Gates[i].FreqHz);
        }

        Assert.Equal(blueprint.PlayfieldWidth, result.PlayfieldWidth);
        Assert.Equal(blueprint.PlayfieldHeight, result.PlayfieldHeight);
        Assert.Equal(blueprint.ScrollSpeed, result.ScrollSpeed);
    }

    [Fact]
    public void NarrowMargin_InvalidFactor_Low_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new NarrowMarginMutator(0.05f));
    }

    [Fact]
    public void NarrowMargin_InvalidFactor_High_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new NarrowMarginMutator(1.5f));
    }

    [Fact]
    public void NarrowMargin_FromSpec_UsesFactorParam()
    {
        var spec = MutatorSpec.Create(MutatorId.NarrowMargin,
            parameters: new[] { new MutatorParam("factor", 0.5f) });
        var mutator = new NarrowMarginMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.Gates[0].ApertureHeight * 0.5f, result.Gates[0].ApertureHeight);
    }

    [Fact]
    public void NarrowMargin_FromSpec_DefaultsWhenNoParam()
    {
        var spec = MutatorSpec.Create(MutatorId.NarrowMargin);
        var mutator = new NarrowMarginMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.Gates[0].ApertureHeight * 0.75f, result.Gates[0].ApertureHeight);
    }

    // ─────────────────────────────────────────────────────
    //  2. WideMargin
    // ─────────────────────────────────────────────────────

    [Fact]
    public void WideMargin_ScalesApertureHeight()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new WideMarginMutator(1.4f);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float expected = blueprint.Gates[i].ApertureHeight * 1.4f;
            Assert.Equal(expected, result.Gates[i].ApertureHeight);
        }
    }

    [Fact]
    public void WideMargin_InvalidFactor_Low_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new WideMarginMutator(0.5f));
    }

    [Fact]
    public void WideMargin_InvalidFactor_High_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new WideMarginMutator(4.0f));
    }

    // ─────────────────────────────────────────────────────
    //  3. DifficultyCurve
    // ─────────────────────────────────────────────────────

    [Fact]
    public void DifficultyCurve_ZeroCurve_PreservesEndpoints()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new DifficultyCurveMutator(0f);
        var result = mutator.Apply(blueprint);

        // First and last gate are the min/max anchors — they should be preserved exactly
        Assert.Equal(blueprint.Gates[0].ApertureHeight, result.Gates[0].ApertureHeight);
        Assert.Equal(blueprint.Gates[^1].ApertureHeight, result.Gates[^1].ApertureHeight);
        Assert.Equal(blueprint.Gates[0].Amplitude, result.Gates[0].Amplitude);
        Assert.Equal(blueprint.Gates[^1].Amplitude, result.Gates[^1].Amplitude);
        Assert.Equal(blueprint.Gates[0].FreqHz, result.Gates[0].FreqHz);
        Assert.Equal(blueprint.Gates[^1].FreqHz, result.Gates[^1].FreqHz);
    }

    [Fact]
    public void DifficultyCurve_ZeroCurve_PreservesPosition()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new DifficultyCurveMutator(0f);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].WallX, result.Gates[i].WallX);
            Assert.Equal(blueprint.Gates[i].RestCenterY, result.Gates[i].RestCenterY);
            Assert.Equal(blueprint.Gates[i].Phase, result.Gates[i].Phase);
        }
    }

    [Fact]
    public void DifficultyCurve_PositiveCurve_BackLoaded()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new DifficultyCurveMutator(1.0f);
        var result = mutator.Apply(blueprint);

        // Back-loaded: middle gates should have larger apertures (easier)
        // than the original linear ramp
        int mid = blueprint.Gates.Count / 2;
        Assert.True(result.Gates[mid].ApertureHeight > blueprint.Gates[mid].ApertureHeight,
            "Positive curve should make middle gates easier (larger aperture).");
    }

    [Fact]
    public void DifficultyCurve_NegativeCurve_FrontLoaded()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new DifficultyCurveMutator(-1.0f);
        var result = mutator.Apply(blueprint);

        // Front-loaded: middle gates should have smaller apertures (harder)
        // than the original linear ramp
        int mid = blueprint.Gates.Count / 2;
        Assert.True(result.Gates[mid].ApertureHeight < blueprint.Gates[mid].ApertureHeight,
            "Negative curve should make middle gates harder (smaller aperture).");
    }

    [Fact]
    public void DifficultyCurve_EndpointsAlwaysPreserved()
    {
        // Regardless of curve value, first and last gate should match min/max
        var blueprint = CreateTestBlueprint();

        foreach (var curve in new[] { -2.0f, -1.0f, 0.5f, 1.0f, 2.0f })
        {
            var mutator = new DifficultyCurveMutator(curve);
            var result = mutator.Apply(blueprint);

            Assert.Equal(blueprint.Gates[0].ApertureHeight, result.Gates[0].ApertureHeight);
            Assert.Equal(blueprint.Gates[^1].ApertureHeight, result.Gates[^1].ApertureHeight);
        }
    }

    [Fact]
    public void DifficultyCurve_InvalidCurve_Low_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new DifficultyCurveMutator(-3.0f));
    }

    [Fact]
    public void DifficultyCurve_InvalidCurve_High_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new DifficultyCurveMutator(3.0f));
    }

    [Fact]
    public void DifficultyCurve_SingleGate_ReturnsClone()
    {
        var singleGateBlueprint = new LevelBlueprint
        {
            Gates = new[]
            {
                new Gate { WallX = 100f, RestCenterY = 540f, ApertureHeight = 200f,
                    Amplitude = 40f, Phase = 1f, FreqHz = 0.5f },
            },
            PlayfieldWidth = 1920f,
            PlayfieldHeight = 1080f,
            ScrollSpeed = 70f,
        };

        var mutator = new DifficultyCurveMutator(1.0f);
        var result = mutator.Apply(singleGateBlueprint);

        Assert.NotSame(singleGateBlueprint, result);
        Assert.Equal(singleGateBlueprint.Gates[0].ApertureHeight, result.Gates[0].ApertureHeight);
    }

    // ─────────────────────────────────────────────────────
    //  4. Blueprint immutability
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Apply_DoesNotModifyOriginalBlueprint()
    {
        var blueprint = CreateTestBlueprint();

        // Snapshot original values
        var originalApertures = new float[blueprint.Gates.Count];
        for (int i = 0; i < blueprint.Gates.Count; i++)
            originalApertures[i] = blueprint.Gates[i].ApertureHeight;

        var mutator = new NarrowMarginMutator(0.5f);
        _ = mutator.Apply(blueprint);

        // Original should be unchanged
        for (int i = 0; i < blueprint.Gates.Count; i++)
            Assert.Equal(originalApertures[i], blueprint.Gates[i].ApertureHeight);
    }

    [Fact]
    public void Apply_ReturnsDifferentBlueprintInstance()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new NarrowMarginMutator(0.75f);
        var result = mutator.Apply(blueprint);

        Assert.NotSame(blueprint, result);
    }

    // ─────────────────────────────────────────────────────
    //  5. Pipeline composition
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Pipeline_AppliesInOrder()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateDefaultRegistry();
        var pipeline = new MutatorPipeline(registry);

        // 0.5 * 2.0 = 1.0 net effect on aperture
        var specs = new[]
        {
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.5f) }),
            MutatorSpec.Create(MutatorId.WideMargin,
                parameters: new[] { new MutatorParam("factor", 2.0f) }),
        };

        var result = pipeline.Apply(blueprint, specs);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight, precision: 3);
        }
    }

    [Fact]
    public void Pipeline_OrderMatters()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateDefaultRegistry();
        var pipeline = new MutatorPipeline(registry);

        // Two DifficultyCurve mutators with different values.
        // The second curve re-interpolates from the output of the first,
        // so the order genuinely matters for intermediate gate values.
        var specsAB = new[]
        {
            MutatorSpec.Create(MutatorId.DifficultyCurve,
                parameters: new[] { new MutatorParam("curve", 1.5f) }),
            MutatorSpec.Create(MutatorId.DifficultyCurve,
                parameters: new[] { new MutatorParam("curve", -1.0f) }),
        };

        var specsBA = new[]
        {
            MutatorSpec.Create(MutatorId.DifficultyCurve,
                parameters: new[] { new MutatorParam("curve", -1.0f) }),
            MutatorSpec.Create(MutatorId.DifficultyCurve,
                parameters: new[] { new MutatorParam("curve", 1.5f) }),
        };

        var resultAB = pipeline.Apply(blueprint, specsAB);
        var resultBA = pipeline.Apply(blueprint, specsBA);

        // Different ordering should produce different intermediate gate values.
        // Endpoints (gate 0 and N-1) are always preserved at min/max, but middle gates differ.
        bool anyDiffer = false;
        for (int i = 1; i < resultAB.Gates.Count - 1; i++)
        {
            if (MathF.Abs(resultAB.Gates[i].ApertureHeight - resultBA.Gates[i].ApertureHeight) > 0.001f)
            {
                anyDiffer = true;
                break;
            }
        }

        Assert.True(anyDiffer, "Different mutator orders should produce different results.");
    }

    [Fact]
    public void Pipeline_EmptySpecs_ReturnsInputUnchanged()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateDefaultRegistry();
        var pipeline = new MutatorPipeline(registry);

        var result = pipeline.Apply(blueprint, Array.Empty<MutatorSpec>());

        Assert.Same(blueprint, result);
    }

    [Fact]
    public void Pipeline_NarrowAppliedTwice_IsNotIdempotent()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateDefaultRegistry();
        var pipeline = new MutatorPipeline(registry);

        var specs = new[]
        {
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.75f) }),
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.75f) }),
        };

        var result = pipeline.Apply(blueprint, specs);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float expected = blueprint.Gates[i].ApertureHeight * 0.75f * 0.75f;
            Assert.Equal(expected, result.Gates[i].ApertureHeight, precision: 3);
        }
    }

    // ─────────────────────────────────────────────────────
    //  6. Registry
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Registry_UnknownMutator_Throws()
    {
        var registry = new MutatorRegistry();
        var spec = MutatorSpec.Create(new MutatorId("Unknown"));

        Assert.Throws<InvalidOperationException>(() => registry.Resolve(spec));
    }

    [Fact]
    public void Registry_WrongVersion_Throws()
    {
        var registry = CreateDefaultRegistry();
        var spec = MutatorSpec.Create(MutatorId.NarrowMargin, version: 99);

        Assert.Throws<InvalidOperationException>(() => registry.Resolve(spec));
    }

    [Fact]
    public void Registry_ResolvesCorrectMutator()
    {
        var registry = CreateDefaultRegistry();
        var spec = MutatorSpec.Create(MutatorId.NarrowMargin);

        var mutator = registry.Resolve(spec);

        Assert.IsType<NarrowMarginMutator>(mutator);
    }

    // ─────────────────────────────────────────────────────
    //  7. RhythmLock
    // ─────────────────────────────────────────────────────

    [Fact]
    public void RhythmLock_QuantizesToNearestDivision()
    {
        // div=4 → step = π/2, allowed phases: {0, π/2, π, 3π/2}
        var mutator = new RhythmLockMutator(4);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        float step = 2f * MathF.PI / 4f;

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float phase = result.Gates[i].Phase;

            // Phase must be one of the allowed values: k * step for k in {0, 1, 2, 3}
            float k = phase / step;
            float roundedK = MathF.Round(k);
            Assert.True(MathF.Abs(k - roundedK) < 0.001f,
                $"Gate {i}: phase {phase} is not a multiple of step {step}. k={k}");
        }
    }

    [Fact]
    public void RhythmLock_PreservesAllOtherFields()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new RhythmLockMutator(4);
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.Gates.Count, result.Gates.Count);
        Assert.Equal(blueprint.PlayfieldWidth, result.PlayfieldWidth);
        Assert.Equal(blueprint.PlayfieldHeight, result.PlayfieldHeight);
        Assert.Equal(blueprint.ScrollSpeed, result.ScrollSpeed);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].WallX, result.Gates[i].WallX);
            Assert.Equal(blueprint.Gates[i].RestCenterY, result.Gates[i].RestCenterY);
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight);
            Assert.Equal(blueprint.Gates[i].Amplitude, result.Gates[i].Amplitude);
            Assert.Equal(blueprint.Gates[i].FreqHz, result.Gates[i].FreqHz);
        }
    }

    [Fact]
    public void RhythmLock_IsIdempotent()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new RhythmLockMutator(4);
        var once = mutator.Apply(blueprint);
        var twice = mutator.Apply(once);

        for (int i = 0; i < once.Gates.Count; i++)
        {
            Assert.Equal(once.Gates[i].Phase, twice.Gates[i].Phase);
        }
    }

    [Fact]
    public void RhythmLock_PhaseInRange()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new RhythmLockMutator(4);
        var result = mutator.Apply(blueprint);

        float twoPi = 2f * MathF.PI;
        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.True(result.Gates[i].Phase >= 0f,
                $"Gate {i}: phase {result.Gates[i].Phase} < 0");
            Assert.True(result.Gates[i].Phase < twoPi + 0.001f,
                $"Gate {i}: phase {result.Gates[i].Phase} >= 2π");
        }
    }

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(6)]
    [InlineData(8)]
    public void RhythmLock_AllowedDivisions_Succeed(int divisions)
    {
        var mutator = new RhythmLockMutator(divisions);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        float step = 2f * MathF.PI / divisions;

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float k = result.Gates[i].Phase / step;
            float roundedK = MathF.Round(k);
            Assert.True(MathF.Abs(k - roundedK) < 0.001f,
                $"div={divisions}, Gate {i}: phase not quantized. k={k}");
        }
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(7)]
    [InlineData(10)]
    public void RhythmLock_DisallowedDivisions_Throws(int divisions)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new RhythmLockMutator(divisions));
    }

    [Fact]
    public void RhythmLock_FromSpec_UsesDivParam()
    {
        var spec = MutatorSpec.Create(MutatorId.RhythmLock,
            parameters: new[] { new MutatorParam("div", 6f) });
        var mutator = new RhythmLockMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        float step = 2f * MathF.PI / 6f;

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float k = result.Gates[i].Phase / step;
            float roundedK = MathF.Round(k);
            Assert.True(MathF.Abs(k - roundedK) < 0.001f,
                $"Gate {i}: phase not quantized to div=6. k={k}");
        }
    }

    [Fact]
    public void RhythmLock_FromSpec_DefaultsWhenNoParam()
    {
        var spec = MutatorSpec.Create(MutatorId.RhythmLock);
        var mutator = new RhythmLockMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        // Default is div=4 → step = π/2
        float step = 2f * MathF.PI / 4f;

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float k = result.Gates[i].Phase / step;
            float roundedK = MathF.Round(k);
            Assert.True(MathF.Abs(k - roundedK) < 0.001f,
                $"Gate {i}: phase not quantized with default div=4. k={k}");
        }
    }

    // ─────────────────────────────────────────────────────
    //  8. GateJitter
    // ─────────────────────────────────────────────────────

    [Fact]
    public void GateJitter_ModifiesRestCenterY()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(0.5f);
        var result = mutator.Apply(blueprint);

        // At least some gates should have different RestCenterY
        bool anyDifferent = false;
        for (int i = 0; i < result.Gates.Count; i++)
        {
            if (MathF.Abs(result.Gates[i].RestCenterY - blueprint.Gates[i].RestCenterY) > 0.001f)
            {
                anyDifferent = true;
                break;
            }
        }
        Assert.True(anyDifferent, "GateJitter should modify at least some RestCenterY values.");
    }

    [Fact]
    public void GateJitter_PreservesOtherFields()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(0.5f);
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.Gates.Count, result.Gates.Count);
        Assert.Equal(blueprint.PlayfieldWidth, result.PlayfieldWidth);
        Assert.Equal(blueprint.PlayfieldHeight, result.PlayfieldHeight);
        Assert.Equal(blueprint.ScrollSpeed, result.ScrollSpeed);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].WallX, result.Gates[i].WallX);
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight);
            Assert.Equal(blueprint.Gates[i].Amplitude, result.Gates[i].Amplitude);
            Assert.Equal(blueprint.Gates[i].Phase, result.Gates[i].Phase);
            Assert.Equal(blueprint.Gates[i].FreqHz, result.Gates[i].FreqHz);
        }
    }

    [Fact]
    public void GateJitter_OffsetBoundedByMaxJitter()
    {
        // At max strength, offset should not exceed MaxJitterPx (25f)
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(1.0f);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float offset = MathF.Abs(result.Gates[i].RestCenterY - blueprint.Gates[i].RestCenterY);
            Assert.True(offset <= 25f + 0.01f,
                $"Gate {i}: offset {offset} exceeds max jitter of 25px.");
        }
    }

    [Fact]
    public void GateJitter_ZeroStrength_NoChange()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(0f);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].RestCenterY, result.Gates[i].RestCenterY);
        }
    }

    [Fact]
    public void GateJitter_RespectsCorridorMargins()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(1.0f);
        var result = mutator.Apply(blueprint);

        float corridorMargin = 10f;

        for (int i = 0; i < result.Gates.Count; i++)
        {
            float halfAperture = result.Gates[i].ApertureHeight * 0.5f;
            float minY = halfAperture + corridorMargin;
            float maxY = blueprint.PlayfieldHeight - halfAperture - corridorMargin;

            if (minY <= maxY)
            {
                Assert.True(result.Gates[i].RestCenterY >= minY - 0.01f,
                    $"Gate {i}: centerY {result.Gates[i].RestCenterY} below corridor min {minY}.");
                Assert.True(result.Gates[i].RestCenterY <= maxY + 0.01f,
                    $"Gate {i}: centerY {result.Gates[i].RestCenterY} above corridor max {maxY}.");
            }
        }
    }

    [Fact]
    public void GateJitter_Deterministic()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new GateJitterMutator(0.5f);
        var resultA = mutator.Apply(blueprint);
        var resultB = mutator.Apply(blueprint);

        for (int i = 0; i < resultA.Gates.Count; i++)
        {
            Assert.Equal(resultA.Gates[i].RestCenterY, resultB.Gates[i].RestCenterY);
        }
    }

    [Fact]
    public void GateJitter_InvalidStrength_Low_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new GateJitterMutator(-0.1f));
    }

    [Fact]
    public void GateJitter_InvalidStrength_High_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new GateJitterMutator(1.1f));
    }

    [Fact]
    public void GateJitter_FromSpec_UsesStrParam()
    {
        var spec = MutatorSpec.Create(MutatorId.GateJitter,
            parameters: new[] { new MutatorParam("str", 0.7f) });
        var mutator = new GateJitterMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        // At str=0.7, some offsets should be nonzero
        bool anyDifferent = false;
        for (int i = 0; i < result.Gates.Count; i++)
        {
            if (MathF.Abs(result.Gates[i].RestCenterY - blueprint.Gates[i].RestCenterY) > 0.001f)
            {
                anyDifferent = true;
                break;
            }
        }
        Assert.True(anyDifferent, "GateJitter str=0.7 should modify at least some gates.");
    }

    [Fact]
    public void GateJitter_FromSpec_DefaultsWhenNoParam()
    {
        var spec = MutatorSpec.Create(MutatorId.GateJitter);
        var mutator = new GateJitterMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        // Default str=0.35, should still produce offsets
        bool anyDifferent = false;
        for (int i = 0; i < result.Gates.Count; i++)
        {
            if (MathF.Abs(result.Gates[i].RestCenterY - blueprint.Gates[i].RestCenterY) > 0.001f)
            {
                anyDifferent = true;
                break;
            }
        }
        Assert.True(anyDifferent, "GateJitter default should modify at least some gates.");
    }

    // ─────────────────────────────────────────────────────
    //  9. Pipeline — RhythmLock + GateJitter composition
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Pipeline_RhythmLockThenJitter_OrderMatters()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateFullRegistry();
        var pipeline = new MutatorPipeline(registry);

        // RhythmLock changes Phase, which feeds into GateJitter's sin() offset.
        // So order should matter.
        var specsAB = new[]
        {
            MutatorSpec.Create(MutatorId.RhythmLock),
            MutatorSpec.Create(MutatorId.GateJitter),
        };

        var specsBA = new[]
        {
            MutatorSpec.Create(MutatorId.GateJitter),
            MutatorSpec.Create(MutatorId.RhythmLock),
        };

        var resultAB = pipeline.Apply(blueprint, specsAB);
        var resultBA = pipeline.Apply(blueprint, specsBA);

        // RhythmLock modifies Phase; GateJitter reads Phase for offset calculation.
        // In AB: quantized phases feed into jitter → different offsets than BA.
        // In BA: jitter uses original phases, then RhythmLock quantizes unchanged phases.
        // Phase values should be the same (RhythmLock is last in BA, only in AB),
        // but RestCenterY should differ because jitter input phases differ.
        bool anyDiffer = false;
        for (int i = 0; i < resultAB.Gates.Count; i++)
        {
            if (MathF.Abs(resultAB.Gates[i].RestCenterY - resultBA.Gates[i].RestCenterY) > 0.001f)
            {
                anyDiffer = true;
                break;
            }
        }

        Assert.True(anyDiffer,
            "RhythmLock+GateJitter vs GateJitter+RhythmLock should produce different RestCenterY values.");
    }

    [Fact]
    public void Pipeline_JitterThenNarrow_PreservesBothEffects()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateFullRegistry();
        var pipeline = new MutatorPipeline(registry);

        var specs = new[]
        {
            MutatorSpec.Create(MutatorId.GateJitter,
                parameters: new[] { new MutatorParam("str", 0.5f) }),
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.5f) }),
        };

        var result = pipeline.Apply(blueprint, specs);

        // NarrowMargin should halve aperture heights
        for (int i = 0; i < result.Gates.Count; i++)
        {
            // The aperture should be half of original (NarrowMargin 0.5)
            Assert.Equal(blueprint.Gates[i].ApertureHeight * 0.5f, result.Gates[i].ApertureHeight, precision: 3);
        }

        // GateJitter should have modified at least some RestCenterY values
        bool anyDifferent = false;
        for (int i = 0; i < result.Gates.Count; i++)
        {
            if (MathF.Abs(result.Gates[i].RestCenterY - blueprint.Gates[i].RestCenterY) > 0.001f)
            {
                anyDifferent = true;
                break;
            }
        }
        Assert.True(anyDifferent, "GateJitter should have modified RestCenterY before NarrowMargin.");
    }

    // ─────────────────────────────────────────────────────
    //  10. Registry — new mutators resolve correctly
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Registry_ResolvesRhythmLock()
    {
        var registry = CreateFullRegistry();
        var spec = MutatorSpec.Create(MutatorId.RhythmLock);
        var mutator = registry.Resolve(spec);
        Assert.IsType<RhythmLockMutator>(mutator);
    }

    [Fact]
    public void Registry_ResolvesGateJitter()
    {
        var registry = CreateFullRegistry();
        var spec = MutatorSpec.Create(MutatorId.GateJitter);
        var mutator = registry.Resolve(spec);
        Assert.IsType<GateJitterMutator>(mutator);
    }

    // ─────────────────────────────────────────────────────
    //  11. SegmentBias
    // ─────────────────────────────────────────────────────

    [Fact]
    public void SegmentBias_EvenPartition_12Gates_3Segments()
    {
        // N=12, S=3 → 4 gates per segment
        // Crescendo (shape=0): seg0 d=-1 (easier), seg1 d=0, seg2 d=+1 (harder)
        // At amt=0.5: seg0 apertureMul=1.5, seg1 apertureMul=1.0, seg2 apertureMul=0.5
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 0);
        var result = mutator.Apply(blueprint);

        // Seg 0 (gates 0-3): easier → aperture should increase
        for (int i = 0; i < 4; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight > blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 0): should have wider aperture. Got {result.Gates[i].ApertureHeight} vs {blueprint.Gates[i].ApertureHeight}");
        }

        // Seg 1 (gates 4-7): neutral → aperture unchanged
        for (int i = 4; i < 8; i++)
        {
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight, precision: 3);
        }

        // Seg 2 (gates 8-11): harder → aperture should decrease
        for (int i = 8; i < 12; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight < blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 2): should have narrower aperture. Got {result.Gates[i].ApertureHeight} vs {blueprint.Gates[i].ApertureHeight}");
        }
    }

    [Fact]
    public void SegmentBias_UnevenPartition_11Gates_3Segments()
    {
        // N=11, S=3: seg = floor(i * 3 / 11)
        // i=0: 0, i=1: 0, i=2: 0, i=3: 0 (floor(9/11)=0)
        // i=4: 1 (floor(12/11)=1), i=5: 1, i=6: 1, i=7: 1 (floor(21/11)=1)
        // i=8: 2 (floor(24/11)=2), i=9: 2, i=10: 2
        // So: 4, 4, 3 gates per segment
        var blueprint = CreateBlueprintWithGateCount(11);
        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 0);
        var result = mutator.Apply(blueprint);

        // Seg 0 (gates 0-3): d=-1, easier
        for (int i = 0; i < 4; i++)
            Assert.True(result.Gates[i].ApertureHeight > blueprint.Gates[i].ApertureHeight);

        // Seg 1 (gates 4-7): d=0, neutral
        for (int i = 4; i < 8; i++)
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight, precision: 3);

        // Seg 2 (gates 8-10): d=+1, harder
        for (int i = 8; i < 11; i++)
            Assert.True(result.Gates[i].ApertureHeight < blueprint.Gates[i].ApertureHeight);
    }

    [Fact]
    public void SegmentBias_Crescendo_EarlyEasierLateHarder()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 2, amount: 0.5f, shape: 0);
        var result = mutator.Apply(blueprint);

        // Seg 0 (first half): d=-1, apertureMul=1.5, easier
        // Seg 1 (second half): d=+1, apertureMul=0.5, harder
        float firstHalfAvgAperture = 0f;
        float secondHalfAvgAperture = 0f;
        int half = blueprint.Gates.Count / 2;

        for (int i = 0; i < half; i++)
            firstHalfAvgAperture += result.Gates[i].ApertureHeight;
        for (int i = half; i < blueprint.Gates.Count; i++)
            secondHalfAvgAperture += result.Gates[i].ApertureHeight;

        firstHalfAvgAperture /= half;
        secondHalfAvgAperture /= (blueprint.Gates.Count - half);

        Assert.True(firstHalfAvgAperture > secondHalfAvgAperture,
            "Crescendo: first half should have wider apertures than second half.");
    }

    [Fact]
    public void SegmentBias_Valley_MiddleHardest()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 1);
        var result = mutator.Apply(blueprint);

        // Valley shape: d={-1, +1, -1} for S=3
        // Middle segment (gates 4-7) should be harder (narrower aperture)
        // than the end segments
        float seg0AvgAperture = 0f;
        float seg1AvgAperture = 0f;

        for (int i = 0; i < 4; i++)
            seg0AvgAperture += result.Gates[i].ApertureHeight;
        for (int i = 4; i < 8; i++)
            seg1AvgAperture += result.Gates[i].ApertureHeight;

        seg0AvgAperture /= 4f;
        seg1AvgAperture /= 4f;

        Assert.True(seg0AvgAperture > seg1AvgAperture,
            "Valley: end segments should have wider apertures than middle.");
    }

    [Fact]
    public void SegmentBias_Wave_Alternating()
    {
        // Use S=4 for a meaningful wave pattern: d={-1, +1, -1, +1}
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 4, amount: 0.5f, shape: 2);
        var result = mutator.Apply(blueprint);

        // N=12, S=4 → 3 gates per segment
        // Seg 0 (gates 0-2): d=-1 (easier), Seg 1 (gates 3-5): d=+1 (harder)
        // Seg 2 (gates 6-8): d=-1 (easier), Seg 3 (gates 9-11): d=+1 (harder)
        for (int i = 0; i < 3; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight > blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 0, even): should be easier (wider).");
        }
        for (int i = 3; i < 6; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight < blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 1, odd): should be harder (narrower).");
        }
        for (int i = 6; i < 9; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight > blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 2, even): should be easier (wider).");
        }
        for (int i = 9; i < 12; i++)
        {
            Assert.True(result.Gates[i].ApertureHeight < blueprint.Gates[i].ApertureHeight,
                $"Gate {i} (seg 3, odd): should be harder (narrower).");
        }
    }

    [Fact]
    public void SegmentBias_PreservesPosition()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 0);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].WallX, result.Gates[i].WallX);
            Assert.Equal(blueprint.Gates[i].RestCenterY, result.Gates[i].RestCenterY);
            Assert.Equal(blueprint.Gates[i].Phase, result.Gates[i].Phase);
        }
    }

    [Fact]
    public void SegmentBias_PreservesBlueprintMetadata()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator();
        var result = mutator.Apply(blueprint);

        Assert.Equal(blueprint.PlayfieldWidth, result.PlayfieldWidth);
        Assert.Equal(blueprint.PlayfieldHeight, result.PlayfieldHeight);
        Assert.Equal(blueprint.ScrollSpeed, result.ScrollSpeed);
        Assert.Equal(blueprint.Gates.Count, result.Gates.Count);
    }

    [Fact]
    public void SegmentBias_ZeroAmount_NoChange()
    {
        var blueprint = CreateTestBlueprint();
        var mutator = new SegmentBiasMutator(segments: 3, amount: 0f, shape: 0);
        var result = mutator.Apply(blueprint);

        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].ApertureHeight, result.Gates[i].ApertureHeight);
            Assert.Equal(blueprint.Gates[i].Amplitude, result.Gates[i].Amplitude);
            Assert.Equal(blueprint.Gates[i].FreqHz, result.Gates[i].FreqHz);
        }
    }

    [Fact]
    public void SegmentBias_SingleGate_ReturnsClone()
    {
        var singleGateBlueprint = new LevelBlueprint
        {
            Gates = new[]
            {
                new Gate { WallX = 100f, RestCenterY = 540f, ApertureHeight = 200f,
                    Amplitude = 40f, Phase = 1f, FreqHz = 0.5f },
            },
            PlayfieldWidth = 1920f,
            PlayfieldHeight = 1080f,
            ScrollSpeed = 70f,
        };

        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 0);
        var result = mutator.Apply(singleGateBlueprint);

        Assert.NotSame(singleGateBlueprint, result);
        Assert.Equal(singleGateBlueprint.Gates[0].ApertureHeight, result.Gates[0].ApertureHeight);
        Assert.Equal(singleGateBlueprint.Gates[0].Amplitude, result.Gates[0].Amplitude);
        Assert.Equal(singleGateBlueprint.Gates[0].FreqHz, result.Gates[0].FreqHz);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(5)]
    public void SegmentBias_InvalidSegments_Throws(int segments)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new SegmentBiasMutator(segments: segments));
    }

    [Fact]
    public void SegmentBias_InvalidAmount_Low_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new SegmentBiasMutator(amount: -0.1f));
    }

    [Fact]
    public void SegmentBias_InvalidAmount_High_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new SegmentBiasMutator(amount: 1.1f));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(3)]
    public void SegmentBias_InvalidShape_Throws(int shape)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new SegmentBiasMutator(shape: shape));
    }

    [Fact]
    public void SegmentBias_FromSpec_ReadsParams()
    {
        var spec = MutatorSpec.Create(MutatorId.SegmentBias,
            parameters: new[]
            {
                new MutatorParam("amt", 0.5f),
                new MutatorParam("seg", 2f),
                new MutatorParam("shape", 1f),
            });
        var mutator = new SegmentBiasMutator(spec);
        var blueprint = CreateTestBlueprint();
        var result = mutator.Apply(blueprint);

        // Valley shape with 2 segments: d={-1, -1} → both segments easier
        // Wait — S=2, valley: t=0→d=-1, t=1→d=-1. Both segments get d=-1.
        // apertureMul = 1 - 0.5*(-1) = 1.5 for both segments.
        // All gates should be 1.5× wider.
        for (int i = 0; i < result.Gates.Count; i++)
        {
            Assert.Equal(blueprint.Gates[i].ApertureHeight * 1.5f, result.Gates[i].ApertureHeight, precision: 3);
        }
    }

    [Fact]
    public void SegmentBias_FromSpec_DefaultsWhenNoParams()
    {
        var spec = MutatorSpec.Create(MutatorId.SegmentBias);
        var specMutator = new SegmentBiasMutator(spec);
        var directMutator = new SegmentBiasMutator();
        var blueprint = CreateTestBlueprint();

        var specResult = specMutator.Apply(blueprint);
        var directResult = directMutator.Apply(blueprint);

        for (int i = 0; i < specResult.Gates.Count; i++)
        {
            Assert.Equal(directResult.Gates[i].ApertureHeight, specResult.Gates[i].ApertureHeight);
            Assert.Equal(directResult.Gates[i].Amplitude, specResult.Gates[i].Amplitude);
            Assert.Equal(directResult.Gates[i].FreqHz, specResult.Gates[i].FreqHz);
        }
    }

    [Fact]
    public void SegmentBias_ApertureClampedToMinimum()
    {
        // Create blueprint with small aperture, apply max bias to make apertureMul = 0
        var blueprint = new LevelBlueprint
        {
            Gates = new[]
            {
                new Gate { WallX = 100f, RestCenterY = 540f, ApertureHeight = 25f,
                    Amplitude = 40f, Phase = 1f, FreqHz = 0.5f },
                new Gate { WallX = 200f, RestCenterY = 540f, ApertureHeight = 25f,
                    Amplitude = 40f, Phase = 2f, FreqHz = 0.5f },
            },
            PlayfieldWidth = 1920f,
            PlayfieldHeight = 1080f,
            ScrollSpeed = 70f,
        };

        // Crescendo, S=2, amt=1.0: seg 0 d=-1 (apertureMul=2), seg 1 d=+1 (apertureMul=0)
        var mutator = new SegmentBiasMutator(segments: 2, amount: 1.0f, shape: 0);
        var result = mutator.Apply(blueprint);

        // Gate 1 (seg 1): aperture * 0 would be 0, but should clamp to 20f
        Assert.Equal(20f, result.Gates[1].ApertureHeight);

        // Gate 0 (seg 0): aperture * 2.0 = 50f (no clamp needed)
        Assert.Equal(50f, result.Gates[0].ApertureHeight);
    }

    [Fact]
    public void SegmentBias_Pipeline_OrderMatters()
    {
        var blueprint = CreateTestBlueprint();
        var registry = CreateFullRegistry();
        var pipeline = new MutatorPipeline(registry);

        // SegmentBias(amt=1.0, crescendo) then NarrowMargin(0.1)
        var specsAB = new[]
        {
            MutatorSpec.Create(MutatorId.SegmentBias,
                parameters: new[] { new MutatorParam("amt", 1.0f) }),
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.1f) }),
        };

        // NarrowMargin(0.1) then SegmentBias(amt=1.0, crescendo)
        var specsBA = new[]
        {
            MutatorSpec.Create(MutatorId.NarrowMargin,
                parameters: new[] { new MutatorParam("factor", 0.1f) }),
            MutatorSpec.Create(MutatorId.SegmentBias,
                parameters: new[] { new MutatorParam("amt", 1.0f) }),
        };

        var resultAB = pipeline.Apply(blueprint, specsAB);
        var resultBA = pipeline.Apply(blueprint, specsBA);

        // With extreme params, the 20px aperture floor clamp in SegmentBias
        // causes different results depending on order.
        // AB: SegmentBias creates some apertures near 0→clamp to 20, then NarrowMargin scales to 2.
        // BA: NarrowMargin first reduces to 10-20px range, then SegmentBias clamps more gates to 20.
        bool anyDiffer = false;
        for (int i = 0; i < resultAB.Gates.Count; i++)
        {
            if (MathF.Abs(resultAB.Gates[i].ApertureHeight - resultBA.Gates[i].ApertureHeight) > 0.001f)
            {
                anyDiffer = true;
                break;
            }
        }

        Assert.True(anyDiffer,
            "SegmentBias+NarrowMargin vs NarrowMargin+SegmentBias should produce different results.");
    }

    [Fact]
    public void SegmentBias_OriginalBlueprintUnchanged()
    {
        var blueprint = CreateTestBlueprint();

        var originalApertures = new float[blueprint.Gates.Count];
        var originalAmplitudes = new float[blueprint.Gates.Count];
        var originalFreqs = new float[blueprint.Gates.Count];
        for (int i = 0; i < blueprint.Gates.Count; i++)
        {
            originalApertures[i] = blueprint.Gates[i].ApertureHeight;
            originalAmplitudes[i] = blueprint.Gates[i].Amplitude;
            originalFreqs[i] = blueprint.Gates[i].FreqHz;
        }

        var mutator = new SegmentBiasMutator(segments: 3, amount: 0.5f, shape: 0);
        _ = mutator.Apply(blueprint);

        for (int i = 0; i < blueprint.Gates.Count; i++)
        {
            Assert.Equal(originalApertures[i], blueprint.Gates[i].ApertureHeight);
            Assert.Equal(originalAmplitudes[i], blueprint.Gates[i].Amplitude);
            Assert.Equal(originalFreqs[i], blueprint.Gates[i].FreqHz);
        }
    }

    // ─────────────────────────────────────────────────────
    //  12. Registry — SegmentBias resolves
    // ─────────────────────────────────────────────────────

    [Fact]
    public void Registry_ResolvesSegmentBias()
    {
        var registry = CreateFullRegistry();
        var spec = MutatorSpec.Create(MutatorId.SegmentBias);
        var mutator = registry.Resolve(spec);
        Assert.IsType<SegmentBiasMutator>(mutator);
    }

    // ─────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────

    private static LevelBlueprint CreateTestBlueprint()
    {
        var generator = new ReflexGateGenerator();
        var run = RunDescriptor.Create(ModeId.ReflexGates, 0xC0FFEEu);
        return generator.Generate(run);
    }

    private static LevelBlueprint CreateBlueprintWithGateCount(int gateCount)
    {
        var gates = new Gate[gateCount];
        for (int i = 0; i < gateCount; i++)
        {
            float t = gateCount <= 1 ? 0f : (float)i / (gateCount - 1);
            gates[i] = new Gate
            {
                WallX = 400f + i * 150f,
                RestCenterY = 540f,
                ApertureHeight = 200f - t * 100f,  // 200 → 100 linear ramp
                Amplitude = 20f + t * 40f,          // 20 → 60 linear ramp
                Phase = i * 0.5f,
                FreqHz = 0.3f + t * 0.4f,           // 0.3 → 0.7 linear ramp
            };
        }

        return new LevelBlueprint
        {
            Gates = gates,
            PlayfieldWidth = 1920f,
            PlayfieldHeight = 1080f,
            ScrollSpeed = 70f,
        };
    }

    private static MutatorRegistry CreateDefaultRegistry()
    {
        var registry = new MutatorRegistry();
        registry.Register(MutatorId.NarrowMargin, 1, spec => new NarrowMarginMutator(spec));
        registry.Register(MutatorId.WideMargin, 1, spec => new WideMarginMutator(spec));
        registry.Register(MutatorId.DifficultyCurve, 1, spec => new DifficultyCurveMutator(spec));
        return registry;
    }

    private static MutatorRegistry CreateFullRegistry()
    {
        var registry = CreateDefaultRegistry();
        registry.Register(MutatorId.RhythmLock, 1, spec => new RhythmLockMutator(spec));
        registry.Register(MutatorId.GateJitter, 1, spec => new GateJitterMutator(spec));
        registry.Register(MutatorId.SegmentBias, 1, spec => new SegmentBiasMutator(spec));
        return registry;
    }
}
