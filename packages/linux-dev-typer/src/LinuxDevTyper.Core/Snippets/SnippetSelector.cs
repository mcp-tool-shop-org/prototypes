using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

public static class SnippetSelector
{
    /// <summary>
    /// Pick a snippet based on rating, player level, and optionally
    /// boost snippets that exercise the player's weak symbol categories.
    /// </summary>
    /// <param name="snippets">Available snippets</param>
    /// <param name="rating">Player's current rating for this language</param>
    /// <param name="level">Player's overall level (affects difficulty window)</param>
    /// <param name="weaknessProfile">Optional profile for adaptive selection</param>
    /// <param name="focusCategory">Optional category to heavily boost (+5 weight)</param>
    /// <param name="suggestedDifficulty">Optional override from DifficultyMemory (replaces rating-based target)</param>
    /// <param name="lastDifficulty">Optional previous session difficulty (clamps target to ±1)</param>
    /// <param name="rng">Optional Random for deterministic picks</param>
    public static Snippet Pick(IReadOnlyList<Snippet> snippets, int rating, int level = 1,
                               MistakeProfile? weaknessProfile = null,
                               SymbolCategoryKind? focusCategory = null,
                               int? suggestedDifficulty = null,
                               int? lastDifficulty = null,
                               Random? rng = null,
                               MistakeHeatmap? heatmap = null,
                               SignalPolicy? signalPolicy = null)
    {
        rng ??= Random.Shared;

        if (snippets.Count == 0)
            return new Snippet { Title = "No snippets found", Code = "// Add packs under assets/snippets\n" };

        int targetDifficulty;
        if (suggestedDifficulty.HasValue)
        {
            targetDifficulty = Math.Clamp(suggestedDifficulty.Value, 1, 7);
        }
        else
        {
            targetDifficulty = rating switch
            {
                < 1100 => 2,
                < 1300 => 3,
                < 1500 => 4,
                _ => 5
            };
        }

        // Gradual progression: never jump more than ±1 from last session
        if (lastDifficulty.HasValue)
        {
            targetDifficulty = Math.Clamp(targetDifficulty,
                lastDifficulty.Value - 1, lastDifficulty.Value + 1);
        }

        // Difficulty window widens upward at higher levels
        // Level 1-5:  target ±1
        // Level 6-10: target -1 to +2
        // Level 11+:  target -1 to +3
        int upwardRange = level switch
        {
            <= 5 => 1,
            <= 10 => 2,
            _ => 3
        };

        var candidates = snippets
            .Where(s => s.Difficulty >= targetDifficulty - 1 && s.Difficulty <= targetDifficulty + upwardRange)
            .ToList();
        if (candidates.Count == 0) candidates = snippets.ToList();

        // Build the set of weak categories for adaptive boosting
        var weakCategories = GetWeakCategorySet(weaknessProfile);

        // Weight: exact match = 3, off-by-1 = 2, further = 1
        // Then apply adaptive boost if the snippet exercises weak categories
        var weighted = new List<(Snippet snippet, int weight)>();
        foreach (var s in candidates)
        {
            int dist = Math.Abs(s.Difficulty - targetDifficulty);
            int weight = dist == 0 ? 3 : (dist == 1 ? 2 : 1);

            weight += WeaknessBoost(s.Code, weakCategories);

            // Guided Mode: apply heatmap-based bias within the same band
            if (signalPolicy?.EffectiveSelectionBias == true && heatmap != null)
            {
                weight += HeatmapBias(s.Code, heatmap);
                weight += HeatmapCategoryBias(s.Code, heatmap);
            }

            if (focusCategory.HasValue)
                weight += FocusBoost(s.Code, focusCategory.Value);

            weighted.Add((s, weight));
        }

        return WeightedPick(weighted, rng);
    }

    /// <summary>
    /// Count how many distinct weak-category characters appear in snippet code.
    /// Each distinct weak category found adds +1 weight (capped at 3).
    /// </summary>
    public static int WeaknessBoost(string code, HashSet<SymbolCategoryKind> weakCategories)
    {
        if (weakCategories.Count == 0 || string.IsNullOrEmpty(code))
            return 0;

        var found = new HashSet<SymbolCategoryKind>();
        foreach (char c in code)
        {
            var cat = SymbolClassifier.Classify(c);
            if (weakCategories.Contains(cat))
                found.Add(cat);
            if (found.Count >= 3) break; // cap at +3
        }

        return found.Count;
    }

    /// <summary>
    /// Returns +5 weight if the snippet code contains the focused category, else 0.
    /// Used for intentional practice targeting a specific weakness.
    /// </summary>
    public static int FocusBoost(string code, SymbolCategoryKind focus)
    {
        if (string.IsNullOrEmpty(code))
            return 0;

        foreach (char c in code)
        {
            if (SymbolClassifier.Classify(c) == focus)
                return 5;
        }

        return 0;
    }

    /// <summary>
    /// Extract top weak categories from a MistakeProfile (if adaptive is enabled).
    /// </summary>
    /// <summary>
    /// Applies a bounded bias based on per-character heatmap data.
    /// Counts weak characters (error rate >= 15%, min 5 attempts) present
    /// in the snippet code. Each distinct weak char adds +1 (capped at +3).
    /// Only active when Guided Mode enables selection bias.
    /// </summary>
    public static int HeatmapBias(string code, MistakeHeatmap heatmap)
    {
        if (string.IsNullOrEmpty(code))
            return 0;

        var weakChars = heatmap.GetWeakCharSet(threshold: 0.15, minAttempts: 5);
        if (weakChars.Count == 0)
            return 0;

        int found = 0;
        var seen = new HashSet<char>();
        foreach (char c in code)
        {
            if (weakChars.Contains(c) && seen.Add(c))
            {
                found++;
                if (found >= 3) break; // cap at +3
            }
        }

        return found;
    }

    /// <summary>
    /// Applies bounded category-level bias from heatmap data.
    /// Uses GetWeakestCategories() for proportional error-rate scoring.
    /// Each distinct weak category found adds +1 (capped at +3).
    /// Requires at least 2 weak categories to activate (diversity guard).
    /// Only active when Guided Mode enables selection bias.
    /// </summary>
    public static int HeatmapCategoryBias(string code, MistakeHeatmap heatmap)
    {
        if (string.IsNullOrEmpty(code))
            return 0;

        var weakCategories = heatmap.GetWeakestCategories(minAttempts: 10)
            .Where(c => c.ErrorRate >= 0.10)
            .ToList();

        // Diversity guard: need multiple weak areas to avoid hammering
        if (weakCategories.Count < 2)
            return 0;

        var weakCatSet = new HashSet<SymbolCategoryKind>(weakCategories.Select(c => c.Category));
        var found = new HashSet<SymbolCategoryKind>();

        foreach (char c in code)
        {
            var cat = SymbolClassifier.Classify(c);
            if (weakCatSet.Contains(cat) && found.Add(cat))
            {
                if (found.Count >= 3) break; // cap at +3
            }
        }

        return found.Count;
    }

    private static HashSet<SymbolCategoryKind> GetWeakCategorySet(MistakeProfile? profile)
    {
        var result = new HashSet<SymbolCategoryKind>();
        if (profile == null || !profile.AdaptiveEnabled)
            return result;

        var weaknesses = profile.GetWeaknesses(3);
        foreach (var (categoryName, _) in weaknesses)
        {
            if (Enum.TryParse<SymbolCategoryKind>(categoryName, out var kind))
                result.Add(kind);
        }

        return result;
    }

    private static Snippet WeightedPick(List<(Snippet snippet, int weight)> items, Random rng)
    {
        int totalWeight = 0;
        foreach (var item in items)
            totalWeight += item.weight;

        int roll = rng.Next(totalWeight);
        int cumulative = 0;
        foreach (var item in items)
        {
            cumulative += item.weight;
            if (roll < cumulative)
                return item.snippet;
        }

        return items[^1].snippet;
    }
}
