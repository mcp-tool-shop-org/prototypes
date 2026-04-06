namespace DevOpTyper.Content.Models;

public sealed record CodeItem(
    string Id,
    string Language,
    string Source,
    string Title,
    string Code,
    CodeMetrics Metrics,
    DateTimeOffset CreatedUtc,
    string? Origin = null,
    string[]? Concepts = null
);
