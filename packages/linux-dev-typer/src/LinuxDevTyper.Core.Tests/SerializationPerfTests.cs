using System.Diagnostics;
using System.Text.Json;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Serialization and memory profiling tests.
/// Verifies JSON round-trip performance for PersistedState
/// with realistic data volumes.
/// </summary>
public class SerializationPerfTests
{
    private static PersistedState BuildRealisticState()
    {
        var state = new PersistedState { SchemaVersion = 12 };
        state.Profile.Xp = 15000;
        state.Profile.Level = 12;
        state.Profile.RatingByLanguage["python"] = 1450;
        state.Profile.RatingByLanguage["rust"] = 1200;

        // 50 recent results
        for (int i = 0; i < 50; i++)
        {
            state.AddResult(new Result(
                Timestamp: DateTimeOffset.UtcNow.AddMinutes(-i * 5),
                Language: i % 2 == 0 ? "python" : "rust",
                SnippetId: $"test-{i}",
                Wpm: 60 + i % 20,
                Accuracy: 85 + i % 15,
                Errors: i % 5,
                CharactersTyped: 100 + i * 3,
                XpEarned: 30 + i % 30,
                Difficulty: 3 + i % 4
            ));
        }

        // 100 tracked characters in heatmap
        for (int j = 0; j < 100; j++)
        {
            char c = (char)(33 + j);
            for (int k = 0; k < 10; k++) state.MistakeHeatmap.RecordHit(c);
            for (int k = 0; k < 3; k++) state.MistakeHeatmap.RecordMiss(c, (char)(65 + k));
        }

        // 30 weakness snapshots
        for (int s = 0; s < 30; s++)
        {
            state.WeaknessSnapshots.Add(new WeaknessSnapshot
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-s),
                TopWeaknesses = new List<LinuxDevTyper.Core.Mistakes.WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.3 - s * 0.005, TotalAttempts = 50 + s },
                    new() { Character = '(', ErrorRate = 0.2 - s * 0.003, TotalAttempts = 40 + s }
                }
            });
        }

        // Guided Mode enabled
        state.Settings.SignalPolicy.EnableGuidedMode();

        return state;
    }

    [Fact]
    public void Serialize_RealisticState_Under10ms()
    {
        var state = BuildRealisticState();

        // Warmup
        JsonSerializer.Serialize(state);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            JsonSerializer.Serialize(state);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 10, $"Serialize averaged {avgMs:F2}ms per call (limit: 10ms)");
    }

    [Fact]
    public void Deserialize_RealisticState_Under10ms()
    {
        var state = BuildRealisticState();
        string json = JsonSerializer.Serialize(state);

        // Warmup
        JsonSerializer.Deserialize<PersistedState>(json);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
            JsonSerializer.Deserialize<PersistedState>(json);
        sw.Stop();

        double avgMs = sw.Elapsed.TotalMilliseconds / 100;
        Assert.True(avgMs < 10, $"Deserialize averaged {avgMs:F2}ms per call (limit: 10ms)");
    }

    [Fact]
    public void Roundtrip_RealisticState_PreservesAllData()
    {
        var state = BuildRealisticState();
        string json = JsonSerializer.Serialize(state);
        var deserialized = JsonSerializer.Deserialize<PersistedState>(json)!;

        Assert.Equal(state.SchemaVersion, deserialized.SchemaVersion);
        Assert.Equal(state.Profile.Xp, deserialized.Profile.Xp);
        Assert.Equal(state.Profile.Level, deserialized.Profile.Level);
        Assert.Equal(state.Profile.RatingByLanguage.Count, deserialized.Profile.RatingByLanguage.Count);
        Assert.Equal(state.RecentResults.Count, deserialized.RecentResults.Count);
        Assert.Equal(state.MistakeHeatmap.Records.Count, deserialized.MistakeHeatmap.Records.Count);
        Assert.Equal(state.WeaknessSnapshots.Count, deserialized.WeaknessSnapshots.Count);
        Assert.Equal(state.Settings.SignalPolicy.GuidedMode, deserialized.Settings.SignalPolicy.GuidedMode);
        Assert.Equal(state.Settings.SignalPolicy.SignalsAffectSelection,
            deserialized.Settings.SignalPolicy.SignalsAffectSelection);
    }

    [Fact]
    public void Serialize_StateJsonSize_Under100KB()
    {
        var state = BuildRealisticState();
        string json = JsonSerializer.Serialize(state);

        // Realistic state should be well under 100KB
        Assert.True(json.Length < 100_000,
            $"JSON size {json.Length} exceeds 100KB limit");
    }

    [Fact]
    public void Serialize_MaxedState_Under200KB()
    {
        var state = BuildRealisticState();

        // Max out heatmap to 200 chars
        for (int j = 100; j < 200; j++)
        {
            char c = (char)(33 + j);
            for (int k = 0; k < 20; k++) state.MistakeHeatmap.RecordHit(c);
            for (int k = 0; k < 20; k++) state.MistakeHeatmap.RecordMiss(c, (char)(65 + k % 20));
        }

        // Max out snapshots to 90
        while (state.WeaknessSnapshots.Count < 90)
        {
            state.WeaknessSnapshots.Add(new WeaknessSnapshot
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-state.WeaknessSnapshots.Count),
                TopWeaknesses = new List<LinuxDevTyper.Core.Mistakes.WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.3, TotalAttempts = 50 }
                }
            });
        }

        string json = JsonSerializer.Serialize(state);
        Assert.True(json.Length < 200_000,
            $"Maxed JSON size {json.Length} exceeds 200KB limit");
    }
}
