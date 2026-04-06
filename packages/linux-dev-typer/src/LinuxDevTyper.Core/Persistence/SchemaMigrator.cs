using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Persistence;

/// <summary>
/// Migrates PersistedState from older schema versions to the current version.
/// Each step transforms from version N to N+1.
/// Extracted to Core for testability.
/// </summary>
public static class SchemaMigrator
{
    /// <summary>
    /// Apply all necessary migrations to bring state to the current schema version.
    /// Returns the same state instance (mutated in-place).
    /// </summary>
    public static PersistedState Migrate(PersistedState state)
    {
        // v1 → v2: RecentResults added (defaults to empty list via deserializer)
        if (state.SchemaVersion < 2)
        {
            state.RecentResults ??= new List<Result>();
            state.SchemaVersion = 2;
        }

        // v2 → v3: Audio theme/soundscape settings added (defaults via AppSettings)
        if (state.SchemaVersion < 3)
        {
            state.SchemaVersion = 3;
        }

        // v3 → v4: MistakeProfile added (defaults via class initializer)
        if (state.SchemaVersion < 4)
        {
            state.MistakeProfile ??= new MistakeProfile();
            state.SchemaVersion = 4;
        }

        // v4 → v5: DifficultyMemory + PersonalDefaults added
        if (state.SchemaVersion < 5)
        {
            state.DifficultyMemory ??= new DifficultyMemory();
            state.PersonalDefaults ??= new PersonalDefaults();
            state.SchemaVersion = 5;
        }

        // v5 → v6: DismissedInsightTypes, YoYoDismissedAt, Note on Result
        if (state.SchemaVersion < 6)
        {
            state.Settings.DismissedInsightTypes ??= new HashSet<string>();
            state.DifficultyMemory.YoYoDismissedAt ??= new Dictionary<string, int>();
            state.SchemaVersion = 6;
        }

        // v6 → v7: SessionSummaryByMonth added, retroactive build from existing results
        if (state.SchemaVersion < 7)
        {
            state.SessionSummaryByMonth ??= new Dictionary<string, MonthSummary>();

            // Retroactively build monthly summaries from existing results
            if (state.RecentResults.Count > 0 && state.SessionSummaryByMonth.Count == 0)
            {
                var byMonth = state.RecentResults
                    .GroupBy(r => r.Timestamp.ToString("yyyy-MM"));

                foreach (var group in byMonth)
                {
                    var results = group.ToList();
                    state.SessionSummaryByMonth[group.Key] = new MonthSummary(
                        results.Count,
                        Math.Round(results.Average(r => r.Wpm), 1),
                        Math.Round(results.Average(r => r.Accuracy), 1),
                        results.Sum(r => r.XpEarned),
                        new HashSet<string>(results.Select(r => r.Language), StringComparer.OrdinalIgnoreCase)
                    );
                }
            }

            state.SchemaVersion = 7;
        }

        // v7 → v8: PracticeProfiles and PackRegistry added
        if (state.SchemaVersion < 8)
        {
            state.PracticeProfiles ??= new Dictionary<string, PracticeProfile>();
            state.PackRegistry ??= new List<PackMetadata>();
            state.SchemaVersion = 8;
        }

        // v8 → v9: ShowCommunityNotes and ShowCommunitySignals added to AppSettings
        // Both default to true via class initializer — no explicit migration needed.
        if (state.SchemaVersion < 9)
        {
            state.SchemaVersion = 9;
        }

        // v9 → v10: ShowScaffolds and ShowVariants added to AppSettings
        // Both default to true via class initializer — no explicit migration needed.
        if (state.SchemaVersion < 10)
        {
            state.SchemaVersion = 10;
        }

        // v10 → v11: MistakeHeatmap + WeaknessSnapshots added for per-character tracking
        if (state.SchemaVersion < 11)
        {
            state.MistakeHeatmap ??= new MistakeHeatmap();
            state.WeaknessSnapshots ??= new List<WeaknessSnapshot>();
            state.SchemaVersion = 11;
        }

        // v11 → v12: SignalPolicy added to AppSettings for Guided Mode
        // Defaults to all-off via class initializer — no explicit migration needed.
        if (state.SchemaVersion < 12)
        {
            state.Settings.SignalPolicy ??= new SignalPolicy();
            state.SchemaVersion = 12;
        }

        // Post-migration: clamp all profiles to safe ranges
        foreach (var profile in state.PracticeProfiles.Values)
            profile.Clamp();

        return state;
    }
}
