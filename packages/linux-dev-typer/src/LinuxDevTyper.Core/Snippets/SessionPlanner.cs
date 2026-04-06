using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Plans each snippet selection as Target (50%), Review (30%), or Stretch (20%).
///
/// Target: at or near the user's comfort zone — the working level.
/// Review: 1-2 bands below comfort — reinforces mastery of familiar patterns.
/// Stretch: 1-2 bands above comfort — gentle push toward growth.
///
/// When no comfort zone is established, all selections are Target (rating-based).
/// Delegates actual snippet picking to SnippetSelector after setting the difficulty.
/// The returned SessionPlan is display-only and never affects engine behavior.
/// </summary>
public static class SessionPlanner
{
    private const double TargetWeight = 0.50;
    private const double ReviewWeight = 0.30;
    // Stretch = 1 - Target - Review = 0.20

    /// <summary>
    /// Plan and select a snippet with a mix category and reasoning.
    /// </summary>
    /// <param name="snippets">Available snippet pool</param>
    /// <param name="rating">Player's current rating for this language</param>
    /// <param name="level">Player's overall level</param>
    /// <param name="comfortZone">Current comfort zone difficulty (null if not established)</param>
    /// <param name="weaknessProfile">Optional mistake profile for adaptive boost</param>
    /// <param name="focusCategory">Optional symbol category to boost</param>
    /// <param name="lastDifficulty">Previous session difficulty for ±1 clamping</param>
    /// <param name="manualDifficultyLock">User's manual difficulty override</param>
    /// <param name="isYoYoing">Whether yo-yo lock is active</param>
    /// <param name="weaknessWindow">Optional rolling decay window for recency-aware weakness context</param>
    /// <param name="rng">Optional Random for deterministic testing</param>
    /// <returns>The selected snippet and the session plan explaining the choice.</returns>
    public static (Snippet Snippet, SessionPlan Plan) PlanNext(
        IReadOnlyList<Snippet> snippets,
        int rating,
        int level = 1,
        int? comfortZone = null,
        MistakeProfile? weaknessProfile = null,
        SymbolCategoryKind? focusCategory = null,
        int? lastDifficulty = null,
        int? manualDifficultyLock = null,
        bool isYoYoing = false,
        WeaknessWindow? weaknessWindow = null,
        Random? rng = null,
        MistakeHeatmap? heatmap = null,
        SignalPolicy? signalPolicy = null)
    {
        rng ??= Random.Shared;

        // Manual lock overrides everything
        if (manualDifficultyLock.HasValue)
        {
            var locked = manualDifficultyLock.Value;
            var snippet = SnippetSelector.Pick(snippets, rating, level, weaknessProfile,
                focusCategory, suggestedDifficulty: locked, lastDifficulty, rng,
                heatmap, signalPolicy);
            return (snippet, new SessionPlan
            {
                Category = MixCategory.Target,
                TargetDifficulty = locked,
                ActualDifficulty = snippet.Difficulty,
                ComfortZone = comfortZone,
                Reason = $"Manual lock at D{locked}"
            });
        }

        // Yo-yo lock: stabilize at comfort zone
        if (isYoYoing && comfortZone.HasValue)
        {
            var stable = comfortZone.Value;
            var snippet = SnippetSelector.Pick(snippets, rating, level, weaknessProfile,
                focusCategory, suggestedDifficulty: stable, lastDifficulty, rng,
                heatmap, signalPolicy);
            return (snippet, new SessionPlan
            {
                Category = MixCategory.Target,
                TargetDifficulty = stable,
                ActualDifficulty = snippet.Difficulty,
                ComfortZone = comfortZone,
                Reason = $"Stabilizing at D{stable} (yo-yo detected)"
            });
        }

        // No comfort zone yet: everything is Target (rating-based)
        if (!comfortZone.HasValue)
        {
            var snippet = SnippetSelector.Pick(snippets, rating, level, weaknessProfile,
                focusCategory, suggestedDifficulty: null, lastDifficulty, rng,
                heatmap, signalPolicy);
            return (snippet, new SessionPlan
            {
                Category = MixCategory.Target,
                TargetDifficulty = snippet.Difficulty,
                ActualDifficulty = snippet.Difficulty,
                ComfortZone = null,
                Reason = "Establishing comfort zone"
            });
        }

        // Choose mix category
        var category = ChooseCategory(rng);
        int targetDifficulty = CategoryToDifficulty(category, comfortZone.Value);

        var selected = SnippetSelector.Pick(snippets, rating, level, weaknessProfile,
            focusCategory, suggestedDifficulty: targetDifficulty, lastDifficulty, rng,
            heatmap, signalPolicy);

        // If the actual difficulty doesn't match target, annotate the reason
        bool mismatch = selected.Difficulty != targetDifficulty;
        string reason = category switch
        {
            MixCategory.Review when mismatch => $"Reinforcing D{selected.Difficulty} (nearest to D{targetDifficulty})",
            MixCategory.Review => $"Reinforcing D{targetDifficulty} mastery",
            MixCategory.Stretch when mismatch => $"Stretching to D{selected.Difficulty} (nearest to D{targetDifficulty})",
            MixCategory.Stretch => $"Stretching to D{targetDifficulty}",
            _ when mismatch => $"Practicing at D{selected.Difficulty} (nearest to D{targetDifficulty})",
            _ => $"Practicing at D{targetDifficulty}"
        };

        return (selected, new SessionPlan
        {
            Category = category,
            TargetDifficulty = targetDifficulty,
            ActualDifficulty = selected.Difficulty,
            ComfortZone = comfortZone,
            Reason = AppendWeaknessContext(reason, weaknessWindow, weaknessProfile)
        });
    }

    /// <summary>
    /// Appends weakness context to a reason string when weakness data is available.
    /// Example: "Practicing at D4 — targeting braces weakness"
    /// </summary>
    private static string AppendWeaknessContext(string baseReason, WeaknessWindow? window, MistakeProfile? profile)
    {
        var weaknessDesc = WeaknessDetector.DescribeWeaknesses(window, profile);
        if (weaknessDesc == null)
            return baseReason;

        return $"{baseReason} — {weaknessDesc}";
    }

    /// <summary>
    /// Chooses a mix category based on the 50/30/20 distribution.
    /// </summary>
    internal static MixCategory ChooseCategory(Random rng)
    {
        var roll = rng.NextDouble();
        if (roll < TargetWeight) return MixCategory.Target;
        if (roll < TargetWeight + ReviewWeight) return MixCategory.Review;
        return MixCategory.Stretch;
    }

    /// <summary>
    /// Maps a mix category to a target difficulty band relative to comfort zone.
    /// Review: comfort - 1 (min 1). Target: comfort. Stretch: comfort + 1 (max 7).
    /// </summary>
    internal static int CategoryToDifficulty(MixCategory category, int comfortZone)
    {
        return category switch
        {
            MixCategory.Review => Math.Max(1, comfortZone - 1),
            MixCategory.Stretch => Math.Min(7, comfortZone + 1),
            _ => comfortZone
        };
    }
}
