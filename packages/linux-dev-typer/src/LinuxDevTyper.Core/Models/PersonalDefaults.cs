namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Passively learned user preferences based on usage patterns.
/// Applied silently on fresh install or state reset — no popups.
/// Stored in PersistedState.
///
/// Design philosophy: respect for individual cadence.
///
/// - Adaptation is slow and deliberate. Preferences require 15+ sessions
///   and high confidence before surfacing. This prevents the app from
///   reacting to noise or brief experiments.
///
/// - Adaptation is reversible. Users can freeze learning at any time
///   (FreezePersonalization), reset all learned preferences, or simply
///   dismiss suggestions. Nothing is permanent.
///
/// - The app never optimizes the user. It learns what they tend to do,
///   not what they should do. Suggestions are offered, not imposed.
///   There is no "ideal" practice pattern.
///
/// - Timing is internal. PracticeRhythm tracks when sessions happen
///   but this data is never displayed. The app responds to what you
///   practice — languages, snippets, accuracy — never when or how often.
///
/// - Stabilization prevents churn. Once a preference is confident (90%+),
///   it locks in place until the user genuinely shifts (5+ sessions with
///   a different language). This prevents a single exploratory session
///   from destabilizing defaults.
/// </summary>
public sealed class PersonalDefaults
{
    private const int MinSessionsForSuggestions = 15;
    private const int RecentWindowSize = 30;
    private const double HardcoreThreshold = 0.70;
    private const int HardcoreWindowSize = 20;
    private const double ConfidenceIncrement = 0.05;
    private const double ConfidenceDecrement = 0.10;
    private const double ConfidenceThreshold = 0.7;
    private const double StabilizationThreshold = 0.9;
    private const int PostStabilizationWindow = 5;

    public string? PreferredLanguage { get; set; }
    public double? PreferredFontSize { get; set; }
    public bool? PreferredHardcoreMode { get; set; }
    public string? PreferredKeyboardTheme { get; set; }
    public PracticeRhythm PracticeRhythm { get; set; } = new();

    /// <summary>
    /// Confidence in the preferred language (0-1).
    /// Increases +0.05 when the same language stays preferred,
    /// decreases -0.10 when preference changes.
    /// </summary>
    public double LanguageConfidence { get; set; }

    /// <summary>
    /// When confidence exceeds 0.9, language preference is stabilized.
    /// Re-learning is suppressed until 5+ sessions with a different language
    /// occur after stabilization.
    /// </summary>
    public DateTimeOffset? StabilizedAt { get; set; }

    /// <summary>
    /// Count of sessions with a different language since stabilization.
    /// Reset when stabilization is cleared.
    /// </summary>
    public int DifferentLanguageSinceStabilization { get; set; }

    /// <summary>
    /// Cooldown counter — prevents re-suggesting after user overrides.
    /// Decremented each session. Suggestions only offered when 0.
    /// </summary>
    public int SessionsUntilNextSuggestion { get; set; }

    /// <summary>
    /// Total sessions analyzed so far (for deciding when to start suggesting).
    /// </summary>
    public int TotalSessionsAnalyzed { get; set; }

    /// <summary>
    /// Returns true when we have enough data and confidence to offer defaults.
    /// </summary>
    public bool HasSuggestions =>
        TotalSessionsAnalyzed >= MinSessionsForSuggestions
        && SessionsUntilNextSuggestion <= 0
        && LanguageConfidence >= ConfidenceThreshold;

    /// <summary>
    /// Compare learned preferences against current settings and return
    /// human-readable suggestions for settings the user might want to change.
    /// Only returns when HasSuggestions is true.
    /// </summary>
    public List<string> GetPendingSuggestions(AppSettings current)
    {
        var suggestions = new List<string>();
        if (!HasSuggestions) return suggestions;

        if (PreferredLanguage != null
            && !string.Equals(PreferredLanguage, current.SelectedLanguage, StringComparison.OrdinalIgnoreCase))
        {
            suggestions.Add($"You usually practice {PreferredLanguage}. Switch default?");
        }

        if (PreferredFontSize.HasValue
            && Math.Abs(PreferredFontSize.Value - current.FontSize) > 1.0)
        {
            suggestions.Add($"Your preferred font size is {PreferredFontSize.Value:0}.");
        }

        return suggestions;
    }

    /// <summary>
    /// Dismiss current suggestions and set a cooldown (in sessions).
    /// </summary>
    public void DismissSuggestions(int cooldown = 20)
    {
        SessionsUntilNextSuggestion = cooldown;
    }

    /// <summary>
    /// Analyze recent results and current settings to learn user preferences.
    /// Call this periodically (e.g. every 5 sessions).
    /// </summary>
    public void LearnFromHistory(IReadOnlyList<Result> results, AppSettings currentSettings)
    {
        if (results.Count == 0) return;

        TotalSessionsAnalyzed = results.Count;

        // Decrement cooldown
        if (SessionsUntilNextSuggestion > 0)
            SessionsUntilNextSuggestion--;

        // Learn preferred language: most common in recent window
        var recentResults = results
            .Skip(Math.Max(0, results.Count - RecentWindowSize))
            .ToList();

        var newPreferred = recentResults
            .GroupBy(r => r.Language, StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key;

        // Update language confidence
        if (newPreferred != null)
        {
            if (StabilizedAt.HasValue)
            {
                // Stabilized: track how many sessions use a different language
                if (!string.Equals(newPreferred, PreferredLanguage, StringComparison.OrdinalIgnoreCase))
                    DifferentLanguageSinceStabilization++;

                // Break stabilization after enough different-language sessions
                if (DifferentLanguageSinceStabilization >= PostStabilizationWindow)
                {
                    StabilizedAt = null;
                    DifferentLanguageSinceStabilization = 0;
                    LanguageConfidence = 0.5; // Reset to moderate confidence
                    PreferredLanguage = newPreferred;
                }
                // Otherwise keep the stabilized preference
            }
            else
            {
                if (string.Equals(newPreferred, PreferredLanguage, StringComparison.OrdinalIgnoreCase))
                {
                    // Same language stays preferred — increase confidence
                    LanguageConfidence = Math.Min(1.0, LanguageConfidence + ConfidenceIncrement);
                }
                else
                {
                    // Preference changed — decrease confidence
                    LanguageConfidence = Math.Max(0.0, LanguageConfidence - ConfidenceDecrement);
                    PreferredLanguage = newPreferred;
                }

                // Stabilize when confidence is very high
                if (LanguageConfidence >= StabilizationThreshold)
                    StabilizedAt = DateTimeOffset.UtcNow;
            }
        }
        else
        {
            PreferredLanguage = newPreferred;
        }

        // Learn preferred font size from current settings (tracks last used)
        PreferredFontSize = currentSettings.FontSize;

        // Learn preferred keyboard theme from current settings
        PreferredKeyboardTheme = currentSettings.KeyboardSoundTheme;

        // Learn hardcore preference: if used > 70% of last 20 sessions
        if (results.Count >= HardcoreWindowSize)
        {
            var hardcoreWindow = results
                .Skip(Math.Max(0, results.Count - HardcoreWindowSize))
                .ToList();

            // We can only learn this from metadata if sessions carry it
            // For now, just track the current setting
            PreferredHardcoreMode = currentSettings.HardcoreMode;
        }

        // Learn practice rhythm (internal only, never displayed)
        PracticeRhythm.LearnFromResults(results);
    }
}
