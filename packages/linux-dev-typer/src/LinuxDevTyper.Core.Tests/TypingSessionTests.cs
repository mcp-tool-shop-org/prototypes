using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class TypingSessionTests
{
    [Fact]
    public void ExactMatch_Completes()
    {
        var session = new TypingSession();
        session.Start("hello", "python", "test-1");

        session.Update("hello");

        Assert.True(session.Complete);
        Assert.False(session.Running);
        Assert.Equal(0, session.Errors);
    }

    [Fact]
    public void OneWrongChar_IncrementsErrors()
    {
        var session = new TypingSession();
        session.Start("hello");

        session.Update("hallo");

        Assert.False(session.Complete);
        Assert.Equal(1, session.Errors);
    }

    [Fact]
    public void ExtraChars_CountAsErrors()
    {
        var session = new TypingSession();
        session.Start("hi");

        session.Update("hi!!");

        Assert.Equal(2, session.Errors);
    }

    [Fact]
    public void Accuracy_StaysWithin_0_100()
    {
        var session = new TypingSession();
        session.Start("abc");

        session.Update("xyz");
        Assert.InRange(session.Accuracy, 0, 100);

        session.Start("abc");
        session.Update("abc");
        Assert.Equal(100.0, session.Accuracy);
    }

    [Fact]
    public void Wpm_IncreasesWith_TypedLength()
    {
        var session = new TypingSession();
        session.Start("abcdefghij");

        session.Update("ab");
        double wpm1 = session.Wpm;

        session.Update("abcdefgh");
        double wpm2 = session.Wpm;

        Assert.True(wpm2 > wpm1, $"WPM should increase: {wpm1} -> {wpm2}");
    }

    [Fact]
    public void ToResult_CapturesSessionState()
    {
        var session = new TypingSession();
        session.Start("hello", "rust", "snippet-42");

        session.Update("hello");

        var result = session.ToResult();

        Assert.Equal("rust", result.Language);
        Assert.Equal("snippet-42", result.SnippetId);
        Assert.Equal(0, result.Errors);
        Assert.Equal(100.0, result.Accuracy);
        Assert.Equal(5, result.CharactersTyped);
        Assert.True(result.XpEarned > 0);
        Assert.True(result.Wpm > 0);
    }

    [Fact]
    public void NotStarted_Update_DoesNothing()
    {
        var session = new TypingSession();

        session.Update("hello");

        Assert.False(session.Running);
        Assert.False(session.Complete);
        Assert.Equal(0, session.Errors);
    }

    [Fact]
    public void CompletionBonus_Xp_Added()
    {
        var session = new TypingSession();
        session.Start("hi");

        Thread.Sleep(10); // Ensure non-zero elapsed time for WPM calculation
        session.Update("h");
        int xpBefore = session.XpEarned;

        session.Update("hi");
        int xpAfter = session.XpEarned;

        Assert.True(xpAfter > xpBefore, $"Completion should award bonus XP (before={xpBefore}, after={xpAfter})");
    }

    [Fact]
    public void NormalizeLineEndings_MatchesCRLF_ToLF()
    {
        var session = new TypingSession();
        session.Start("line1\nline2");

        session.Update("line1\r\nline2");

        Assert.True(session.Complete);
        Assert.Equal(0, session.Errors);
    }

    [Fact]
    public void NormalizeLineEndings_Disabled_MismatchFails()
    {
        var opts = new TypingSessionOptions { NormalizeLineEndings = false };
        var session = new TypingSession();
        session.Start("line1\nline2", options: opts);

        session.Update("line1\r\nline2");

        Assert.False(session.Complete);
        Assert.True(session.Errors > 0);
    }

    [Fact]
    public void IgnoreTrailingSpaces_StripsTrailingWhitespace()
    {
        var opts = new TypingSessionOptions { IgnoreTrailingSpaces = true };
        var session = new TypingSession();
        session.Start("line1\nline2", options: opts);

        session.Update("line1   \nline2\t");

        Assert.True(session.Complete);
        Assert.Equal(0, session.Errors);
    }

    [Fact]
    public void StrictWhitespace_Disabled_CollapsesRuns()
    {
        var opts = new TypingSessionOptions { StrictWhitespace = false };
        var session = new TypingSession();
        session.Start("a  b", options: opts);

        session.Update("a b");

        Assert.True(session.Complete);
        Assert.Equal(0, session.Errors);
    }

    [Fact]
    public void StrictWhitespace_Enabled_ExactSpacingRequired()
    {
        var opts = new TypingSessionOptions { StrictWhitespace = true };
        var session = new TypingSession();
        session.Start("a  b", options: opts);

        session.Update("a b");

        Assert.False(session.Complete);
    }

    // --- Per-character mistake tracking tests ---

    [Fact]
    public void Mistakes_TrackedPerCharacter()
    {
        var session = new TypingSession();
        session.Start("abc", snippetId: "s1");

        session.Update("axc");

        Assert.Single(session.Mistakes);
        Assert.Equal(1, session.Mistakes[0].Position);
        Assert.Equal('b', session.Mistakes[0].Expected);
        Assert.Equal('x', session.Mistakes[0].Actual);
        Assert.Equal("s1", session.Mistakes[0].SnippetId);
    }

    [Fact]
    public void Mistakes_DeduplicatedOnReUpdate()
    {
        var session = new TypingSession();
        session.Start("abc", snippetId: "s1");

        session.Update("ax");   // mistake at pos 1
        session.Update("axc");  // same mistake at pos 1 again

        // Should only record the first occurrence
        Assert.Single(session.Mistakes);
    }

    [Fact]
    public void Mistakes_MultiplePositions()
    {
        var session = new TypingSession();
        session.Start("hello", snippetId: "s1");

        session.Update("hxllx");

        Assert.Equal(2, session.Mistakes.Count);
        Assert.Equal(1, session.Mistakes[0].Position);
        Assert.Equal(4, session.Mistakes[1].Position);
    }

    [Fact]
    public void ToResult_IncludesDifficulty()
    {
        var session = new TypingSession();
        session.Start("hi", difficulty: 5);

        session.Update("hi");
        var result = session.ToResult();

        Assert.Equal(5, result.Difficulty);
    }

    [Fact]
    public void ToResult_IncludesMistakes()
    {
        var session = new TypingSession();
        session.Start("abc", snippetId: "s1");

        session.Update("axc");
        var result = session.ToResult();

        Assert.NotNull(result.Mistakes);
        Assert.Single(result.Mistakes);
        Assert.Equal('b', result.Mistakes[0].Expected);
        Assert.Equal('x', result.Mistakes[0].Actual);
    }

    // --- Hardcore mode tests ---

    [Fact]
    public void HardcoreMode_ClampsAtFirstError()
    {
        var opts = new TypingSessionOptions { HardcoreMode = true };
        var session = new TypingSession();
        session.Start("abc", options: opts);

        session.Update("axyz");

        // Should clamp at position 1 (the wrong char), so only 2 chars processed
        Assert.Equal(1, session.Errors);
        Assert.False(session.Complete);
    }

    [Fact]
    public void HardcoreMode_AllowsCorrectAdvance()
    {
        var opts = new TypingSessionOptions { HardcoreMode = true };
        var session = new TypingSession();
        session.Start("abc", options: opts);

        session.Update("a");
        Assert.Equal(0, session.Errors);

        session.Update("ab");
        Assert.Equal(0, session.Errors);

        session.Update("abc");
        Assert.True(session.Complete);
    }

    [Fact]
    public void HardcoreMode_BackspaceAndCorrect()
    {
        var opts = new TypingSessionOptions { HardcoreMode = true };
        var session = new TypingSession();
        session.Start("abc", options: opts);

        session.Update("ax");  // locked at pos 1
        Assert.Equal(1, session.Errors);

        session.Update("ab");  // corrected
        Assert.Equal(0, session.Errors);

        session.Update("abc"); // complete
        Assert.True(session.Complete);
    }

    [Fact]
    public void HardcoreMode_Disabled_AllowsMultipleErrors()
    {
        var opts = new TypingSessionOptions { HardcoreMode = false };
        var session = new TypingSession();
        session.Start("abc", options: opts);

        session.Update("xyz");

        // Normal mode: all 3 errors counted
        Assert.Equal(3, session.Errors);
        Assert.False(session.Complete);
    }
}
