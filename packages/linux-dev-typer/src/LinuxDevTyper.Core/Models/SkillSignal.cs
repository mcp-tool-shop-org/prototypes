namespace LinuxDevTyper.Core.Models;

/// <summary>
/// A structured snapshot of what the system currently knows about the user's skill state.
/// Aggregates signals from WeaknessWindow, DifficultyMemory, SessionPlanner, and TrendEngine
/// into a single display-friendly object.
///
/// Display-only: never affects scoring, rating, XP, or selection weighting.
/// Generated fresh before each session for the UI to show "why this snippet?"
/// </summary>
public sealed class SkillSignal
{
    /// <summary>
    /// Current comfort zone difficulty, or null if not yet established.
    /// </summary>
    public int? ComfortZone { get; init; }

    /// <summary>
    /// The session plan for the current snippet (mix category, target difficulty, reason).
    /// </summary>
    public SessionPlan? Plan { get; init; }

    /// <summary>
    /// Top weakness categories from the rolling decay window, with human-readable labels.
    /// Empty when no weakness data is available.
    /// </summary>
    public List<WeaknessEntry> Weaknesses { get; init; } = new();

    /// <summary>
    /// Whether the user is currently in a yo-yo lock (difficulty bouncing detected).
    /// </summary>
    public bool IsYoYoing { get; init; }

    /// <summary>
    /// Whether the user has manually locked difficulty.
    /// </summary>
    public bool IsManualLock { get; init; }

    /// <summary>
    /// Short text summary of the overall skill state for the UI.
    /// Example: "Comfort D4 — braces and operators need work"
    /// </summary>
    public string Summary { get; init; } = "";
}

/// <summary>
/// A single weakness entry with category, human-readable label, and intensity score.
/// </summary>
public sealed class WeaknessEntry
{
    /// <summary>Category name (matches SymbolCategoryKind.ToString()).</summary>
    public string Category { get; init; } = "";

    /// <summary>Human-readable label (e.g., "braces", "operators").</summary>
    public string Label { get; init; } = "";

    /// <summary>Time-decayed intensity score from the rolling window.</summary>
    public double Score { get; init; }
}
