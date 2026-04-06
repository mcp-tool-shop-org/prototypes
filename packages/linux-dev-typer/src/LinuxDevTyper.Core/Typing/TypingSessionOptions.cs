namespace LinuxDevTyper.Core.Typing;

public sealed class TypingSessionOptions
{
    public bool NormalizeLineEndings { get; init; } = true;
    public bool IgnoreTrailingSpaces { get; init; } = false;
    public bool StrictWhitespace { get; init; } = true;

    /// <summary>
    /// Error-lock mode: can't advance past an incorrect character until corrected.
    /// The user must backspace and retype the correct character before progressing.
    /// </summary>
    public bool HardcoreMode { get; init; } = false;
}
