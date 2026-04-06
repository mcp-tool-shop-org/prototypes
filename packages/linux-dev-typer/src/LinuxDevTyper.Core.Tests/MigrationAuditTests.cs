using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Comprehensive migration audit for v1.0.0 release.
/// Tests every schema version path to v12, verifying no data loss
/// and correct default initialization.
/// </summary>
public class MigrationAuditTests
{
    // --- v9 -> v12 (from v0.7.0 community features) ---

    [Fact]
    public void V9_MigratesToV12_AllFieldsPresent()
    {
        var state = new PersistedState { SchemaVersion = 9 };
        state.Profile.Xp = 1500;
        state.Profile.Level = 8;
        state.Settings.ShowCommunityNotes = false;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Equal(1500, migrated.Profile.Xp);
        Assert.Equal(8, migrated.Profile.Level);
        Assert.False(migrated.Settings.ShowCommunityNotes);

        // v10 additions: pedagogy defaults
        Assert.True(migrated.Settings.ShowScaffolds);
        Assert.True(migrated.Settings.ShowVariants);

        // v11 additions: per-character tracking
        Assert.NotNull(migrated.MistakeHeatmap);
        Assert.NotNull(migrated.WeaknessSnapshots);

        // v12 additions: SignalPolicy
        Assert.NotNull(migrated.Settings.SignalPolicy);
        Assert.False(migrated.Settings.SignalPolicy.GuidedMode);
        Assert.False(migrated.Settings.SignalPolicy.SignalsAffectSelection);
    }

    // --- v10 -> v12 (from v0.8.0 pedagogy) ---

    [Fact]
    public void V10_MigratesToV12_PreservesExisting()
    {
        var state = new PersistedState { SchemaVersion = 10 };
        state.Profile.Xp = 2000;
        state.Settings.ShowScaffolds = false;
        state.Settings.ShowVariants = false;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Equal(2000, migrated.Profile.Xp);
        Assert.False(migrated.Settings.ShowScaffolds); // Preserved, not reset
        Assert.False(migrated.Settings.ShowVariants); // Preserved, not reset

        // v11 additions
        Assert.NotNull(migrated.MistakeHeatmap);
        Assert.NotNull(migrated.WeaknessSnapshots);

        // v12 additions
        Assert.NotNull(migrated.Settings.SignalPolicy);
        Assert.False(migrated.Settings.SignalPolicy.GuidedMode);
    }

    // --- v11 -> v12 (from v0.9.0 signals) ---

    [Fact]
    public void V11_MigratesToV12_PreservesHeatmap()
    {
        var state = new PersistedState { SchemaVersion = 11 };
        state.Profile.Xp = 3000;
        state.MistakeHeatmap = new MistakeHeatmap();
        state.MistakeHeatmap.RecordHit('{');
        state.MistakeHeatmap.RecordMiss('{', '[');
        state.WeaknessSnapshots = new List<WeaknessSnapshot>
        {
            new()
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-1),
                TopWeaknesses = new List<LinuxDevTyper.Core.Mistakes.WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 10 }
                }
            }
        };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Equal(3000, migrated.Profile.Xp);

        // Heatmap data preserved
        Assert.True(migrated.MistakeHeatmap.Records.ContainsKey('{'));
        Assert.Equal(1, migrated.MistakeHeatmap.Records['{'].Hits);
        Assert.Equal(1, migrated.MistakeHeatmap.Records['{'].Misses);

        // Snapshots preserved
        Assert.Single(migrated.WeaknessSnapshots);

        // v12 additions
        Assert.NotNull(migrated.Settings.SignalPolicy);
        Assert.False(migrated.Settings.SignalPolicy.GuidedMode);
    }

    // --- v12 -> v12 (idempotent / already current) ---

    [Fact]
    public void V12_MigratesToV12_Idempotent()
    {
        var state = new PersistedState { SchemaVersion = 12 };
        state.Profile.Xp = 5000;
        state.Settings.SignalPolicy = new SignalPolicy();
        state.Settings.SignalPolicy.EnableGuidedMode();
        state.Settings.ShowScaffolds = false;
        state.MistakeHeatmap = new MistakeHeatmap();
        state.MistakeHeatmap.RecordHit('(');

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(12, migrated.SchemaVersion);
        Assert.Equal(5000, migrated.Profile.Xp);
        Assert.True(migrated.Settings.SignalPolicy.GuidedMode); // Not reset
        Assert.True(migrated.Settings.SignalPolicy.SignalsAffectSelection); // Not reset
        Assert.False(migrated.Settings.ShowScaffolds); // Not reset
        Assert.True(migrated.MistakeHeatmap.Records.ContainsKey('('));
    }

    // --- v1 -> v12 (full migration path) ---

    [Fact]
    public void V1_MigratesToV12_FullPath()
    {
        var state = new PersistedState { SchemaVersion = 1 };
        state.RecentResults = null!;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.RecentResults);
        Assert.NotNull(migrated.MistakeProfile);
        Assert.NotNull(migrated.DifficultyMemory);
        Assert.NotNull(migrated.PersonalDefaults);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.NotNull(migrated.PracticeProfiles);
        Assert.NotNull(migrated.PackRegistry);
        Assert.NotNull(migrated.MistakeHeatmap);
        Assert.NotNull(migrated.WeaknessSnapshots);
        Assert.NotNull(migrated.Settings.SignalPolicy);
        Assert.False(migrated.Settings.SignalPolicy.GuidedMode);
    }

    // --- SignalPolicy defaults are safe ---

    [Fact]
    public void SignalPolicy_Defaults_AllOff()
    {
        var policy = new SignalPolicy();
        Assert.False(policy.GuidedMode);
        Assert.False(policy.SignalsAffectSelection);
        Assert.False(policy.SignalsAffectDifficulty);
        Assert.False(policy.SignalsAffectXP);
        Assert.False(policy.EffectiveSelectionBias);
        Assert.False(policy.EffectiveDifficultyInfluence);
        Assert.False(policy.EffectiveXPInfluence);
    }

    [Fact]
    public void SignalPolicy_EnableGuided_OnlySelection()
    {
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();

        Assert.True(policy.GuidedMode);
        Assert.True(policy.SignalsAffectSelection);
        Assert.False(policy.SignalsAffectDifficulty);
        Assert.False(policy.SignalsAffectXP);
        Assert.True(policy.EffectiveSelectionBias);
        Assert.False(policy.EffectiveDifficultyInfluence);
        Assert.False(policy.EffectiveXPInfluence);
    }

    [Fact]
    public void SignalPolicy_DisableGuided_AllEffectiveOff()
    {
        var policy = new SignalPolicy();
        policy.EnableGuidedMode();
        policy.DisableGuidedMode();

        Assert.False(policy.GuidedMode);
        // Sub-flags may still be true, but Effective* must be false
        Assert.False(policy.EffectiveSelectionBias);
        Assert.False(policy.EffectiveDifficultyInfluence);
        Assert.False(policy.EffectiveXPInfluence);
    }

    // --- Migration never loses user preferences ---

    [Fact]
    public void Migration_PreservesAllUserPreferences()
    {
        var state = new PersistedState { SchemaVersion = 9 };
        state.Settings.HardcoreMode = true;
        state.Settings.ReducedSensory = true;
        state.Settings.ManualDifficultyLock = 5;
        state.Settings.ShowPerformanceCues = false;
        state.Settings.FreezePersonalization = true;
        state.Settings.FontSize = 20;
        state.Settings.KeyVolume = 0.3;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.True(migrated.Settings.HardcoreMode);
        Assert.True(migrated.Settings.ReducedSensory);
        Assert.Equal(5, migrated.Settings.ManualDifficultyLock);
        Assert.False(migrated.Settings.ShowPerformanceCues);
        Assert.True(migrated.Settings.FreezePersonalization);
        Assert.Equal(20, migrated.Settings.FontSize);
        Assert.Equal(0.3, migrated.Settings.KeyVolume);
    }

    // --- Current schema version is 12 ---

    [Fact]
    public void CurrentSchemaVersion_Is12()
    {
        Assert.Equal(12, PersistedState.CurrentSchemaVersion);
    }
}
