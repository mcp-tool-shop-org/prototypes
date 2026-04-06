using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Abstractions;

public interface IContentLibrary
{
    IReadOnlyList<CodeItem> Query(ContentQuery query);
    IReadOnlyList<string> Languages();
}

public sealed class ContentQuery
{
    public string? Language { get; init; }
    public string? Source { get; init; } // builtin|corpus|user
    public int? MinLines { get; init; }
    public int? MaxLines { get; init; }
    public float? MinSymbolDensity { get; init; }
    public float? MaxSymbolDensity { get; init; }
}
