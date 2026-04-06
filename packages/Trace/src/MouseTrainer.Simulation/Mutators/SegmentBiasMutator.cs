using MouseTrainer.Domain.Runs;
using MouseTrainer.Simulation.Levels;
using MouseTrainer.Simulation.Modes.ReflexGates;

namespace MouseTrainer.Simulation.Mutators;

/// <summary>
/// Divides gates into segments ("acts") and applies per-segment difficulty bias.
/// Creates narrative pacing: crescendo (late harder), valley (mid hardest), or wave (alternating).
/// Parameters: "seg" (int-as-float, {2,3,4}, default 3), "amt" (float, [0,1], default 0.35),
/// "shape" (int-as-float, {0,1,2}, default 0).
/// Shape 0 = crescendo (d ramps -1→+1), Shape 1 = valley (d peaks +1 at center),
/// Shape 2 = wave (alternating -1/+1).
/// Modifies ApertureHeight, Amplitude, FreqHz via relative multiplication.
/// Preserves WallX, RestCenterY, Phase. NOT idempotent.
/// </summary>
public sealed class SegmentBiasMutator : IBlueprintMutator
{
    private static readonly HashSet<int> AllowedSegments = new() { 2, 3, 4 };
    private static readonly HashSet<int> AllowedShapes = new() { 0, 1, 2 };

    /// <summary>Minimum aperture height in virtual pixels (prevents impassable gates).</summary>
    private const float MinApertureHeight = 20f;

    private readonly int _segments;
    private readonly float _amount;
    private readonly int _shape;

    public SegmentBiasMutator(int segments = 3, float amount = 0.35f, int shape = 0)
    {
        if (!AllowedSegments.Contains(segments))
            throw new ArgumentOutOfRangeException(nameof(segments),
                $"SegmentBias segments must be one of {{2, 3, 4}}. Got: {segments}");
        if (amount < 0f || amount > 1f)
            throw new ArgumentOutOfRangeException(nameof(amount),
                $"SegmentBias amount must be in [0, 1]. Got: {amount}");
        if (!AllowedShapes.Contains(shape))
            throw new ArgumentOutOfRangeException(nameof(shape),
                $"SegmentBias shape must be one of {{0, 1, 2}}. Got: {shape}");

        _segments = segments;
        _amount = amount;
        _shape = shape;
    }

    public SegmentBiasMutator(MutatorSpec spec)
        : this(GetSegments(spec), GetAmount(spec), GetShape(spec)) { }

    public LevelBlueprint Apply(LevelBlueprint blueprint)
    {
        int n = blueprint.Gates.Count;
        if (n <= 1)
            return CloneBlueprint(blueprint);

        var gates = new Gate[n];
        for (int i = 0; i < n; i++)
        {
            var src = blueprint.Gates[i];

            // Segment assignment: seg = floor(i * S / N) via integer division
            int seg = i * _segments / n;

            // Per-segment direction d in [-1, +1]
            float d = ComputeDirection(seg);

            // Relative multipliers: harder when d > 0 (narrower aperture, more motion, faster)
            float apertureMul = 1f - _amount * d;
            float amplitudeMul = 1f + _amount * d;
            float freqMul = 1f + _amount * d;

            gates[i] = new Gate
            {
                WallX = src.WallX,
                RestCenterY = src.RestCenterY,
                ApertureHeight = MathF.Max(src.ApertureHeight * apertureMul, MinApertureHeight),
                Amplitude = src.Amplitude * amplitudeMul,
                Phase = src.Phase,
                FreqHz = src.FreqHz * freqMul,
            };
        }

        return new LevelBlueprint
        {
            Gates = gates,
            PlayfieldWidth = blueprint.PlayfieldWidth,
            PlayfieldHeight = blueprint.PlayfieldHeight,
            ScrollSpeed = blueprint.ScrollSpeed,
        };
    }

    /// <summary>
    /// Compute per-segment difficulty direction d in [-1, +1].
    /// d > 0 = harder (narrower aperture, more motion, faster).
    /// d &lt; 0 = easier (wider aperture, less motion, slower).
    /// </summary>
    private float ComputeDirection(int segmentIndex)
    {
        if (_segments <= 1)
            return 0f;

        float t = (float)segmentIndex / (_segments - 1);

        return _shape switch
        {
            0 => 2f * t - 1f,                          // crescendo: lerp(-1, +1)
            1 => 8f * t * (1f - t) - 1f,               // valley: peaks +1 at center, -1 at ends
            2 => (segmentIndex % 2 == 0) ? -1f : 1f,   // wave: alternating easy/hard
            _ => 0f,                                     // unreachable (validated in ctor)
        };
    }

    private static LevelBlueprint CloneBlueprint(LevelBlueprint blueprint)
    {
        var gates = new Gate[blueprint.Gates.Count];
        for (int i = 0; i < blueprint.Gates.Count; i++)
        {
            var src = blueprint.Gates[i];
            gates[i] = new Gate
            {
                WallX = src.WallX,
                RestCenterY = src.RestCenterY,
                ApertureHeight = src.ApertureHeight,
                Amplitude = src.Amplitude,
                Phase = src.Phase,
                FreqHz = src.FreqHz,
            };
        }

        return new LevelBlueprint
        {
            Gates = gates,
            PlayfieldWidth = blueprint.PlayfieldWidth,
            PlayfieldHeight = blueprint.PlayfieldHeight,
            ScrollSpeed = blueprint.ScrollSpeed,
        };
    }

    private static int GetSegments(MutatorSpec spec)
    {
        for (int i = 0; i < spec.Params.Count; i++)
        {
            if (spec.Params[i].Key == "seg")
                return (int)spec.Params[i].Value;
        }
        return 3;
    }

    private static float GetAmount(MutatorSpec spec)
    {
        for (int i = 0; i < spec.Params.Count; i++)
        {
            if (spec.Params[i].Key == "amt")
                return spec.Params[i].Value;
        }
        return 0.35f;
    }

    private static int GetShape(MutatorSpec spec)
    {
        for (int i = 0; i < spec.Params.Count; i++)
        {
            if (spec.Params[i].Key == "shape")
                return (int)spec.Params[i].Value;
        }
        return 0;
    }
}
