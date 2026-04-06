using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Builds a SelectionExplanation from the current selection context.
/// Produces a human-readable narrative of why a snippet was chosen.
///
/// Read-only: never modifies any input state.
/// </summary>
public static class ExplanationBuilder
{
    /// <summary>
    /// Build an explanation from the selection context.
    /// </summary>
    /// <param name="plan">Session plan from the planner</param>
    /// <param name="snippet">The selected snippet</param>
    /// <param name="weakCategories">Active weak categories used for selection boost</param>
    /// <param name="focusCategory">Active focus category (if any)</param>
    public static SelectionExplanation Build(
        SessionPlan plan,
        Snippet snippet,
        HashSet<SymbolCategoryKind>? weakCategories = null,
        SymbolCategoryKind? focusCategory = null)
    {
        var factors = new List<string>();
        bool weaknessInfluenced = false;
        bool focusInfluenced = false;

        // Factor 1: mix category
        factors.Add(plan.Category switch
        {
            MixCategory.Review => "Review session — reinforcing familiar patterns",
            MixCategory.Stretch => "Stretch session — gentle push toward growth",
            _ => "Target session — at your working level"
        });

        // Factor 2: difficulty targeting
        if (plan.ActualDifficulty == plan.TargetDifficulty)
        {
            factors.Add($"Difficulty D{plan.ActualDifficulty} (exact match)");
        }
        else
        {
            factors.Add($"Difficulty D{plan.ActualDifficulty} (targeted D{plan.TargetDifficulty})");
        }

        // Factor 3: weakness boost
        if (weakCategories != null && weakCategories.Count > 0)
        {
            int boost = SnippetSelector.WeaknessBoost(snippet.Code, weakCategories);
            if (boost > 0)
            {
                var matched = weakCategories
                    .Where(cat => snippet.Code.Any(c => SymbolClassifier.Classify(c) == cat))
                    .Select(WeaknessDetector.FormatCategoryName)
                    .ToList();

                if (matched.Count > 0)
                {
                    factors.Add($"Exercises weak spot{(matched.Count > 1 ? "s" : "")}: {string.Join(", ", matched)}");
                    weaknessInfluenced = true;
                }
            }
        }

        // Factor 4: focus mode
        if (focusCategory.HasValue)
        {
            int boost = SnippetSelector.FocusBoost(snippet.Code, focusCategory.Value);
            if (boost > 0)
            {
                var label = WeaknessDetector.FormatCategoryName(focusCategory.Value);
                factors.Add($"Focus practice: {label}");
                focusInfluenced = true;
            }
        }

        // Factor 5: comfort zone context
        if (plan.ComfortZone.HasValue)
        {
            factors.Add($"Comfort zone: D{plan.ComfortZone.Value}");
        }

        return new SelectionExplanation
        {
            PrimaryReason = plan.Reason,
            Factors = factors,
            WeaknessInfluenced = weaknessInfluenced,
            FocusInfluenced = focusInfluenced,
            Category = plan.Category,
            TargetDifficulty = plan.TargetDifficulty,
            ActualDifficulty = plan.ActualDifficulty
        };
    }
}
