using System.Text.Json;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Comprehensive v0.7.0 community feature tests.
/// Verifies defaults, roundtrips, and isolation of community fields.
/// </summary>
public class CommunityFeatureTests
{
    [Fact]
    public void Notes_NullByDefault_OnNewSnippet()
    {
        var snippet = new Snippet();
        Assert.Null(snippet.Notes);
    }

    [Fact]
    public void CommunityDifficulty_NullByDefault_OnNewSnippet()
    {
        var snippet = new Snippet();
        Assert.Null(snippet.CommunityDifficulty);
    }

    [Fact]
    public void ShowCommunityNotes_DefaultTrue_OnNewAppSettings()
    {
        var settings = new AppSettings();
        Assert.True(settings.ShowCommunityNotes);
    }

    [Fact]
    public void ShowCommunitySignals_DefaultTrue_OnNewAppSettings()
    {
        var settings = new AppSettings();
        Assert.True(settings.ShowCommunitySignals);
    }

    [Fact]
    public void Snippet_WithAllV7Fields_RoundtripsCleanly()
    {
        var snippet = new Snippet
        {
            Id = "py-001",
            Language = "python",
            Difficulty = 4,
            Title = "Comprehension",
            Code = "x = [i for i in range(10)]\n",
            Topics = new[] { "list-comprehension" },
            Explain = new[] { "List comprehensions are concise." },
            Notes = new[] { "Some prefer generator expressions.", "filter() is an alternative." },
            CommunityDifficulty = 3.8,
        };

        var json = JsonSerializer.Serialize(snippet);
        var deserialized = JsonSerializer.Deserialize<Snippet>(json)!;

        Assert.Equal("py-001", deserialized.Id);
        Assert.Equal("python", deserialized.Language);
        Assert.Equal(4, deserialized.Difficulty);
        Assert.Equal("Comprehension", deserialized.Title);
        Assert.NotNull(deserialized.Notes);
        Assert.Equal(2, deserialized.Notes!.Length);
        Assert.Equal("Some prefer generator expressions.", deserialized.Notes[0]);
        Assert.NotNull(deserialized.CommunityDifficulty);
        Assert.Equal(3.8, deserialized.CommunityDifficulty!.Value);
    }

    [Fact]
    public void AppSettings_CommunityToggles_RoundtripSerialize()
    {
        var settings = new AppSettings
        {
            ShowCommunityNotes = false,
            ShowCommunitySignals = false,
        };

        var json = JsonSerializer.Serialize(settings);
        var deserialized = JsonSerializer.Deserialize<AppSettings>(json)!;

        Assert.False(deserialized.ShowCommunityNotes);
        Assert.False(deserialized.ShowCommunitySignals);
    }

    [Fact]
    public void V1_MigratesToV9()
    {
        var state = new PersistedState { SchemaVersion = 1 };
        state.RecentResults = null!;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.NotNull(migrated.RecentResults);
        Assert.True(migrated.Settings.ShowCommunityNotes);
        Assert.True(migrated.Settings.ShowCommunitySignals);
    }

    [Fact]
    public void V8_MigratesToV9_PreservesExistingData()
    {
        var state = new PersistedState { SchemaVersion = 8 };
        state.PracticeProfiles["Custom"] = new PracticeProfile
        {
            Name = "Custom", XpBaseMultiplier = 1.5
        };
        state.Settings.DismissedInsightTypes = new HashSet<string> { "PersonalBest" };

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.True(migrated.PracticeProfiles.ContainsKey("Custom"));
        Assert.Equal(1.5, migrated.PracticeProfiles["Custom"].XpBaseMultiplier);
        Assert.Contains("PersonalBest", migrated.Settings.DismissedInsightTypes);
        Assert.True(migrated.Settings.ShowCommunityNotes);
        Assert.True(migrated.Settings.ShowCommunitySignals);
    }

    [Fact]
    public void Migration_V9_Idempotent()
    {
        var state = new PersistedState { SchemaVersion = 9 };
        state.Settings.ShowCommunityNotes = false;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.False(migrated.Settings.ShowCommunityNotes); // Preserved, not reset
    }
}
