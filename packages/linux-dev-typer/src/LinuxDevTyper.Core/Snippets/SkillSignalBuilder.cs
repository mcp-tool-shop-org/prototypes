using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Builds a SkillSignal snapshot from current state for UI display.
/// Purely a display aggregator — reads from WeaknessWindow, DifficultyMemory,
/// and SessionPlan but never writes to any of them.
/// </summary>
public static class SkillSignalBuilder
{
    /// <summary>
    /// Build a SkillSignal from the current session context.
    /// </summary>
    /// <param name="plan">The current session plan (may be null before first session)</param>
    /// <param name="comfortZone">Current comfort zone for this language</param>
    /// <param name="window">Rolling weakness window</param>
    /// <param name="isYoYoing">Whether yo-yo lock is active</param>
    /// <param name="isManualLock">Whether difficulty is manually locked</param>
    /// <param name="topN">Max weakness entries to include</param>
    /// <param name="now">Override for testability</param>
    public static SkillSignal Build(
        SessionPlan? plan = null,
        int? comfortZone = null,
        WeaknessWindow? window = null,
        bool isYoYoing = false,
        bool isManualLock = false,
        int topN = 5,
        DateTimeOffset? now = null)
    {
        var weaknesses = BuildWeaknessEntries(window, topN, now);
        var summary = BuildSummary(comfortZone, weaknesses, isYoYoing, isManualLock);

        return new SkillSignal
        {
            ComfortZone = comfortZone,
            Plan = plan,
            Weaknesses = weaknesses,
            IsYoYoing = isYoYoing,
            IsManualLock = isManualLock,
            Summary = summary
        };
    }

    private static List<WeaknessEntry> BuildWeaknessEntries(
        WeaknessWindow? window, int topN, DateTimeOffset? now)
    {
        var scores = WeaknessDetector.GetWeaknessScores(window, topN, now);
        return scores.Select(s => new WeaknessEntry
        {
            Category = s.Category.ToString(),
            Label = s.Label,
            Score = s.Score
        }).ToList();
    }

    private static string BuildSummary(
        int? comfortZone,
        List<WeaknessEntry> weaknesses,
        bool isYoYoing,
        bool isManualLock)
    {
        var parts = new List<string>();

        if (isManualLock)
            parts.Add("Manual lock active");
        else if (isYoYoing)
            parts.Add("Stabilizing (yo-yo detected)");
        else if (comfortZone.HasValue)
            parts.Add($"Comfort D{comfortZone.Value}");
        else
            parts.Add("Establishing baseline");

        if (weaknesses.Count > 0)
        {
            var labels = weaknesses.Select(w => w.Label).ToList();
            string weaknessText = labels.Count switch
            {
                1 => $"{labels[0]} needs work",
                2 => $"{labels[0]} and {labels[1]} need work",
                _ => $"{string.Join(", ", labels.Take(labels.Count - 1))} and {labels[^1]} need work"
            };
            parts.Add(weaknessText);
        }

        return string.Join(" — ", parts);
    }
}
