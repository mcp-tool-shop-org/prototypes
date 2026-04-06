namespace MouseTrainer.Domain.Motion;

/// <summary>
/// Triggers that cause Trace to transition between motion states.
/// Each trigger maps to exactly one allowed transition.
/// </summary>
public enum MotionTrigger : byte
{
    /// <summary>Player initiates a deliberate path or timing window opens.</summary>
    Commit = 0,

    /// <summary>External force encountered (Drift Field, environmental push).</summary>
    EncounterForce = 1,

    /// <summary>Force stabilizes; begin refinement.</summary>
    Stabilize = 2,

    /// <summary>Path refined; stability restored.</summary>
    Refine = 3,

    /// <summary>Minor collision, timing slip, or jitter spike.</summary>
    Slip = 4,

    /// <summary>Stability regained after recovery.</summary>
    Regain = 5,
}

/// <summary>
/// Compile-time transition table for Trace's motion state machine.
/// Enforces the canonical state machine from the Motion Language Spec.
/// Forbidden transitions return null — the state does not change.
/// </summary>
public static class MotionTransitionTable
{
    /// <summary>
    /// Attempts a state transition. Returns the new state if the transition
    /// is allowed, or null if it is forbidden.
    /// </summary>
    public static MotionState? TryTransition(MotionState current, MotionTrigger trigger)
    {
        return (current, trigger) switch
        {
            // Main loop: Alignment → Commitment → Resistance → Correction → Alignment
            (MotionState.Alignment,  MotionTrigger.Commit)         => MotionState.Commitment,
            (MotionState.Commitment, MotionTrigger.EncounterForce)  => MotionState.Resistance,
            (MotionState.Resistance, MotionTrigger.Stabilize)       => MotionState.Correction,
            (MotionState.Correction, MotionTrigger.Refine)          => MotionState.Alignment,

            // Recovery loop: Alignment → Recovery → Alignment
            (MotionState.Alignment,  MotionTrigger.Slip)            => MotionState.Recovery,
            (MotionState.Recovery,   MotionTrigger.Regain)          => MotionState.Alignment,

            // Everything else is forbidden
            _ => null,
        };
    }

    /// <summary>
    /// Returns true if the transition is allowed.
    /// </summary>
    public static bool IsAllowed(MotionState current, MotionTrigger trigger)
        => TryTransition(current, trigger) is not null;
}
