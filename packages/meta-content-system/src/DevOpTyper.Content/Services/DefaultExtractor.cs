using DevOpTyper.Content.Abstractions;

namespace DevOpTyper.Content.Services;

public sealed class DefaultExtractor : IExtractor
{
    public int MaxCharsWholeFile { get; init; } = 4000;
    public int MinBlockChars { get; init; } = 200;
    public int MaxBlockChars { get; init; } = 2000;

    public IEnumerable<ExtractedUnit> Extract(RawContent input)
    {
        var text = input.Text ?? string.Empty;

        if (text.Length <= MaxCharsWholeFile)
        {
            yield return new ExtractedUnit(input.Title, text);
            yield break;
        }

        var blocks = text.Split(new[] { "\r\n\r\n", "\n\n", "\r\r" }, StringSplitOptions.RemoveEmptyEntries);
        bool any = false;

        foreach (var b in blocks)
        {
            var trimmed = b.Trim('\r', '\n');
            if (trimmed.Length < MinBlockChars || trimmed.Length > MaxBlockChars) continue;
            any = true;
            yield return new ExtractedUnit(input.Title, trimmed);
        }

        if (!any)
            yield return new ExtractedUnit(input.Title, text);
    }
}
