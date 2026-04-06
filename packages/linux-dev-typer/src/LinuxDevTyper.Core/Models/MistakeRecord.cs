namespace LinuxDevTyper.Core.Models;

/// <summary>
/// A single per-character mistake captured during a typing session.
/// Position is the index in the target text, Expected is what should
/// have been typed, Actual is what was typed instead.
/// </summary>
public sealed record MistakeRecord(
    int Position,
    char Expected,
    char Actual,
    string SnippetId
);
