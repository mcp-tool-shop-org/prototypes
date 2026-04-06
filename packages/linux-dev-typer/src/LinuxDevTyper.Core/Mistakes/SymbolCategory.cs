namespace LinuxDevTyper.Core.Mistakes;

public enum SymbolCategoryKind
{
    CurlyBraces,     // { }
    Parentheses,     // ( )
    SquareBrackets,  // [ ]
    AngleBrackets,   // < >
    Quotes,          // " ' `
    Operators,       // = + - * / % ! & | ^ ~
    Punctuation,     // . , ; : ? @ # $ \ _
    Whitespace,      // space, tab, newline
    Alphanumeric,    // letters and digits
    Other
}

/// <summary>
/// Classifies individual characters into symbol categories for mistake aggregation.
/// </summary>
public static class SymbolClassifier
{
    /// <summary>
    /// Returns a human-readable label for a category (e.g., "curly braces").
    /// </summary>
    public static string Label(SymbolCategoryKind kind) => kind switch
    {
        SymbolCategoryKind.CurlyBraces => "curly braces",
        SymbolCategoryKind.Parentheses => "parentheses",
        SymbolCategoryKind.SquareBrackets => "square brackets",
        SymbolCategoryKind.AngleBrackets => "angle brackets",
        SymbolCategoryKind.Quotes => "quotes",
        SymbolCategoryKind.Operators => "operators",
        SymbolCategoryKind.Punctuation => "punctuation",
        SymbolCategoryKind.Whitespace => "whitespace",
        SymbolCategoryKind.Alphanumeric => "alphanumeric",
        _ => "other"
    };

    public static SymbolCategoryKind Classify(char c) => c switch
    {
        '{' or '}' => SymbolCategoryKind.CurlyBraces,
        '(' or ')' => SymbolCategoryKind.Parentheses,
        '[' or ']' => SymbolCategoryKind.SquareBrackets,
        '<' or '>' => SymbolCategoryKind.AngleBrackets,
        '"' or '\'' or '`' => SymbolCategoryKind.Quotes,
        '=' or '+' or '-' or '*' or '/' or '%' or '!' or '&' or '|' or '^' or '~'
            => SymbolCategoryKind.Operators,
        '.' or ',' or ';' or ':' or '?' or '@' or '#' or '$' or '\\' or '_'
            => SymbolCategoryKind.Punctuation,
        ' ' or '\t' or '\n' or '\r' => SymbolCategoryKind.Whitespace,
        _ when char.IsLetterOrDigit(c) => SymbolCategoryKind.Alphanumeric,
        _ => SymbolCategoryKind.Other
    };
}
