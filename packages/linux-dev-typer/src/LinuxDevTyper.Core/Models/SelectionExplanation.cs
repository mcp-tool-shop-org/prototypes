namespace LinuxDevTyper.Core.Models;

/// <summary>
/// A transparent explanation of why a specific snippet was chosen.
/// Combines all decision factors into a user-readable narrative.
///
/// Display-only: shown on the completion card and sidebar. Never affects
/// engine behavior, scoring, or future selections.
/// </summary>
public sealed class SelectionExplanation
{
    /// <summary>
    /// The primary reason for selection (from SessionPlan.Reason).
    /// Example: "Practicing at D4 — targeting braces weakness"
    /// </summary>
    public string PrimaryReason { get; init; } = "";

    /// <summary>
    /// Individual factors that contributed to the selection, in priority order.
    /// Each factor is a short human-readable string.
    /// </summary>
    public List<string> Factors { get; init; } = new();

    /// <summary>
    /// Whether the snippet was selected due to weakness boosting.
    /// </summary>
    public bool WeaknessInfluenced { get; init; }

    /// <summary>
    /// Whether the snippet was selected due to focus mode boosting.
    /// </summary>
    public bool FocusInfluenced { get; init; }

    /// <summary>
    /// The session plan category that drove this selection.
    /// </summary>
    public MixCategory Category { get; init; }

    /// <summary>
    /// Target difficulty that was requested.
    /// </summary>
    public int TargetDifficulty { get; init; }

    /// <summary>
    /// Actual difficulty of the selected snippet.
    /// </summary>
    public int ActualDifficulty { get; init; }
}
