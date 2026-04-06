namespace MouseTrainer.Simulation.Replay;

/// <summary>
/// Result of replaying an envelope through a fresh simulation.
/// </summary>
public sealed record ReplayVerification(
    bool IsValid,
    VerificationHash ExpectedHash,
    VerificationHash ActualHash,
    int ExpectedScore,
    int ActualScore,
    int ExpectedMaxCombo,
    int ActualMaxCombo)
{
    public bool HashMatch => ExpectedHash == ActualHash;
    public bool ScoreMatch => ExpectedScore == ActualScore;
    public bool ComboMatch => ExpectedMaxCombo == ActualMaxCombo;
}
