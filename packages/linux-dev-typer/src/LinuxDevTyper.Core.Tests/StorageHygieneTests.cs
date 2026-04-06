using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

/// <summary>
/// Verifies signal storage hygiene: bounded growth, deterministic pruning,
/// and cap enforcement for heatmap records, confusion pairs, and snapshots.
/// </summary>
public class StorageHygieneTests
{
    // --- Heatmap character cap ---

    [Fact]
    public void Prune_CapsTrackedCharacters()
    {
        var heatmap = new MistakeHeatmap();

        // Record 250 distinct characters (beyond MaxTrackedChars = 200)
        for (int i = 0; i < 250; i++)
        {
            char c = (char)(33 + i); // printable ASCII starting from '!'
            for (int j = 0; j < 5; j++) heatmap.RecordHit(c);
            heatmap.RecordMiss(c, null);
        }

        Assert.Equal(250, heatmap.Records.Count);

        heatmap.Prune();

        Assert.Equal(MistakeHeatmap.MaxTrackedChars, heatmap.Records.Count);
    }

    [Fact]
    public void Prune_KeepsMostAttemptedCharacters()
    {
        var heatmap = new MistakeHeatmap();

        // Low-attempt characters
        for (int i = 0; i < 210; i++)
        {
            char c = (char)(33 + i);
            heatmap.RecordHit(c); // 1 attempt each
        }

        // High-attempt character
        char important = '{';
        for (int i = 0; i < 100; i++) heatmap.RecordHit(important);
        for (int i = 0; i < 50; i++) heatmap.RecordMiss(important, null);

        heatmap.Prune();

        // High-attempt character should survive
        Assert.True(heatmap.Records.ContainsKey(important));
        Assert.Equal(MistakeHeatmap.MaxTrackedChars, heatmap.Records.Count);
    }

    [Fact]
    public void Prune_DeterministicTieBreak()
    {
        var heatmap1 = new MistakeHeatmap();
        var heatmap2 = new MistakeHeatmap();

        // Same data in both heatmaps
        for (int i = 0; i < 210; i++)
        {
            char c = (char)(33 + i);
            heatmap1.RecordHit(c);
            heatmap2.RecordHit(c);
        }

        heatmap1.Prune();
        heatmap2.Prune();

        var keys1 = heatmap1.Records.Keys.OrderBy(k => k).ToList();
        var keys2 = heatmap2.Records.Keys.OrderBy(k => k).ToList();

        Assert.Equal(keys1, keys2); // Deterministic pruning
    }

    [Fact]
    public void Prune_NoOpWhenUnderLimit()
    {
        var heatmap = new MistakeHeatmap();

        for (int i = 0; i < 50; i++)
        {
            char c = (char)(33 + i);
            heatmap.RecordHit(c);
        }

        int countBefore = heatmap.Records.Count;
        heatmap.Prune();

        Assert.Equal(countBefore, heatmap.Records.Count); // No change
    }

    // --- Confusion pair cap ---

    [Fact]
    public void Prune_CapsConfusionPairs()
    {
        var heatmap = new MistakeHeatmap();

        // Record 30 different confusion pairs for '{'
        for (int i = 0; i < 30; i++)
        {
            char confused = (char)('a' + i);
            for (int j = 0; j < (30 - i); j++) // Varying counts for ordering
                heatmap.RecordMiss('{', confused);
        }

        Assert.True(heatmap.Records['{'].ConfusedWith.Count > MistakeHeatmap.MaxConfusionPairs);

        heatmap.Prune();

        Assert.Equal(MistakeHeatmap.MaxConfusionPairs, heatmap.Records['{'].ConfusedWith.Count);
    }

    [Fact]
    public void Prune_KeepsMostFrequentConfusionPairs()
    {
        var heatmap = new MistakeHeatmap();

        // One very common confusion
        for (int i = 0; i < 100; i++)
            heatmap.RecordMiss('{', '[');

        // Many rare confusions
        for (int i = 0; i < 25; i++)
        {
            char confused = (char)('a' + i);
            heatmap.RecordMiss('{', confused);
        }

        heatmap.Prune();

        // Most frequent pair should survive
        Assert.True(heatmap.Records['{'].ConfusedWith.ContainsKey('['));
    }

    // --- Snapshot cap ---

    [Fact]
    public void MaybeSnapshot_CapsAt90()
    {
        var heatmap = new MistakeHeatmap();
        for (int i = 0; i < 10; i++) heatmap.RecordHit('{');
        for (int i = 0; i < 5; i++) heatmap.RecordMiss('{', null);

        var snapshots = new List<WeaknessSnapshot>();

        // Pre-fill with 95 snapshots on different days
        for (int day = 0; day < 95; day++)
        {
            snapshots.Add(new WeaknessSnapshot
            {
                Language = "python",
                CapturedAt = DateTime.UtcNow.AddDays(-100 + day),
                TopWeaknesses = new List<LinuxDevTyper.Core.Mistakes.WeaknessEntry>
                {
                    new() { Character = '{', ErrorRate = 0.5, TotalAttempts = 15 }
                }
            });
        }

        Assert.Equal(95, snapshots.Count);

        // MaybeSnapshot should add one and prune to 90
        WeaknessTracker.MaybeSnapshot("rust", heatmap, snapshots);

        Assert.True(snapshots.Count <= 90, $"Expected <= 90, got {snapshots.Count}");
    }

    // --- RecentAttempts rolling window cap ---

    [Fact]
    public void RecentAttempts_CappedAtWindowSize()
    {
        var heatmap = new MistakeHeatmap();

        // Record way more than the cap
        int cap = MistakeHeatmap.DefaultWindowSize * 2; // 100
        for (int i = 0; i < cap + 50; i++)
            heatmap.RecordHit('{');

        Assert.True(heatmap.Records['{'].RecentAttempts.Count <= cap);
    }

    // --- Prune called during snapshot ---

    [Fact]
    public void MaybeSnapshot_TriggersPrune()
    {
        var heatmap = new MistakeHeatmap();

        // Create 210 tracked characters (above 200 limit)
        for (int i = 0; i < 210; i++)
        {
            char c = (char)(33 + i);
            for (int j = 0; j < 5; j++) heatmap.RecordHit(c);
            heatmap.RecordMiss(c, null);
        }

        Assert.Equal(210, heatmap.Records.Count);

        var snapshots = new List<WeaknessSnapshot>();
        WeaknessTracker.MaybeSnapshot("python", heatmap, snapshots);

        // After snapshot, prune should have been called
        Assert.True(heatmap.Records.Count <= MistakeHeatmap.MaxTrackedChars,
            $"Expected <= {MistakeHeatmap.MaxTrackedChars}, got {heatmap.Records.Count}");
    }

    // --- Constants are reasonable ---

    [Fact]
    public void StorageConstants_AreReasonable()
    {
        Assert.Equal(200, MistakeHeatmap.MaxTrackedChars);
        Assert.Equal(20, MistakeHeatmap.MaxConfusionPairs);
        Assert.Equal(50, MistakeHeatmap.DefaultWindowSize);
    }
}
