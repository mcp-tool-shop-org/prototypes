namespace MouseTrainer.Domain.Motion;

/// <summary>
/// The five core motion states that define Trace's movement identity.
/// Every frame, Trace inhabits exactly one of these states.
/// </summary>
public enum MotionState : byte
{
    /// <summary>Neutral, stable, calm. Minimal drift. Ready to commit.</summary>
    Alignment = 0,

    /// <summary>Decisive acceleration. Straightened trajectory. No hesitation.</summary>
    Commitment = 1,

    /// <summary>Counterforce lean. Controlled compensation. No overcorrection.</summary>
    Resistance = 2,

    /// <summary>Micro-adjustments. Low amplitude. High precision.</summary>
    Correction = 3,

    /// <summary>Brief recoil. Controlled deceleration. Return to alignment.</summary>
    Recovery = 4,
}
