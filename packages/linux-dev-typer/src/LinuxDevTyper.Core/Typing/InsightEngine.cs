using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Generates short, helpful text insights after each session.
/// Priority-ordered rules; picks top 2 insights maximum.
/// Tone: encouraging, informational, never pushy.
/// </summary>
public static class InsightEngine
{
    // Insight type constants for dismissal tracking
    public const string PersonalBest = "PersonalBest";
    public const string AccuracyMilestone = "AccuracyMilestone";
    public const string ImprovingTrend = "ImprovingTrend";
    public const string DecliningTrend = "DecliningTrend";
    public const string ComfortZoneNudge = "ComfortZoneNudge";
    public const string RepeatMastery = "RepeatMastery";
    public const string IntentAware = "IntentAware";
    public const string FirstSession = "FirstSession";
    public const string SloppyRun = "SloppyRun";
    public const string PlateauReassurance = "PlateauReassurance";

    /// <summary>
    /// Generate 0-2 typed insight tuples based on session result and context.
    /// Each insight has a Type (for dismissal) and Text (for display).
    /// </summary>
    public static List<(string Type, string Text)> Generate(
        Result result,
        TrendSnapshot? trend,
        DifficultyMemory? diffMemory,
        string language,
        IReadOnlyList<Result>? allResults = null,
        HashSet<string>? dismissedTypes = null,
        bool showPerformanceCues = true)
    {
        var insights = new List<(string Type, string Text)>();
        dismissedTypes ??= new HashSet<string>();

        void TryAdd(string type, string text)
        {
            if (!dismissedTypes.Contains(type))
                insights.Add((type, text));
        }

        // 1. New personal best WPM
        if (allResults != null && IsPersonalBest(result, allResults, language))
            TryAdd(PersonalBest, $"New personal best: {result.Wpm:0} WPM on {language}!");

        // 2. Accuracy milestones
        if (result.Accuracy >= 100.0)
            TryAdd(AccuracyMilestone, "Perfect accuracy — zero mistakes.");
        else if (result.Accuracy >= 98.0)
            TryAdd(AccuracyMilestone, "Near-perfect accuracy — only a couple of slips.");
        else if (result.Accuracy >= 95.0 && IsFirstAccuracyMilestone(result, allResults, language, 95.0))
            TryAdd(AccuracyMilestone, "95%+ accuracy — solid precision.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 3. Improving trend
        if (trend != null && trend.WpmTrend == MetricTrend.Improving && trend.SessionCount >= 5)
            TryAdd(ImprovingTrend, $"Your WPM is trending up — {trend.WpmDelta:+0.#} over your last sessions.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 4. Declining trend (gated by showPerformanceCues)
        if (showPerformanceCues && trend != null && trend.AccuracyTrend == MetricTrend.Declining && trend.SessionCount >= 5)
            TryAdd(DecliningTrend, "Accuracy has shifted — this is normal during practice.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 4b. Plateau reassurance (after 15+ sessions of consistent performance)
        if (trend != null && trend.SessionCount >= 15 &&
            (trend.WpmTrend == MetricTrend.Plateau || trend.AccuracyTrend == MetricTrend.Plateau))
            TryAdd(PlateauReassurance, $"Steady performance over {trend.SessionCount} sessions — consistency is mastery.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 5. Comfort zone nudge
        if (diffMemory != null)
        {
            var comfort = diffMemory.ComfortZone(language);
            var suggested = diffMemory.SuggestedDifficulty(language);
            if (comfort.HasValue && suggested.HasValue && suggested.Value > result.Difficulty)
                TryAdd(ComfortZoneNudge, $"You're strong at difficulty {comfort.Value}. Ready to try {suggested.Value}?");
        }

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 6. Repeat mastery
        if (result.Metadata?.RepeatNumber >= 2)
            TryAdd(RepeatMastery, "You've repeated this snippet enough — try something new.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 6b. Intent-aware insight (only when intent is explicitly set)
        if (result.Metadata?.Intent is PracticeIntent intent && intent != PracticeIntent.None)
        {
            string? intentInsight = intent switch
            {
                PracticeIntent.Drill when result.Accuracy >= 90 => "Drill paid off — accuracy stayed sharp.",
                PracticeIntent.Warmup when IsFirstSessionInLanguage(allResults ?? new List<Result>(), language) =>
                    "Good warmup. You're ready to go.",
                PracticeIntent.Challenge when result.Accuracy < 80 =>
                    "Challenge accepted. Accuracy will follow with practice.",
                _ => null
            };
            if (intentInsight != null) TryAdd(IntentAware, intentInsight);
        }

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 7. First session in language
        if (allResults != null && IsFirstSessionInLanguage(allResults, language))
            TryAdd(FirstSession, $"Welcome to {language}! Your starting rating is 1200.");

        if (insights.Count >= 2) return insights.Take(2).ToList();

        // 8. Sloppy run (gated by showPerformanceCues)
        if (showPerformanceCues && result.Accuracy < 70.0)
            TryAdd(SloppyRun, "Rough session. XP is reduced below 70% accuracy.");

        return insights.Take(2).ToList();
    }

    private static bool IsPersonalBest(Result current, IReadOnlyList<Result> allResults, string language)
    {
        double maxPrevWpm = 0;
        foreach (var r in allResults)
        {
            if (string.Equals(r.Language, language, StringComparison.OrdinalIgnoreCase)
                && r != current
                && r.Wpm > maxPrevWpm)
            {
                maxPrevWpm = r.Wpm;
            }
        }
        return current.Wpm > maxPrevWpm && maxPrevWpm > 0;
    }

    private static bool IsFirstAccuracyMilestone(Result current, IReadOnlyList<Result>? allResults,
                                                   string language, double threshold)
    {
        if (allResults == null) return true;
        foreach (var r in allResults)
        {
            if (r != current
                && string.Equals(r.Language, language, StringComparison.OrdinalIgnoreCase)
                && r.Accuracy >= threshold)
                return false;
        }
        return true;
    }

    private static bool IsFirstSessionInLanguage(IReadOnlyList<Result> allResults, string language)
    {
        int count = 0;
        foreach (var r in allResults)
        {
            if (string.Equals(r.Language, language, StringComparison.OrdinalIgnoreCase))
                count++;
            if (count > 1) return false;
        }
        return count <= 1;
    }
}
