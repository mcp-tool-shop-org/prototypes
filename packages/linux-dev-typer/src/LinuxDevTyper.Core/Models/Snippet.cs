namespace LinuxDevTyper.Core.Models;

public sealed class Snippet
{
    public string Id { get; set; } = "";
    public string Language { get; set; } = "";
    public int Difficulty { get; set; } = 1;
    public string Title { get; set; } = "";
    public string Code { get; set; } = "";
    public string[] Topics { get; set; } = Array.Empty<string>();
    public string[] Explain { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Optional tips, alternatives, perspectives from shared packs.
    /// Anonymous by design — no author, no source, no metadata attached.
    /// Imported content is indistinguishable from local content.
    /// Distinct from Explain (which is factual); Notes carry multiple viewpoints.
    /// </summary>
    public string[]? Notes { get; set; }

    /// <summary>
    /// Display-only difficulty observation from shared packs.
    /// NEVER used for snippet selection, difficulty adjustment, rating calculation,
    /// or any engine behavior. Purely informational — appears on completion card.
    /// </summary>
    public double? CommunityDifficulty { get; set; }

    /// <summary>
    /// Optional progressive learning context for this snippet.
    /// Index 0: shallow hint ("This uses a list comprehension").
    /// Index 1+: deeper context ("List comprehensions evolved from set-builder notation...").
    /// Observational language only — describes the pattern, never prescribes.
    /// Anonymous by design — no author, no attribution, no teaching level.
    /// Imported scaffold is indistinguishable from locally-authored scaffold.
    /// Display-only — never affects engines, selection, or difficulty.
    /// </summary>
    public string[]? Scaffold { get; set; }

    /// <summary>
    /// Optional alternative implementations of the same logic.
    /// Each entry is a self-contained code snippet showing a different valid approach.
    /// All variants are structural equals — no ranking, no preference signal.
    /// Anonymous by design — no author, no attribution, no preferred indicator.
    /// Imported variants are indistinguishable from locally-authored variants.
    /// Display-only — never affects engines, selection, or difficulty.
    /// </summary>
    public string[]? Variants { get; set; }
}
