using MouseTrainer.Domain.Input;
using MouseTrainer.Domain.Runs;
using MouseTrainer.Simulation.Replay;
using MouseTrainer.Simulation.Session;
using Xunit;

namespace MouseTrainer.Tests.Replay;

public class ReplayRecorderTests
{
    private static readonly RunDescriptor TestRun = RunDescriptor.Create(
        new ModeId("ReflexGates"), 0xC0FFEEu);

    // ── 1. TickCount tracks recorded ticks ──

    [Fact]
    public void TickCount_MatchesRecordedTicks()
    {
        var recorder = new ReplayRecorder();
        var input = new PointerInput(960f, 540f, false, false, 0L);

        recorder.RecordTick(input);
        recorder.RecordTick(input);
        recorder.RecordTick(input);

        Assert.Equal(3, recorder.TickCount);
    }

    // ── 2. Envelope fields match inputs ──

    [Fact]
    public void Finalize_EnvelopeFieldsMatch()
    {
        var recorder = new ReplayRecorder();
        var input = new PointerInput(960f, 540f, false, false, 0L);

        for (int i = 0; i < 10; i++)
            recorder.RecordTick(input);

        var result = new SessionResult(
            Seed: 0xC0FFEEu,
            Elapsed: TimeSpan.FromSeconds(1),
            TotalScore: 500,
            MaxCombo: 3,
            GatesPassed: 5,
            GatesTotal: 12,
            Gates: new List<GateResult>().AsReadOnly());

        var hash = new VerificationHash(0xDEADBEEFUL);
        var envelope = recorder.Finalize(TestRun, 60, result, hash);

        Assert.Equal(ReplayEnvelope.CurrentFormatVersion, envelope.FormatVersion);
        Assert.Equal(TestRun.Id, envelope.RunId);
        Assert.Equal(TestRun.Mode, envelope.Mode);
        Assert.Equal(TestRun.Seed, envelope.Seed);
        Assert.Equal(TestRun.Difficulty, envelope.Difficulty);
        Assert.Equal(60, envelope.FixedHz);
        Assert.Equal(10, envelope.Trace.TotalTicks);
        Assert.Equal(hash, envelope.Hash);
        Assert.Equal(500, envelope.FinalScore);
        Assert.Equal(3, envelope.FinalMaxCombo);
    }

    // ── 3. Double-finalize throws ──

    [Fact]
    public void DoubleFinalize_Throws()
    {
        var recorder = new ReplayRecorder();
        recorder.RecordTick(new PointerInput(0f, 0f, false, false, 0L));

        var result = new SessionResult(
            Seed: 0xC0FFEEu,
            Elapsed: TimeSpan.FromSeconds(1),
            TotalScore: 0,
            MaxCombo: 0,
            GatesPassed: 0,
            GatesTotal: 12,
            Gates: new List<GateResult>().AsReadOnly());

        var hash = new VerificationHash(0UL);
        recorder.Finalize(TestRun, 60, result, hash);

        Assert.Throws<InvalidOperationException>(
            () => recorder.Finalize(TestRun, 60, result, hash));
    }

    // ── 4. Record after finalize throws ──

    [Fact]
    public void RecordAfterFinalize_Throws()
    {
        var recorder = new ReplayRecorder();
        recorder.RecordTick(new PointerInput(0f, 0f, false, false, 0L));

        var result = new SessionResult(
            Seed: 0xC0FFEEu,
            Elapsed: TimeSpan.FromSeconds(1),
            TotalScore: 0,
            MaxCombo: 0,
            GatesPassed: 0,
            GatesTotal: 12,
            Gates: new List<GateResult>().AsReadOnly());

        recorder.Finalize(TestRun, 60, result, new VerificationHash(0UL));

        Assert.Throws<InvalidOperationException>(
            () => recorder.RecordTick(new PointerInput(0f, 0f, false, false, 0L)));
    }
}
