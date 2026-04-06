using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Input;
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Modes.ReflexGates;
using MouseTrainer.Simulation.Replay;
using MouseTrainer.Simulation.Session;
using Xunit;

namespace MouseTrainer.Tests.Replay;

public class ReplayVerifierTests
{
    private const int FixedHz = 60;
    private const float Dt = 1f / FixedHz;
    private const uint TestSeed = 0xC0FFEEu;

    private static readonly PointerInput CenterInput =
        new(960f, 540f, false, false, 0L);

    // ── 1. Happy path: record → verify → IsValid ──

    [Fact]
    public void HappyPath_RecordAndVerify_IsValid()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, _) = RecordFullSession(run, CenterInput);

        var freshSim = new ReflexGateSimulation();
        var verification = ReplayVerifier.Verify(envelope, freshSim);

        Assert.True(verification.IsValid,
            $"Hash: expected={verification.ExpectedHash}, actual={verification.ActualHash}; " +
            $"Score: expected={verification.ExpectedScore}, actual={verification.ActualScore}; " +
            $"Combo: expected={verification.ExpectedMaxCombo}, actual={verification.ActualMaxCombo}");
        Assert.True(verification.HashMatch);
        Assert.True(verification.ScoreMatch);
        Assert.True(verification.ComboMatch);
    }

    // ── 2. Tampered input → hash mismatch ──

    [Fact]
    public void TamperedInput_HashMismatch()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, _) = RecordFullSession(run, CenterInput);

        // Tamper: replace trace with offset input
        var tampered = envelope with
        {
            Trace = InputTrace.FromTickSamples(
                Enumerable.Repeat(
                    InputSample.Quantize(100f, 100f, false, false),
                    envelope.Trace.TotalTicks).ToList())
        };

        var freshSim = new ReflexGateSimulation();
        var verification = ReplayVerifier.Verify(tampered, freshSim);

        Assert.False(verification.IsValid);
        Assert.False(verification.HashMatch);
    }

    // ── 3. Tampered score → score mismatch ──

    [Fact]
    public void TamperedScore_ScoreMismatch()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, _) = RecordFullSession(run, CenterInput);

        var tampered = envelope with { FinalScore = envelope.FinalScore + 9999 };

        var freshSim = new ReflexGateSimulation();
        var verification = ReplayVerifier.Verify(tampered, freshSim);

        Assert.False(verification.IsValid);
        Assert.False(verification.ScoreMatch);
        // Hash should still match since input wasn't changed
        Assert.True(verification.HashMatch);
    }

    // ── 4. Wrong RunId → invalid ──

    [Fact]
    public void WrongRunId_Invalid()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, _) = RecordFullSession(run, CenterInput);

        // Tamper: change seed but keep old RunId
        var tampered = envelope with { Seed = 0xDEADu };

        var freshSim = new ReflexGateSimulation();
        var verification = ReplayVerifier.Verify(tampered, freshSim);

        Assert.False(verification.IsValid);
    }

    // ── 5. Determinism: two recordings with same input → identical hash ──

    [Fact]
    public void Determinism_SameInput_SameHash()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (env1, _) = RecordFullSession(run, CenterInput);
        var (env2, _) = RecordFullSession(run, CenterInput);

        Assert.Equal(env1.Hash, env2.Hash);
        Assert.Equal(env1.FinalScore, env2.FinalScore);
        Assert.Equal(env1.FinalMaxCombo, env2.FinalMaxCombo);
    }

    // ── 6. Golden verification hash (frozen) ──

    [Fact]
    public void GoldenVerificationHash_Frozen()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, _) = RecordFullSession(run, CenterInput);

        // Frozen golden values — regression firewall for seed 0xC0FFEE + center input
        Assert.Equal(new VerificationHash(0xEF333CC8B78EFB6CUL), envelope.Hash);
        Assert.Equal(205, envelope.FinalScore);
        Assert.Equal(2, envelope.FinalMaxCombo);
        Assert.Equal(4586, envelope.Trace.TotalTicks);
    }

    // ── 7. EventHash in SessionResult matches envelope hash ──

    [Fact]
    public void SessionResult_EventHash_MatchesEnvelopeHash()
    {
        var run = RunDescriptor.Create(new ModeId("ReflexGates"), TestSeed);
        var (envelope, sessionResult) = RecordFullSession(run, CenterInput);

        Assert.NotNull(sessionResult.EventHash);
        Assert.Equal(envelope.Hash, sessionResult.EventHash.Value);
    }

    // ── Helpers ──

    /// <summary>
    /// Record a full session with fixed input through the real simulation.
    /// Returns (envelope, sessionResult).
    /// </summary>
    private static (ReplayEnvelope Envelope, SessionResult Result) RecordFullSession(
        RunDescriptor run, PointerInput input)
    {
        var sim = new ReflexGateSimulation();
        sim.Reset(run.Seed);

        var recorder = new ReplayRecorder();
        var sc = new SessionController();
        sc.ResetToReady(run, sim.Gates.Count);
        sc.Start();

        var frameEvents = new List<GameEvent>(capacity: 16);
        bool complete = false;

        for (int tick = 0; tick < 8000 && !complete; tick++)
        {
            recorder.RecordTick(input);

            frameEvents.Clear();
            sim.FixedUpdate(tick, Dt, input, frameEvents);

            complete = sc.ApplyEvents(frameEvents);
        }

        var result = sc.GetResult()!;
        var envelope = recorder.Finalize(run, FixedHz, result, result.EventHash!.Value);

        return (envelope, result);
    }
}
