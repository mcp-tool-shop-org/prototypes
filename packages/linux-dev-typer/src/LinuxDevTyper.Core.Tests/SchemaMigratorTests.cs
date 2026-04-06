using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;

namespace LinuxDevTyper.Core.Tests;

public class SchemaMigratorTests
{
    [Fact]
    public void V1_MigratesToCurrentVersion()
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
    }

    [Fact]
    public void V3_MigratesToCurrent()
    {
        var state = new PersistedState { SchemaVersion = 3 };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.MistakeProfile);
        Assert.NotNull(migrated.DifficultyMemory);
        Assert.NotNull(migrated.PersonalDefaults);
        Assert.NotNull(migrated.Settings.DismissedInsightTypes);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.NotNull(migrated.PracticeProfiles);
        Assert.NotNull(migrated.PackRegistry);
    }

    [Fact]
    public void V4_MigratesToCurrent()
    {
        var state = new PersistedState { SchemaVersion = 4 };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.DifficultyMemory);
        Assert.NotNull(migrated.PersonalDefaults);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.NotNull(migrated.PracticeProfiles);
    }

    [Fact]
    public void V5_MigratesToCurrent()
    {
        var state = new PersistedState { SchemaVersion = 5 };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.Settings.DismissedInsightTypes);
        Assert.NotNull(migrated.DifficultyMemory.YoYoDismissedAt);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.NotNull(migrated.PracticeProfiles);
    }

    [Fact]
    public void V6_MigratesToCurrent()
    {
        var state = new PersistedState { SchemaVersion = 6 };
        state.RecentResults.Add(new Result(
            Timestamp: new DateTimeOffset(2026, 1, 15, 12, 0, 0, TimeSpan.Zero),
            Language: "python",
            SnippetId: "s1",
            Wpm: 50,
            Accuracy: 90,
            Errors: 1,
            CharactersTyped: 100,
            XpEarned: 10
        ));

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.SessionSummaryByMonth);
        Assert.True(migrated.SessionSummaryByMonth.ContainsKey("2026-01"));
        Assert.NotNull(migrated.PracticeProfiles);
        Assert.NotNull(migrated.PackRegistry);
    }

    [Fact]
    public void V6_MigratesToV7_RetroBuilds()
    {
        var state = new PersistedState { SchemaVersion = 6 };
        var jan = new DateTimeOffset(2026, 1, 10, 12, 0, 0, TimeSpan.Zero);
        var feb = new DateTimeOffset(2026, 2, 10, 12, 0, 0, TimeSpan.Zero);

        state.RecentResults.Add(new Result(jan, "python", "s1", 40, 90, 1, 100, 10));
        state.RecentResults.Add(new Result(jan.AddHours(1), "python", "s2", 50, 92, 0, 120, 15));
        state.RecentResults.Add(new Result(jan.AddHours(2), "rust", "s3", 35, 85, 2, 80, 8));
        state.RecentResults.Add(new Result(feb, "python", "s1", 55, 94, 0, 130, 18));
        state.RecentResults.Add(new Result(feb.AddHours(1), "go", "s4", 30, 88, 1, 90, 9));

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(2, migrated.SessionSummaryByMonth.Count);
        Assert.True(migrated.SessionSummaryByMonth.ContainsKey("2026-01"));
        Assert.True(migrated.SessionSummaryByMonth.ContainsKey("2026-02"));

        var janSummary = migrated.SessionSummaryByMonth["2026-01"];
        Assert.Equal(3, janSummary.SessionCount);
        Assert.Contains("python", janSummary.LanguagesUsed);
        Assert.Contains("rust", janSummary.LanguagesUsed);

        var febSummary = migrated.SessionSummaryByMonth["2026-02"];
        Assert.Equal(2, febSummary.SessionCount);
        Assert.Contains("go", febSummary.LanguagesUsed);
    }

    [Fact]
    public void V7_MigratesToV8()
    {
        var state = new PersistedState { SchemaVersion = 7 };
        state.Settings.DismissedInsightTypes = new HashSet<string> { "PersonalBest" };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Contains("PersonalBest", migrated.Settings.DismissedInsightTypes);
        Assert.NotNull(migrated.PracticeProfiles);
        Assert.Empty(migrated.PracticeProfiles);
        Assert.NotNull(migrated.PackRegistry);
        Assert.Empty(migrated.PackRegistry);
    }

    [Fact]
    public void V7_MigratesToV8_PreservesExistingV7Data()
    {
        var state = new PersistedState { SchemaVersion = 7 };
        state.SessionSummaryByMonth["2026-01"] = new MonthSummary(5, 45.0, 90.0, 100,
            new HashSet<string> { "python" });

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Single(migrated.SessionSummaryByMonth);
        Assert.Equal(5, migrated.SessionSummaryByMonth["2026-01"].SessionCount);
    }

    [Fact]
    public void CurrentVersion_NoChanges()
    {
        var state = new PersistedState();
        Assert.Equal(PersistedState.CurrentSchemaVersion, state.SchemaVersion);

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
    }

    [Fact]
    public void Idempotent_MigratingTwice()
    {
        var state = new PersistedState { SchemaVersion = 1 };
        state.RecentResults = null!;

        var migrated1 = SchemaMigrator.Migrate(state);
        var migrated2 = SchemaMigrator.Migrate(migrated1);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated2.SchemaVersion);
        Assert.NotNull(migrated2.RecentResults);
    }

    [Fact]
    public void PreservesExistingData()
    {
        var state = new PersistedState { SchemaVersion = 4 };
        state.Profile.Xp = 500;
        state.RecentResults.Add(new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: "python",
            SnippetId: "s1",
            Wpm: 50,
            Accuracy: 95,
            Errors: 1,
            CharactersTyped: 100,
            XpEarned: 20,
            Difficulty: 3
        ));

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(500, migrated.Profile.Xp);
        Assert.Single(migrated.RecentResults);
        Assert.Equal("python", migrated.RecentResults[0].Language);
    }

    [Fact]
    public void V8_MigratesToV9()
    {
        var state = new PersistedState { SchemaVersion = 8 };
        state.Settings.DismissedInsightTypes = new HashSet<string> { "PersonalBest" };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        // Community settings default to true via class initializer
        Assert.True(migrated.Settings.ShowCommunityNotes);
        // Existing data preserved
        Assert.Contains("PersonalBest", migrated.Settings.DismissedInsightTypes);
    }

    [Fact]
    public void V9_MigratesToV10()
    {
        var state = new PersistedState { SchemaVersion = 9 };
        state.Settings.ShowCommunityNotes = false; // existing setting preserved

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        // Pedagogy settings default to true via class initializer
        Assert.True(migrated.Settings.ShowScaffolds);
        // Existing data preserved
        Assert.False(migrated.Settings.ShowCommunityNotes);
    }

    [Fact]
    public void Migration_ClampsExtremeProfileValues()
    {
        var state = new PersistedState();
        state.PracticeProfiles["extreme"] = new PracticeProfile
        {
            Name = "extreme",
            XpBaseMultiplier = 999.0,
            RatingKFactor = 1000,
            ComfortAccuracyThreshold = 0.0,
            FatigueBreakSessions = 1,
        };

        var migrated = SchemaMigrator.Migrate(state);

        var profile = migrated.PracticeProfiles["extreme"];
        Assert.Equal(2.0, profile.XpBaseMultiplier);
        Assert.Equal(64, profile.RatingKFactor);
        Assert.Equal(60.0, profile.ComfortAccuracyThreshold);
        Assert.Equal(3, profile.FatigueBreakSessions);
    }
}
