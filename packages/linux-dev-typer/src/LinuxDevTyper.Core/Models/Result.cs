namespace LinuxDevTyper.Core.Models;

public sealed record Result(
    DateTimeOffset Timestamp,
    string Language,
    string SnippetId,
    double Wpm,
    double Accuracy,
    int Errors,
    int CharactersTyped,
    int XpEarned,
    int Difficulty = 0,
    IReadOnlyList<MistakeRecord>? Mistakes = null,
    SessionMetadata? Metadata = null,
    string? Note = null,
    /// <summary>
    /// The session planner's pick category (v0.9.0+).
    /// Null for sessions before v0.9.0 or when no planner was used.
    /// Display-only — never affects scoring, rating, or difficulty.
    /// </summary>
    MixCategory? PlanCategory = null,
    /// <summary>
    /// Human-readable pick reason from the planner (v0.9.0+).
    /// Null for sessions before v0.9.0 or without a plan.
    /// </summary>
    string? PlanReason = null
);
