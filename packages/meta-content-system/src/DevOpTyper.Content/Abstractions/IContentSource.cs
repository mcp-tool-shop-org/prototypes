namespace DevOpTyper.Content.Abstractions;

public interface IContentSource
{
    IAsyncEnumerable<RawContent> EnumerateAsync(CancellationToken ct = default);
}

public sealed record RawContent(
    string? Path,
    string? LanguageHint,
    string Title,
    string Text,
    string Source,      // builtin|corpus|user
    string? Origin      // pack name or root path
);
