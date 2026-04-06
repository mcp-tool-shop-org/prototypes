namespace LinuxDevTyper.Core.Models;

public sealed class AppSettings
{
    public string SelectedLanguage { get; set; } = "python";
    public bool SidebarOpen { get; set; } = false;

    public bool AmbientMuted { get; set; } = false;
    public double AmbientVolume { get; set; } = 0.5;
    public double KeyVolume { get; set; } = 0.7;
    public double UiVolume { get; set; } = 0.6;
    public string KeyboardSoundTheme { get; set; } = "Mechanical";
    public string SelectedSoundscape { get; set; } = "Zen";

    public bool HardcoreMode { get; set; } = false;
    public bool HighContrast { get; set; } = false;

    /// <summary>
    /// When true, caps all audio volumes at 30% and disables motion/animation
    /// effects. No UI animations are currently used, but this flag gates any
    /// future motion additions.
    /// </summary>
    public bool ReducedSensory { get; set; } = false;

    /// <summary>
    /// Manual difficulty lock: null = auto, 1-7 = locked to specific difficulty.
    /// When set, SnippetSelector always targets this difficulty with no auto-adjustment.
    /// </summary>
    public int? ManualDifficultyLock { get; set; }

    public bool NormalizeLineEndings { get; set; } = true;
    public bool IgnoreTrailingSpaces { get; set; } = false;
    public bool StrictWhitespace { get; set; } = true;

    public double FontSize { get; set; } = 16;

    /// <summary>
    /// When false, suppress performance-related cues (declining trends,
    /// sloppy run warnings, fatigue suggestions). Leaves positive insights visible.
    /// </summary>
    public bool ShowPerformanceCues { get; set; } = true;

    /// <summary>
    /// When true, personalization learning is frozen — no preferences are updated.
    /// Existing learned preferences remain but don't change.
    /// </summary>
    public bool FreezePersonalization { get; set; } = false;

    /// <summary>
    /// Insight types permanently dismissed by the user.
    /// Insights of these types will not be shown.
    /// </summary>
    public HashSet<string> DismissedInsightTypes { get; set; } = new();

    /// <summary>
    /// Active practice profile name. Null means "Default" (hardcoded baseline).
    /// </summary>
    public string? ActiveProfileName { get; set; }

    /// <summary>
    /// When true, display community-sourced notes (tips, perspectives) on the completion card.
    /// Notes come from shared .ldtpack bundles. Anonymous — no author metadata.
    /// </summary>
    public bool ShowCommunityNotes { get; set; } = true;

    /// <summary>
    /// When true, display community difficulty observations on the completion card.
    /// CommunityDifficulty comes from shared .ldtpack bundles. Display-only — never
    /// alters selection, difficulty progression, or rating calculation.
    /// </summary>
    public bool ShowCommunitySignals { get; set; } = true;

    /// <summary>
    /// When true, display progressive learning scaffolds on the completion card.
    /// Scaffolds provide layered context: shallow hints to deeper understanding.
    /// Display-only — never alters practice behavior or engine calculations.
    /// </summary>
    public bool ShowScaffolds { get; set; } = true;

    /// <summary>
    /// When true, display alternative implementations on the completion card.
    /// Variants show different valid approaches — pure demonstration, no ranking.
    /// Display-only — never alters practice behavior or engine calculations.
    /// </summary>
    public bool ShowVariants { get; set; } = true;

    /// <summary>
    /// Controls whether learning signals influence practice behavior.
    /// Default: all flags off (v0.9 behavior). User must explicitly
    /// opt in to Guided Mode for signals to affect snippet selection.
    /// </summary>
    public SignalPolicy SignalPolicy { get; set; } = new();
}
