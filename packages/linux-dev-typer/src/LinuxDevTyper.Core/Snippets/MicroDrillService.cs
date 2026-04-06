using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Generates targeted micro-drill sets: 5 quick snippets focused on
/// the user's top weakness category. Uses existing planner/selector
/// machinery — no new scoring systems.
///
/// Rules:
///   - Uses SnippetSelector.Pick with focusCategory for each pick
///   - Focuses on top weakness category from WeaknessDetector
///   - Falls back to standard selection if no weaknesses found
///   - Never changes difficulty band — picks are bounded by difficulty window
///   - Each drill set is a self-contained list of snippets
/// </summary>
public static class MicroDrillService
{
    /// <summary>
    /// Default number of snippets in a micro-drill.
    /// </summary>
    public const int DrillSize = 5;

    /// <summary>
    /// Generates a drill set focused on the user's top weakness category.
    /// </summary>
    /// <param name="snippets">Available snippet pool.</param>
    /// <param name="rating">Player's current rating.</param>
    /// <param name="level">Player's level.</param>
    /// <param name="weaknessWindow">Rolling weakness window.</param>
    /// <param name="weaknessProfile">Cumulative mistake profile.</param>
    /// <param name="heatmap">Detailed per-character heatmap.</param>
    /// <param name="signalPolicy">Signal policy for bias control.</param>
    /// <param name="suggestedDifficulty">Optional difficulty override.</param>
    /// <param name="count">Number of snippets (default 5).</param>
    /// <param name="rng">Optional Random for deterministic testing.</param>
    /// <returns>A drill result with snippets and focus description.</returns>
    public static DrillResult GenerateDrill(
        IReadOnlyList<Snippet> snippets,
        int rating,
        int level = 1,
        WeaknessWindow? weaknessWindow = null,
        MistakeProfile? weaknessProfile = null,
        MistakeHeatmap? heatmap = null,
        SignalPolicy? signalPolicy = null,
        int? suggestedDifficulty = null,
        int count = DrillSize,
        Random? rng = null)
    {
        rng ??= Random.Shared;

        // Determine top weakness category
        var weakCategories = WeaknessDetector.GetWeakCategories(
            weaknessWindow, weaknessProfile);

        SymbolCategoryKind? focusCategory = weakCategories.Count > 0
            ? weakCategories.First()
            : null;

        string focusDescription = focusCategory.HasValue
            ? $"Targeting {SymbolClassifier.Label(focusCategory.Value)} weaknesses"
            : "General practice";

        // Select snippets using focus-boosted selection
        var result = new List<(Snippet Snippet, SessionPlan Plan)>();
        var usedIds = new HashSet<string>();
        int attempts = 0;

        while (result.Count < count && attempts < count + 10)
        {
            attempts++;

            var (snippet, plan) = SessionPlanner.PlanNext(
                snippets, rating, level,
                focusCategory: focusCategory,
                weaknessProfile: weaknessProfile,
                manualDifficultyLock: suggestedDifficulty,
                weaknessWindow: weaknessWindow,
                rng: rng,
                heatmap: heatmap,
                signalPolicy: signalPolicy);

            if (usedIds.Add(snippet.Id))
            {
                // Create a drill-specific plan with overridden reason
                var drillPlan = new SessionPlan
                {
                    Category = plan.Category,
                    TargetDifficulty = plan.TargetDifficulty,
                    ActualDifficulty = plan.ActualDifficulty,
                    ComfortZone = plan.ComfortZone,
                    Reason = $"Drill: {focusDescription}"
                };
                result.Add((snippet, drillPlan));
            }
        }

        return new DrillResult
        {
            Snippets = result,
            FocusCategory = focusCategory,
            FocusDescription = focusDescription
        };
    }
}

/// <summary>
/// Result of a micro-drill generation.
/// </summary>
public sealed class DrillResult
{
    /// <summary>
    /// The snippets and their plans for this drill.
    /// </summary>
    public List<(Snippet Snippet, SessionPlan Plan)> Snippets { get; init; } = new();

    /// <summary>
    /// The weakness category this drill focuses on, if any.
    /// </summary>
    public SymbolCategoryKind? FocusCategory { get; init; }

    /// <summary>
    /// Human-readable description of what this drill focuses on.
    /// </summary>
    public string FocusDescription { get; init; } = "";
}
