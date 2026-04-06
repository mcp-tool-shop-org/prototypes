using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Bridges the rolling-decay WeaknessWindow with the snippet selection system.
///
/// MistakeProfile tracks cumulative lifetime stats (good for overall weakness display).
/// WeaknessDetector uses WeaknessWindow's time-decayed scores to produce a recency-aware
/// set of weak categories for snippet selection boosting.
///
/// When WeaknessWindow has data, it takes priority over MistakeProfile for selection.
/// This means old weaknesses that the user has since overcome naturally fade from
/// the selection boost — no explicit "I fixed it" action needed.
///
/// Display-only: never affects scoring, rating, XP, or difficulty computation.
/// </summary>
public static class WeaknessDetector
{
    /// <summary>
    /// Returns the top weak symbol categories from the rolling window, suitable
    /// for feeding into SnippetSelector's weakness boost.
    ///
    /// Falls back to MistakeProfile when the window has no data (cold start).
    /// </summary>
    /// <param name="window">Rolling decay window (may be empty on first launch)</param>
    /// <param name="profile">Cumulative lifetime profile (fallback)</param>
    /// <param name="topN">Maximum categories to return</param>
    /// <param name="now">Override for testability</param>
    public static HashSet<SymbolCategoryKind> GetWeakCategories(
        WeaknessWindow? window,
        MistakeProfile? profile,
        int topN = 3,
        DateTimeOffset? now = null)
    {
        var result = new HashSet<SymbolCategoryKind>();

        // Try rolling window first (recency-aware)
        if (window != null && window.Events.Count > 0)
        {
            var topWeak = window.GetTopWeakCategories(topN, now);
            foreach (var catName in topWeak)
            {
                if (Enum.TryParse<SymbolCategoryKind>(catName, out var kind))
                    result.Add(kind);
            }

            if (result.Count > 0)
                return result;
        }

        // Fall back to cumulative profile (cold start or empty window)
        if (profile != null && profile.AdaptiveEnabled)
        {
            var weaknesses = profile.GetWeaknesses(topN);
            foreach (var (categoryName, _) in weaknesses)
            {
                if (Enum.TryParse<SymbolCategoryKind>(categoryName, out var kind))
                    result.Add(kind);
            }
        }

        return result;
    }

    /// <summary>
    /// Returns a human-readable description of the current weakness context.
    /// Used by the planner to enrich reason strings.
    ///
    /// Returns null when no weaknesses are detected or adaptive is disabled.
    /// </summary>
    public static string? DescribeWeaknesses(
        WeaknessWindow? window,
        MistakeProfile? profile,
        int topN = 3,
        DateTimeOffset? now = null)
    {
        var categories = GetWeakCategories(window, profile, topN, now);
        if (categories.Count == 0)
            return null;

        var names = categories
            .Select(FormatCategoryName)
            .ToList();

        return names.Count switch
        {
            1 => $"targeting {names[0]} weakness",
            2 => $"targeting {names[0]} and {names[1]} weaknesses",
            _ => $"targeting {string.Join(", ", names.Take(names.Count - 1))} and {names[^1]} weaknesses"
        };
    }

    /// <summary>
    /// Returns structured weakness scores from the rolling window with category labels.
    /// Used for UI display of current weakness intensity.
    ///
    /// Returns empty list when no data is available.
    /// </summary>
    public static List<(SymbolCategoryKind Category, string Label, double Score)> GetWeaknessScores(
        WeaknessWindow? window,
        int topN = 5,
        DateTimeOffset? now = null)
    {
        if (window == null || window.Events.Count == 0)
            return new();

        return window.GetWeaknessScores(topN, now)
            .Select(w =>
            {
                if (Enum.TryParse<SymbolCategoryKind>(w.Category, out var kind))
                    return (kind, FormatCategoryName(kind), w.Score);
                return (SymbolCategoryKind.Other, w.Category, w.Score);
            })
            .ToList();
    }

    /// <summary>
    /// Converts a SymbolCategoryKind into a user-friendly lowercase label.
    /// </summary>
    internal static string FormatCategoryName(SymbolCategoryKind kind) => kind switch
    {
        SymbolCategoryKind.CurlyBraces => "braces",
        SymbolCategoryKind.Parentheses => "parentheses",
        SymbolCategoryKind.SquareBrackets => "brackets",
        SymbolCategoryKind.AngleBrackets => "angle brackets",
        SymbolCategoryKind.Quotes => "quotes",
        SymbolCategoryKind.Operators => "operators",
        SymbolCategoryKind.Punctuation => "punctuation",
        _ => kind.ToString().ToLowerInvariant()
    };
}
