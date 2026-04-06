using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Snippets;

/// <summary>
/// Validates a list of snippets before loading as a user pack.
/// Returns structured errors for each issue found.
/// </summary>
public static class PackValidator
{
    /// <summary>
    /// Validate a snippet pack. Returns (true, empty) if valid,
    /// or (false, list of error messages) if issues are found.
    /// </summary>
    public static (bool Valid, List<string> Errors) Validate(IReadOnlyList<Snippet> snippets)
    {
        var errors = new List<string>();

        if (snippets == null || snippets.Count == 0)
        {
            errors.Add("Pack is empty or null.");
            return (false, errors);
        }

        var seenIds = new HashSet<string>(StringComparer.Ordinal);

        for (int i = 0; i < snippets.Count; i++)
        {
            var s = snippets[i];
            var prefix = $"Snippet [{i}]";

            if (string.IsNullOrWhiteSpace(s.Id))
                errors.Add($"{prefix}: missing or empty Id.");
            else if (!seenIds.Add(s.Id))
                errors.Add($"{prefix}: duplicate Id \"{s.Id}\".");

            if (string.IsNullOrWhiteSpace(s.Code))
                errors.Add($"{prefix}: missing or empty Code.");

            if (string.IsNullOrWhiteSpace(s.Language))
                errors.Add($"{prefix}: missing or empty Language.");

            if (s.Difficulty < 1 || s.Difficulty > 7)
                errors.Add($"{prefix}: Difficulty {s.Difficulty} out of range (1-7).");
        }

        // Non-blocking sanitization: filter empty/whitespace entries from optional arrays
        foreach (var s in snippets)
        {
            if (s.Notes != null)
            {
                var filtered = s.Notes.Where(n => !string.IsNullOrWhiteSpace(n)).ToArray();
                s.Notes = filtered.Length > 0 ? filtered : null;
            }

            if (s.Scaffold != null)
            {
                var filtered = s.Scaffold.Where(n => !string.IsNullOrWhiteSpace(n)).ToArray();
                s.Scaffold = filtered.Length > 0 ? filtered : null;
            }

            if (s.Variants != null)
            {
                var filtered = s.Variants.Where(v => !string.IsNullOrWhiteSpace(v)).ToArray();
                s.Variants = filtered.Length > 0 ? filtered : null;
            }
        }

        return (errors.Count == 0, errors);
    }
}
