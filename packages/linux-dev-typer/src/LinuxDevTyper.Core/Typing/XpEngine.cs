using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// XP calculation with diminishing returns for repeated snippets
/// and a sloppy-run penalty.
///
/// Formula:
///   base = (WPM × accuracy%) × 0.8
///   repeat_decay = 1 / (1 + 0.3 × recentPlayCount)
///   sloppy_penalty = (accuracy &lt; 70%) ? 0.5 : 1.0
///   xp = round(base × repeat_decay × sloppy_penalty)
///   completion_bonus = round(25 × repeat_decay)
/// </summary>
public static class XpEngine
{
    /// <summary>
    /// Calculate XP for in-progress session (no completion bonus).
    /// When profile is null, uses default constants (matching v0.5.0 behavior).
    /// </summary>
    public static int Calculate(double wpm, double accuracy, int recentPlayCount,
                                PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;
        double baseXp = (wpm * (accuracy / 100.0)) * p.XpBaseMultiplier;

        // Diminishing returns for repeated snippets
        double repeatMultiplier = 1.0 / (1.0 + p.XpRepeatDecay * recentPlayCount);

        // Sloppy penalty
        double sloppyMultiplier = accuracy < p.XpSloppyThreshold ? p.XpSloppyPenalty : 1.0;

        return Math.Max(0, (int)Math.Round(baseXp * repeatMultiplier * sloppyMultiplier));
    }

    /// <summary>
    /// Completion bonus, also subject to diminishing returns.
    /// When profile is null, uses default constants.
    /// </summary>
    public static int CompletionBonus(int recentPlayCount, PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;
        double repeatMultiplier = 1.0 / (1.0 + p.XpRepeatDecay * recentPlayCount);
        return (int)Math.Round((double)p.XpCompletionBonus * repeatMultiplier);
    }

    /// <summary>
    /// Count how many times a snippetId appears in recent results.
    /// </summary>
    public static int CountRecentPlays(IReadOnlyList<Result> recentResults, string snippetId)
    {
        int count = 0;
        foreach (var r in recentResults)
            if (string.Equals(r.SnippetId, snippetId, StringComparison.Ordinal))
                count++;
        return count;
    }
}
