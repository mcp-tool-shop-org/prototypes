using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Services;

public sealed class InMemoryContentLibrary : IContentLibrary
{
    private readonly List<CodeItem> _items;

    public InMemoryContentLibrary(IEnumerable<CodeItem> items)
        => _items = items.ToList();

    public IReadOnlyList<string> Languages()
        => _items.Select(i => i.Language).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList();

    public IReadOnlyList<CodeItem> Query(ContentQuery query)
    {
        IEnumerable<CodeItem> q = _items;

        if (!string.IsNullOrWhiteSpace(query.Language))
            q = q.Where(i => i.Language.Equals(query.Language, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(query.Source))
            q = q.Where(i => i.Source.Equals(query.Source, StringComparison.OrdinalIgnoreCase));

        if (query.MinLines is int minL) q = q.Where(i => i.Metrics.Lines >= minL);
        if (query.MaxLines is int maxL) q = q.Where(i => i.Metrics.Lines <= maxL);

        if (query.MinSymbolDensity is float minD) q = q.Where(i => i.Metrics.SymbolDensity >= minD);
        if (query.MaxSymbolDensity is float maxD) q = q.Where(i => i.Metrics.SymbolDensity <= maxD);

        return q.ToList();
    }
}
