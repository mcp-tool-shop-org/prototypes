using MouseTrainer.Domain.Motion;
using Xunit;

namespace MouseTrainer.Tests;

public sealed class MotionStateTests
{
    // ══════════════════════════════════════════════════════
    //  Main loop: Alignment → Commitment → Resistance → Correction → Alignment
    // ══════════════════════════════════════════════════════

    [Fact]
    public void Alignment_Commit_GoesToCommitment()
        => Assert.Equal(MotionState.Commitment,
            MotionTransitionTable.TryTransition(MotionState.Alignment, MotionTrigger.Commit));

    [Fact]
    public void Commitment_EncounterForce_GoesToResistance()
        => Assert.Equal(MotionState.Resistance,
            MotionTransitionTable.TryTransition(MotionState.Commitment, MotionTrigger.EncounterForce));

    [Fact]
    public void Resistance_Stabilize_GoesToCorrection()
        => Assert.Equal(MotionState.Correction,
            MotionTransitionTable.TryTransition(MotionState.Resistance, MotionTrigger.Stabilize));

    [Fact]
    public void Correction_Refine_GoesToAlignment()
        => Assert.Equal(MotionState.Alignment,
            MotionTransitionTable.TryTransition(MotionState.Correction, MotionTrigger.Refine));

    // ══════════════════════════════════════════════════════
    //  Recovery loop: Alignment → Recovery → Alignment
    // ══════════════════════════════════════════════════════

    [Fact]
    public void Alignment_Slip_GoesToRecovery()
        => Assert.Equal(MotionState.Recovery,
            MotionTransitionTable.TryTransition(MotionState.Alignment, MotionTrigger.Slip));

    [Fact]
    public void Recovery_Regain_GoesToAlignment()
        => Assert.Equal(MotionState.Alignment,
            MotionTransitionTable.TryTransition(MotionState.Recovery, MotionTrigger.Regain));

    // ══════════════════════════════════════════════════════
    //  Full loop round-trip
    // ══════════════════════════════════════════════════════

    [Fact]
    public void FullMainLoop_RoundTrips()
    {
        var state = MotionState.Alignment;

        state = MotionTransitionTable.TryTransition(state, MotionTrigger.Commit)!.Value;
        Assert.Equal(MotionState.Commitment, state);

        state = MotionTransitionTable.TryTransition(state, MotionTrigger.EncounterForce)!.Value;
        Assert.Equal(MotionState.Resistance, state);

        state = MotionTransitionTable.TryTransition(state, MotionTrigger.Stabilize)!.Value;
        Assert.Equal(MotionState.Correction, state);

        state = MotionTransitionTable.TryTransition(state, MotionTrigger.Refine)!.Value;
        Assert.Equal(MotionState.Alignment, state);
    }

    // ══════════════════════════════════════════════════════
    //  Forbidden transitions (must return null)
    // ══════════════════════════════════════════════════════

    [Theory]
    [InlineData(MotionState.Alignment, MotionTrigger.EncounterForce)]  // Must commit first
    [InlineData(MotionState.Alignment, MotionTrigger.Stabilize)]
    [InlineData(MotionState.Alignment, MotionTrigger.Refine)]
    [InlineData(MotionState.Alignment, MotionTrigger.Regain)]
    [InlineData(MotionState.Commitment, MotionTrigger.Commit)]
    [InlineData(MotionState.Commitment, MotionTrigger.Stabilize)]
    [InlineData(MotionState.Commitment, MotionTrigger.Refine)]
    [InlineData(MotionState.Commitment, MotionTrigger.Slip)]           // Must resist first
    [InlineData(MotionState.Commitment, MotionTrigger.Regain)]
    [InlineData(MotionState.Resistance, MotionTrigger.Commit)]
    [InlineData(MotionState.Resistance, MotionTrigger.EncounterForce)]
    [InlineData(MotionState.Resistance, MotionTrigger.Refine)]         // Must correct first
    [InlineData(MotionState.Resistance, MotionTrigger.Slip)]
    [InlineData(MotionState.Resistance, MotionTrigger.Regain)]
    [InlineData(MotionState.Correction, MotionTrigger.Commit)]         // Must align first
    [InlineData(MotionState.Correction, MotionTrigger.EncounterForce)]
    [InlineData(MotionState.Correction, MotionTrigger.Stabilize)]
    [InlineData(MotionState.Correction, MotionTrigger.Slip)]
    [InlineData(MotionState.Correction, MotionTrigger.Regain)]
    [InlineData(MotionState.Recovery, MotionTrigger.Commit)]           // Must align first
    [InlineData(MotionState.Recovery, MotionTrigger.EncounterForce)]
    [InlineData(MotionState.Recovery, MotionTrigger.Stabilize)]
    [InlineData(MotionState.Recovery, MotionTrigger.Refine)]
    [InlineData(MotionState.Recovery, MotionTrigger.Slip)]
    public void ForbiddenTransitions_ReturnNull(MotionState from, MotionTrigger trigger)
    {
        Assert.Null(MotionTransitionTable.TryTransition(from, trigger));
        Assert.False(MotionTransitionTable.IsAllowed(from, trigger));
    }

    // ══════════════════════════════════════════════════════
    //  IsAllowed mirrors TryTransition
    // ══════════════════════════════════════════════════════

    [Fact]
    public void IsAllowed_TrueForValidTransitions()
    {
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Alignment, MotionTrigger.Commit));
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Commitment, MotionTrigger.EncounterForce));
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Resistance, MotionTrigger.Stabilize));
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Correction, MotionTrigger.Refine));
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Alignment, MotionTrigger.Slip));
        Assert.True(MotionTransitionTable.IsAllowed(MotionState.Recovery, MotionTrigger.Regain));
    }

    // ══════════════════════════════════════════════════════
    //  Default state is Alignment
    // ══════════════════════════════════════════════════════

    [Fact]
    public void DefaultMotionState_IsAlignment()
        => Assert.Equal(MotionState.Alignment, default(MotionState));
}
