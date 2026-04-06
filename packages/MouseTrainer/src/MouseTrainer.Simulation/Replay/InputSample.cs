namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Quantized input snapshot. Int16 coordinates at scale=10 (0.1px precision).
/// Buttons packed as bit flags in a single byte.
/// </summary>
public readonly record struct InputSample(short X, short Y, byte Buttons)
{
    public const float ScaleFactor = 10f;

    public bool PrimaryDown => (Buttons & 0x01) != 0;
    public bool SecondaryDown => (Buttons & 0x02) != 0;

    /// <summary>
    /// Quantize floating-point input to Int16 representation.
    /// </summary>
    public static InputSample Quantize(float x, float y, bool primary, bool secondary)
    {
        short qx = (short)MathF.Round(x * ScaleFactor);
        short qy = (short)MathF.Round(y * ScaleFactor);
        byte buttons = 0;
        if (primary) buttons |= 0x01;
        if (secondary) buttons |= 0x02;
        return new InputSample(qx, qy, buttons);
    }

    /// <summary>
    /// Dequantize back to floating-point coordinates.
    /// </summary>
    public (float X, float Y) Dequantize()
    {
        return (X / ScaleFactor, Y / ScaleFactor);
    }
}
