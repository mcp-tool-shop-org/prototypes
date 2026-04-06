namespace DevOpTyper.Content.Services;

public sealed class LanguageDetector
{
    private static readonly Dictionary<string, string> ExtMap = new(StringComparer.OrdinalIgnoreCase)
    {
        [".py"] = "python",
        [".cs"] = "csharp",
        [".java"] = "java",
        [".js"] = "javascript",
        [".ts"] = "typescript",
        [".sql"] = "sql",
        [".sh"] = "bash",
        [".bash"] = "bash",
        [".rs"] = "rust",
        [".go"] = "go",
        [".kt"] = "kotlin",
        [".cpp"] = "cpp",
        [".cc"] = "cpp",
        [".cxx"] = "cpp",
        [".hpp"] = "cpp",
        [".c"] = "c",
        [".h"] = "c",
        [".json"] = "json",
        [".yml"] = "yaml",
        [".yaml"] = "yaml",
        [".md"] = "markdown",
    };

    public string Detect(string? path, string? languageHint, string text)
    {
        if (!string.IsNullOrWhiteSpace(languageHint))
            return languageHint.Trim().ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(path))
        {
            var ext = Path.GetExtension(path);
            if (!string.IsNullOrWhiteSpace(ext) && ExtMap.TryGetValue(ext, out var lang))
                return lang;
        }

        // Minimal heuristics fallback (stable order)
        text ??= string.Empty;

        if (LooksLikePython(text)) return "python";
        if (LooksLikeCSharp(text)) return "csharp";
        if (LooksLikeJava(text)) return "java";
        if (LooksLikeRust(text)) return "rust";
        if (LooksLikeSql(text)) return "sql";
        if (LooksLikeJavascript(text)) return "javascript";
        if (LooksLikeBash(text)) return "bash";

        return "text";
    }

    private static bool LooksLikePython(string t)
        => t.Contains("def ") && t.Contains(":") && (t.Contains("\n    ") || t.Contains("\n\t"));

    private static bool LooksLikeCSharp(string t)
        => t.Contains("namespace ") || (t.Contains("using ") && t.Contains(";"));

    private static bool LooksLikeJava(string t)
        => t.Contains("public static void main") || (t.Contains("class ") && t.Contains("{"));

    private static bool LooksLikeRust(string t)
        => t.Contains("fn ") && (t.Contains("let ") || t.Contains("::"));

    private static bool LooksLikeSql(string t)
        => t.IndexOf("select", StringComparison.OrdinalIgnoreCase) >= 0
           && t.IndexOf("from", StringComparison.OrdinalIgnoreCase) >= 0;

    private static bool LooksLikeJavascript(string t)
        => t.Contains("=>") || t.Contains("function ");

    private static bool LooksLikeBash(string t)
        => t.StartsWith("#!/") || t.Contains("#!/bin/bash");
}
