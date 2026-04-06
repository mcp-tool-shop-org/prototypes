using System.Text.Json;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Comprehensive tests for v0.8.0 pedagogy features: Scaffold and Variants.
/// Covers model defaults, settings defaults, serialization round-trips,
/// migration paths, and reflection-based feature completeness.
/// </summary>
public class PedagogyFeatureTests
{
    [Fact]
    public void Scaffold_NullByDefault_OnNewSnippet()
    {
        var snippet = new Snippet();
        Assert.Null(snippet.Scaffold);
    }

    [Fact]
    public void Variants_NullByDefault_OnNewSnippet()
    {
        var snippet = new Snippet();
        Assert.Null(snippet.Variants);
    }

    [Fact]
    public void ShowScaffolds_DefaultTrue_OnNewAppSettings()
    {
        var settings = new AppSettings();
        Assert.True(settings.ShowScaffolds);
    }

    [Fact]
    public void ShowVariants_DefaultTrue_OnNewAppSettings()
    {
        var settings = new AppSettings();
        Assert.True(settings.ShowVariants);
    }

    [Fact]
    public void Snippet_WithAllV8Fields_RoundtripsCleanly()
    {
        var snippet = new Snippet
        {
            Id = "py-001",
            Language = "python",
            Difficulty = 4,
            Title = "Comprehension",
            Code = "evens = [x for x in range(20) if x % 2 == 0]\n",
            Topics = new[] { "comprehension", "filtering" },
            Explain = new[] { "List comprehension with a conditional filter." },
            Notes = new[] { "Some prefer filter() for clarity." },
            CommunityDifficulty = 3.5,
            Scaffold = new[] { "This uses a list comprehension with a filter.", "Comprehensions evolved from set-builder notation." },
            Variants = new[] { "evens = list(filter(lambda x: x % 2 == 0, range(20)))" },
        };

        var json = JsonSerializer.Serialize(snippet);
        var deserialized = JsonSerializer.Deserialize<Snippet>(json)!;

        Assert.Equal("py-001", deserialized.Id);
        Assert.Equal("python", deserialized.Language);
        Assert.Equal(4, deserialized.Difficulty);
        Assert.NotNull(deserialized.Notes);
        Assert.Single(deserialized.Notes!);
        Assert.Equal(3.5, deserialized.CommunityDifficulty);
        Assert.NotNull(deserialized.Scaffold);
        Assert.Equal(2, deserialized.Scaffold!.Length);
        Assert.NotNull(deserialized.Variants);
        Assert.Single(deserialized.Variants!);
    }

    [Fact]
    public void AppSettings_PedagogyToggles_RoundtripSerialize()
    {
        var settings = new AppSettings
        {
            ShowScaffolds = false,
            ShowVariants = false,
            ShowCommunityNotes = true,
            ShowCommunitySignals = true,
        };

        var json = JsonSerializer.Serialize(settings);
        var deserialized = JsonSerializer.Deserialize<AppSettings>(json)!;

        Assert.False(deserialized.ShowScaffolds);
        Assert.False(deserialized.ShowVariants);
        Assert.True(deserialized.ShowCommunityNotes);
        Assert.True(deserialized.ShowCommunitySignals);
    }

    [Fact]
    public void V1_MigratesToV10()
    {
        var state = new PersistedState { SchemaVersion = 1 };
        state.RecentResults = null!;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.True(migrated.Settings.ShowScaffolds);
        Assert.True(migrated.Settings.ShowVariants);
        Assert.NotNull(migrated.RecentResults);
    }

    [Fact]
    public void V9_MigratesToV10_PreservesExistingData()
    {
        var state = new PersistedState { SchemaVersion = 9 };
        state.Profile.Xp = 1000;
        state.Settings.ShowCommunityNotes = false;
        state.Settings.ShowCommunitySignals = false;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.Equal(1000, migrated.Profile.Xp);
        Assert.False(migrated.Settings.ShowCommunityNotes);
        Assert.False(migrated.Settings.ShowCommunitySignals);
        // Pedagogy defaults
        Assert.True(migrated.Settings.ShowScaffolds);
        Assert.True(migrated.Settings.ShowVariants);
    }

    [Fact]
    public void Migration_V10_Idempotent()
    {
        var state = new PersistedState { SchemaVersion = 10 };
        state.Settings.ShowScaffolds = false;

        var migrated = SchemaMigrator.Migrate(state);

        Assert.Equal(PersistedState.CurrentSchemaVersion, migrated.SchemaVersion);
        Assert.False(migrated.Settings.ShowScaffolds); // Not reset to true
    }

    [Fact]
    public void V8_Feature_Completeness()
    {
        // Reflection: verify pedagogy fields exist on Snippet
        var snippetProps = typeof(Snippet).GetProperties().Select(p => p.Name).ToList();
        Assert.Contains("Scaffold", snippetProps);
        Assert.Contains("Variants", snippetProps);

        // Reflection: verify pedagogy toggles exist on AppSettings
        var settingsProps = typeof(AppSettings).GetProperties().Select(p => p.Name).ToList();
        Assert.Contains("ShowScaffolds", settingsProps);
        Assert.Contains("ShowVariants", settingsProps);

        // Reflection: verify no hierarchy/ranking metadata exists
        Assert.DoesNotContain("PreferredVariant", snippetProps);
        Assert.DoesNotContain("ScaffoldLevel", snippetProps);
        Assert.DoesNotContain("TeachingOrder", snippetProps);
        Assert.DoesNotContain("Prerequisite", snippetProps);
        Assert.DoesNotContain("Rank", snippetProps);
        Assert.DoesNotContain("TeachingLevel", snippetProps);
    }

    [Fact]
    public void SchemaVersion_Is12()
    {
        Assert.Equal(12, PersistedState.CurrentSchemaVersion);
    }

    [Fact]
    public void FormatVersion_Is3()
    {
        var bundle = new PortableBundle();
        Assert.Equal("3", bundle.FormatVersion);
    }
}
