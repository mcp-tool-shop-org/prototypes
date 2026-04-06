namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Metadata attached to each typing session result to track intent,
/// focus area, grouping, and repeat status.
/// </summary>
public sealed record SessionMetadata(
    PracticeIntent Intent = PracticeIntent.None,
    string? FocusCategory = null,
    string? GroupId = null,
    int RepeatNumber = 0
);
