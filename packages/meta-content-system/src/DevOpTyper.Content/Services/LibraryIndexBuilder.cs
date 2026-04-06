using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Services;

public sealed class LibraryIndexBuilder
{
    private readonly LanguageDetector _detector = new();
    private readonly IExtractor _extractor;
    private readonly IMetricCalculator _metrics;

    public LibraryIndexBuilder(IExtractor extractor, IMetricCalculator metrics)
    {
        _extractor = extractor;
        _metrics = metrics;
    }

    public async Task<LibraryIndex> BuildAsync(IContentSource source, CancellationToken ct = default)
    {
        var index = new LibraryIndex { Version = 1, GeneratedUtc = DateTimeOffset.UtcNow };

        await foreach (var raw in source.EnumerateAsync(ct))
        {
            ct.ThrowIfCancellationRequested();

            var lang = _detector.Detect(raw.Path, raw.LanguageHint, raw.Text);

            foreach (var unit in _extractor.Extract(raw))
            {
                var normalized = Normalizer.Normalize(unit.Text, ensureTrailingNewline: true);
                var metrics = _metrics.Compute(normalized);
                var id = ContentId.From(lang, normalized);

                index.Items.Add(new CodeItem(
                    Id: id,
                    Language: lang,
                    Source: raw.Source,
                    Title: unit.Title,
                    Code: normalized,
                    Metrics: metrics,
                    CreatedUtc: DateTimeOffset.UtcNow,
                    Origin: raw.Origin
                ));
            }
        }

        index.Items = index.Items
            .GroupBy(i => i.Id, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .OrderBy(i => i.Language)
            .ThenBy(i => i.Title)
            .ToList();

        return index;
    }
}
