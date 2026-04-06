using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Mistakes;

/// <summary>
/// Aggregates MistakeRecords into per-category error counts.
/// </summary>
public static class MistakeAggregator
{
    /// <summary>
    /// Count mistakes by the symbol category of the expected character.
    /// </summary>
    public static Dictionary<SymbolCategoryKind, int> Aggregate(IEnumerable<MistakeRecord> mistakes)
    {
        var counts = new Dictionary<SymbolCategoryKind, int>();
        foreach (var m in mistakes)
        {
            var cat = SymbolClassifier.Classify(m.Expected);
            counts.TryGetValue(cat, out int current);
            counts[cat] = current + 1;
        }
        return counts;
    }

    /// <summary>
    /// Return top N weakest symbol categories, sorted by error count descending.
    /// Excludes Alphanumeric and Whitespace (less actionable to surface).
    /// </summary>
    public static List<(SymbolCategoryKind Category, int Count)> TopWeakCategories(
        Dictionary<SymbolCategoryKind, int> aggregated, int topN = 5)
    {
        return aggregated
            .Where(kv => kv.Key != SymbolCategoryKind.Alphanumeric
                      && kv.Key != SymbolCategoryKind.Whitespace)
            .OrderByDescending(kv => kv.Value)
            .Take(topN)
            .Select(kv => (kv.Key, kv.Value))
            .ToList();
    }
}
