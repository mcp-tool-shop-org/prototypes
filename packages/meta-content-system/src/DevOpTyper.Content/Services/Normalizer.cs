namespace DevOpTyper.Content.Services;

public static class Normalizer
{
    public static string Normalize(string text, bool ensureTrailingNewline = true)
    {
        text ??= string.Empty;
        text = text.Replace("\r\n", "\n").Replace("\r", "\n");
        if (ensureTrailingNewline && text.Length > 0 && !text.EndsWith("\n", StringComparison.Ordinal))
            text += "\n";
        return text;
    }
}
