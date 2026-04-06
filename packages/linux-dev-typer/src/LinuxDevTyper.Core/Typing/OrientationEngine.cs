using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Generates optional content-based cues shown before a session begins.
///
/// Guidance vs instruction: Cues suggest possibilities ("you haven't tried X"),
/// not directives ("you should do X"). They reference what was practiced —
/// never when or how often the user practiced. The user is never directed,
/// pressured, or reminded of absence. The difference matters: guidance opens
/// doors, instruction closes them.
/// </summary>
public static class OrientationEngine
{
    private const int MinSessionsForCues = 10;
    private const int StaleSessions = 20;

    /// <summary>
    /// Generate a single optional content cue, or null if nothing is relevant.
    /// Priority: stale language → improving accuracy → unseen snippets.
    /// </summary>
    public static string? GenerateCue(
        IReadOnlyList<Result> results,
        IReadOnlyList<Snippet> snippets,
        string currentLanguage,
        TrendSnapshot? trend)
    {
        if (results.Count < MinSessionsForCues)
            return null;

        // Priority 1: stale language not used in 20+ sessions
        var staleCue = DetectStaleLanguage(results, currentLanguage);
        if (staleCue != null)
            return staleCue;

        // Priority 2: accuracy was improving
        if (trend is { AccuracyTrend: MetricTrend.Improving, SessionCount: >= 5 })
            return $"Your accuracy has been climbing — {trend.AccuracyDelta:+0.#}% over recent sessions.";

        // Priority 3: unseen snippets available
        var unseenCue = DetectUnseenSnippets(results, snippets, currentLanguage);
        if (unseenCue != null)
            return unseenCue;

        return null;
    }

    private static string? DetectStaleLanguage(IReadOnlyList<Result> results, string currentLanguage)
    {
        // Find languages used beyond the last 20 sessions
        var recentLanguages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int window = Math.Min(StaleSessions, results.Count);
        for (int i = results.Count - window; i < results.Count; i++)
            recentLanguages.Add(results[i].Language);

        // Find languages used in older sessions but not in the recent window
        var allLanguages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < results.Count - window; i++)
            allLanguages.Add(results[i].Language);

        allLanguages.ExceptWith(recentLanguages);
        allLanguages.Remove(currentLanguage);

        if (allLanguages.Count == 0)
            return null;

        // Pick the most-practiced stale language
        var staleLang = allLanguages
            .OrderByDescending(lang => results.Count(r =>
                string.Equals(r.Language, lang, StringComparison.OrdinalIgnoreCase)))
            .First();

        return $"You haven't practiced {staleLang} in a while — it's still available.";
    }

    private static string? DetectUnseenSnippets(
        IReadOnlyList<Result> results,
        IReadOnlyList<Snippet> snippets,
        string currentLanguage)
    {
        var langSnippets = snippets
            .Where(s => string.Equals(s.Language, currentLanguage, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (langSnippets.Count == 0)
            return null;

        var seenIds = new HashSet<string>(
            results
                .Where(r => string.Equals(r.Language, currentLanguage, StringComparison.OrdinalIgnoreCase))
                .Select(r => r.SnippetId),
            StringComparer.OrdinalIgnoreCase);

        int unseen = langSnippets.Count(s => !seenIds.Contains(s.Id));
        if (unseen > 0)
            return $"{unseen} {currentLanguage} snippet{(unseen == 1 ? "" : "s")} you haven't tried yet.";

        return null;
    }
}
