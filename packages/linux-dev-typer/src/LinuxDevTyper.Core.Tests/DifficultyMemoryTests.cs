using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class DifficultyMemoryTests
{
    [Fact]
    public void EmptyHistory_ComfortZone_ReturnsNull()
    {
        var mem = new DifficultyMemory();
        Assert.Null(mem.ComfortZone("python"));
    }

    [Fact]
    public void SingleLanguage_RecordSession_Tracked()
    {
        var mem = new DifficultyMemory();
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 3, 88, 48);
        mem.RecordSession("python", 3, 92, 52);

        // 3 sessions at difficulty 3 with avg > 85% → comfort zone = 3
        Assert.Equal(3, mem.ComfortZone("python"));
    }

    [Fact]
    public void ComfortZone_PicksHighestQualifying()
    {
        var mem = new DifficultyMemory();
        // Difficulty 2: good accuracy
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 2, 90, 50);
        // Difficulty 4: good accuracy
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 4, 87, 45);
        // Difficulty 5: poor accuracy
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 5, 60, 30);

        // Should pick 4 (highest with avg ≥ 85%)
        Assert.Equal(4, mem.ComfortZone("python"));
    }

    [Fact]
    public void ComfortZone_NeedMinSessions()
    {
        var mem = new DifficultyMemory();
        // Only 2 sessions (below threshold of 3)
        mem.RecordSession("python", 3, 95, 55);
        mem.RecordSession("python", 3, 92, 50);

        Assert.Null(mem.ComfortZone("python"));
    }

    [Fact]
    public void SuggestedDifficulty_ComfortPlusOne()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 3, 90, 50);

        Assert.Equal(4, mem.SuggestedDifficulty("python"));
    }

    [Fact]
    public void SuggestedDifficulty_ClampedAt7()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 7, 90, 50);

        Assert.Equal(7, mem.SuggestedDifficulty("python"));
    }

    [Fact]
    public void YoYo_NotDetectedWithFewSessions()
    {
        var mem = new DifficultyMemory();
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 5, 60, 30);

        Assert.False(mem.IsYoYoing("python"));
    }

    [Fact]
    public void YoYo_DetectedWithAlternatingDifficulties()
    {
        var mem = new DifficultyMemory();
        // Alternate between diff 3 (high acc) and diff 5 (low acc) — 6 sessions
        mem.RecordSession("python", 3, 95, 55);
        mem.RecordSession("python", 5, 60, 30);
        mem.RecordSession("python", 3, 92, 52);
        mem.RecordSession("python", 5, 65, 32);
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 5, 62, 28);

        Assert.True(mem.IsYoYoing("python"));
    }

    [Fact]
    public void MultiLanguage_Independent()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 4, 90, 50);
        for (int i = 0; i < 3; i++) mem.RecordSession("rust", 2, 88, 40);

        Assert.Equal(4, mem.ComfortZone("python"));
        Assert.Equal(2, mem.ComfortZone("rust"));
    }

    [Fact]
    public void RecordSession_TrimsOldRecords()
    {
        var mem = new DifficultyMemory();
        // Add 15 records — should trim to 10
        for (int i = 0; i < 15; i++) mem.RecordSession("python", 3, 80 + i, 40 + i);

        var records = mem.History["python"][3];
        Assert.Equal(10, records.Count);
    }

    [Fact]
    public void AgeRecords_EmptyHistory_NoCrash()
    {
        var mem = new DifficultyMemory();
        // No records at all — should not throw
        mem.AgeRecords(DateTimeOffset.UtcNow.AddDays(31));
        Assert.Empty(mem.History);
    }

    [Fact]
    public void SoftenComfortZone_UnknownLanguage_NoCrash()
    {
        var mem = new DifficultyMemory();
        // Soften a language that was never recorded — should not throw
        mem.SoftenComfortZone("nonexistent");
        Assert.False(mem.YoYoLockRemaining.ContainsKey("nonexistent"));
    }

    [Fact]
    public void DismissYoYoLock_ClearsLock()
    {
        var mem = new DifficultyMemory();
        // Create yo-yo pattern: alternating difficulties with accuracy swing
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 70, 40);
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 68, 38);
        mem.RecordSession("python", 3, 94, 50);
        mem.RecordSession("python", 5, 72, 42);

        Assert.True(mem.IsYoYoing("python"));

        mem.DismissYoYoLock("python");
        Assert.False(mem.IsYoYoing("python"));
    }

    [Fact]
    public void DismissedLock_RecurrenceReactivates()
    {
        var mem = new DifficultyMemory();
        // Create and dismiss yo-yo pattern
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 70, 40);
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 68, 38);
        mem.RecordSession("python", 3, 94, 50);
        mem.RecordSession("python", 5, 72, 42);

        Assert.True(mem.IsYoYoing("python"));
        mem.DismissYoYoLock("python");
        Assert.False(mem.IsYoYoing("python"));

        // New yo-yo pattern after dismissal (new records push into window)
        mem.RecordSession("python", 3, 96, 50);
        mem.RecordSession("python", 5, 69, 39);
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 67, 37);
        mem.RecordSession("python", 3, 95, 50);
        mem.RecordSession("python", 5, 71, 41);

        // Re-checking should detect new pattern and reactivate
        Assert.True(mem.IsYoYoing("python"));
    }

    [Fact]
    public void AgeRecords_RemovesOld()
    {
        var mem = new DifficultyMemory();
        // Add records (they use DateTimeOffset.UtcNow internally)
        for (int i = 0; i < 5; i++) mem.RecordSession("python", 3, 90, 50);

        // Age with cutoff in the future — nothing removed
        mem.AgeRecords(DateTimeOffset.UtcNow.AddDays(1), maxAgeDays: 30);
        Assert.Equal(5, mem.History["python"][3].Count);

        // Age with cutoff that makes all records "old"
        mem.AgeRecords(DateTimeOffset.UtcNow.AddDays(31), maxAgeDays: 30);
        Assert.Empty(mem.History["python"][3]);
    }

    [Fact]
    public void AgeRecords_KeepsRecent()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 3, 90, 50);

        // Age from now — records are fresh, should keep all
        mem.AgeRecords(DateTimeOffset.UtcNow);
        Assert.Equal(3, mem.History["python"][3].Count);
    }

    [Fact]
    public void IsOutlier_HighAccuracy_ReturnsFalse()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 5; i++) mem.RecordSession("python", 3, 90, 50);

        Assert.False(mem.IsOutlier("python", 85, 45));
    }

    [Fact]
    public void IsOutlier_LowAccuracyLowWpm_ReturnsTrue()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 5; i++) mem.RecordSession("python", 3, 90, 50);

        // accuracy < 60 and wpm < 50% of median (50) = 25
        Assert.True(mem.IsOutlier("python", 40, 20));
    }

    [Fact]
    public void IsOutlier_LowAccuracyNormalWpm_ReturnsFalse()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 5; i++) mem.RecordSession("python", 3, 90, 50);

        // accuracy < 60 but wpm is normal
        Assert.False(mem.IsOutlier("python", 50, 45));
    }

    [Fact]
    public void ComfortZone_ExcludesOutlier()
    {
        var mem = new DifficultyMemory();
        // 3 good sessions + 1 terrible outlier
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 3, 88, 48);
        mem.RecordSession("python", 3, 92, 52);
        mem.RecordSession("python", 3, 30, 15); // outlier: acc < 60, wpm < 50% median

        // Without outlier exclusion, avg acc = (90+88+92+30)/4 = 75 → no comfort zone
        // With outlier exclusion, avg acc = (90+88+92)/3 = 90 → comfort zone = 3
        Assert.Equal(3, mem.ComfortZone("python"));
    }

    [Fact]
    public void IsOutlier_TooFewRecords_ReturnsFalse()
    {
        var mem = new DifficultyMemory();
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 3, 88, 48);

        // Only 2 records, need 3 for median
        Assert.False(mem.IsOutlier("python", 30, 10));
    }

    [Fact]
    public void SoftenComfortZone_ClearsAll()
    {
        var mem = new DifficultyMemory();
        // Create yo-yo pattern
        for (int i = 0; i < 3; i++)
        {
            mem.RecordSession("python", 3, 95, 50);
            mem.RecordSession("python", 5, 70, 40);
        }
        Assert.True(mem.IsYoYoing("python"));

        mem.SoftenComfortZone("python");

        // Yo-yo lock should be cleared
        Assert.False(mem.YoYoLockRemaining.ContainsKey("python") && mem.YoYoLockRemaining["python"] > 0);
        Assert.False(mem.YoYoDismissedAt.ContainsKey("python"));
    }

    [Fact]
    public void CustomProfile_LowerComfortThreshold()
    {
        var mem = new DifficultyMemory();
        // 3 sessions at 78% accuracy — below default (85%) but above custom (70%)
        mem.RecordSession("python", 3, 78, 50);
        mem.RecordSession("python", 3, 80, 48);
        mem.RecordSession("python", 3, 76, 52);

        var profile = new PracticeProfile { ComfortAccuracyThreshold = 70.0 };

        Assert.Null(mem.ComfortZone("python"));  // Default: 78% avg < 85%
        Assert.Equal(3, mem.ComfortZone("python", profile));  // Custom: 78% avg ≥ 70%
    }

    [Fact]
    public void CustomProfile_HigherMinSessions()
    {
        var mem = new DifficultyMemory();
        // 3 sessions (enough for default min=3, not enough for custom min=5)
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 3, 90, 50);

        var profile = new PracticeProfile { ComfortMinSessions = 5 };

        Assert.Equal(3, mem.ComfortZone("python"));  // Default: 3 ≥ 3
        Assert.Null(mem.ComfortZone("python", profile));  // Custom: 3 < 5
    }

    [Fact]
    public void CustomProfile_SmallerYoYoWindow_DetectsEarlier()
    {
        var mem = new DifficultyMemory();
        // 4 alternating sessions — below default window (6) but at custom window (4)
        mem.RecordSession("python", 3, 95, 55);
        mem.RecordSession("python", 5, 60, 30);
        mem.RecordSession("python", 3, 92, 52);
        mem.RecordSession("python", 5, 65, 32);

        var profile = new PracticeProfile { YoYoWindowSize = 4 };

        Assert.False(mem.IsYoYoing("python"));  // Default: only 4 < 6
        Assert.True(mem.IsYoYoing("python", profile));  // Custom: 4 ≥ 4
    }

    [Fact]
    public void CustomProfile_HigherYoYoSwingThreshold()
    {
        var mem = new DifficultyMemory();
        // 6 sessions alternating with ~30% swing (above default 20%, below custom 40%)
        mem.RecordSession("python", 3, 95, 55);
        mem.RecordSession("python", 5, 65, 30);
        mem.RecordSession("python", 3, 92, 52);
        mem.RecordSession("python", 5, 68, 32);
        mem.RecordSession("python", 3, 90, 50);
        mem.RecordSession("python", 5, 62, 28);

        var profile = new PracticeProfile { YoYoAccuracySwing = 40.0 };

        Assert.True(mem.IsYoYoing("python"));  // Default: 33% > 20%
        // Reset lock before testing custom profile
        mem.YoYoLockRemaining["python"] = 0;
        Assert.False(mem.IsYoYoing("python", profile));  // Custom: 33% < 40%
    }

    [Fact]
    public void NullProfile_MatchesDefault()
    {
        var mem = new DifficultyMemory();
        for (int i = 0; i < 3; i++) mem.RecordSession("python", 3, 90, 50);

        Assert.Equal(mem.ComfortZone("python"), mem.ComfortZone("python", null));
        Assert.Equal(mem.SuggestedDifficulty("python"), mem.SuggestedDifficulty("python", null));
        Assert.Equal(mem.IsYoYoing("python"), mem.IsYoYoing("python", null));
    }

    [Fact]
    public void CommunityDifficulty_NeverRecorded()
    {
        // RecordSession takes authored difficulty (int), not CommunityDifficulty (double?).
        // Even if a snippet has CommunityDifficulty=1.0 but authored Difficulty=5,
        // only Difficulty=5 is recorded.
        var mem = new DifficultyMemory();

        // Simulate what MainViewModel does: records _currentSnippet.Difficulty, not CommunityDifficulty
        var snippet = new Snippet { Difficulty = 5, CommunityDifficulty = 1.0 };
        mem.RecordSession("python", snippet.Difficulty, 90, 50);
        mem.RecordSession("python", snippet.Difficulty, 88, 48);
        mem.RecordSession("python", snippet.Difficulty, 92, 52);

        // Comfort zone reflects authored difficulty (5), not community (1.0)
        Assert.Equal(5, mem.ComfortZone("python"));

        // RecordSession signature enforces int (authored) — CommunityDifficulty (double?) cannot be passed
        var method = typeof(DifficultyMemory).GetMethod("RecordSession")!;
        var diffParam = method.GetParameters()[1]; // second param is difficulty
        Assert.Equal(typeof(int), diffParam.ParameterType);
    }
}
