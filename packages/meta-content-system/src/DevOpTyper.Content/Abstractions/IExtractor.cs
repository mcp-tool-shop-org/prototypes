namespace DevOpTyper.Content.Abstractions;

public interface IExtractor
{
    IEnumerable<ExtractedUnit> Extract(RawContent input);
}

public sealed record ExtractedUnit(string Title, string Text);
