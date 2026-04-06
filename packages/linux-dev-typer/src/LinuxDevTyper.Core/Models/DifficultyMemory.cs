namespace LinuxDevTyper.Core.Models;

/// <summary>
/// A single recorded outcome at a specific difficulty level.
/// </summary>
public sealed record DifficultyRecord(double Accuracy, double Wpm, DateTimeOffset Timestamp);

/// <summary>
/// Per-language comfort-zone tracking. Remembers recent performance at each
/// difficulty level to compute comfort zones and detect yo-yo patterns.
/// Stored in PersistedState.
/// </summary>
public sealed class DifficultyMemory
{
    private const int MaxRecordsPerDifficulty = 10;

    /// <summary>
    /// Per-language → per-difficulty → list of recent records.
    /// Keys: language (case-insensitive at call site), difficulty (1-7).
    /// </summary>
    public Dictionary<string, Dictionary<int, List<DifficultyRecord>>> History { get; set; } = new();

    /// <summary>
    /// Tracks how many sessions remain in a yo-yo lock (per language).
    /// When > 0, difficulty should be locked to comfort zone.
    /// </summary>
    public Dictionary<string, int> YoYoLockRemaining { get; set; } = new();

    /// <summary>
    /// Languages where the user has manually dismissed the yo-yo lock.
    /// Maps language → total record count at time of dismissal.
    /// Cleared when a new yo-yo pattern is detected from fresh data.
    /// </summary>
    public Dictionary<string, int> YoYoDismissedAt { get; set; } = new();

    /// <summary>
    /// Record a completed session's outcome at a given difficulty.
    /// </summary>
    public void RecordSession(string language, int difficulty, double accuracy, double wpm)
    {
        if (string.IsNullOrWhiteSpace(language)) return;
        var lang = language.ToLowerInvariant();

        if (!History.TryGetValue(lang, out var byDifficulty))
        {
            byDifficulty = new Dictionary<int, List<DifficultyRecord>>();
            History[lang] = byDifficulty;
        }

        if (!byDifficulty.TryGetValue(difficulty, out var records))
        {
            records = new List<DifficultyRecord>();
            byDifficulty[difficulty] = records;
        }

        records.Add(new DifficultyRecord(accuracy, wpm, DateTimeOffset.UtcNow));

        // Trim to last N records
        while (records.Count > MaxRecordsPerDifficulty)
            records.RemoveAt(0);

        // Decrement yo-yo lock if active
        if (YoYoLockRemaining.TryGetValue(lang, out int remaining) && remaining > 0)
            YoYoLockRemaining[lang] = remaining - 1;
    }

    /// <summary>
    /// Returns true when a record looks like an outlier (cat on keyboard, interrupted).
    /// Outlier: accuracy &lt; 60% AND wpm &lt; 50% of language median.
    /// Requires 3+ records for median calculation.
    /// </summary>
    public bool IsOutlier(string language, double accuracy, double wpm)
    {
        if (accuracy >= 60.0)
            return false;

        var lang = language.ToLowerInvariant();
        if (!History.TryGetValue(lang, out var byDifficulty))
            return false;

        var allWpm = byDifficulty.Values
            .SelectMany(records => records)
            .Select(r => r.Wpm)
            .OrderBy(w => w)
            .ToList();

        if (allWpm.Count < 3)
            return false;

        double median = allWpm[allWpm.Count / 2];
        return wpm < median * 0.5;
    }

    /// <summary>
    /// Returns the difficulty where the player has avg accuracy above the comfort
    /// threshold with enough sessions. Excludes outlier records from the average.
    /// When profile is null, uses default constants (matching v0.5.0 behavior).
    /// </summary>
    public int? ComfortZone(string language, PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;
        var lang = language.ToLowerInvariant();
        if (!History.TryGetValue(lang, out var byDifficulty))
            return null;

        int? best = null;
        foreach (var (diff, records) in byDifficulty)
        {
            // Exclude outlier records from comfort zone calculation
            var valid = records
                .Where(r => !IsOutlier(language, r.Accuracy, r.Wpm))
                .ToList();

            if (valid.Count < p.ComfortMinSessions)
                continue;

            double avgAcc = valid.Average(r => r.Accuracy);
            if (avgAcc >= p.ComfortAccuracyThreshold)
            {
                if (best == null || diff > best.Value)
                    best = diff;
            }
        }

        return best;
    }

    /// <summary>
    /// Returns comfort zone + 1, clamped to [1, 7].
    /// Returns null if no comfort zone is established.
    /// </summary>
    public int? SuggestedDifficulty(string language, PracticeProfile? profile = null)
    {
        var comfort = ComfortZone(language, profile);
        if (comfort == null) return null;
        return Math.Min(7, comfort.Value + 1);
    }

    /// <summary>
    /// Remove records older than the specified age (default 30 days).
    /// After a long absence, old data becomes less relevant.
    /// </summary>
    public void AgeRecords(DateTimeOffset now, int maxAgeDays = 30)
    {
        var cutoff = now.AddDays(-maxAgeDays);
        foreach (var (lang, byDifficulty) in History)
        {
            foreach (var (diff, records) in byDifficulty)
            {
                records.RemoveAll(r => r.Timestamp < cutoff);
            }
        }
    }

    /// <summary>
    /// Clear all yo-yo state and dismissals for a language.
    /// Used when the user returns after a long absence — comfort zones soften naturally.
    /// </summary>
    public void SoftenComfortZone(string language)
    {
        var lang = language.ToLowerInvariant();
        YoYoLockRemaining.Remove(lang);
        YoYoDismissedAt.Remove(lang);
    }

    /// <summary>
    /// Manually dismiss the yo-yo lock for a language.
    /// Allows the user to override the system's stability suggestion.
    /// </summary>
    public void DismissYoYoLock(string language)
    {
        var lang = language.ToLowerInvariant();
        YoYoLockRemaining[lang] = 0;
        YoYoDismissedAt[lang] = TotalRecordCount(lang);
    }

    /// <summary>
    /// Detects if the player has been yo-yoing between difficulties.
    /// Checks last N sessions (from profile): if difficulties alternate between 2+ values
    /// and accuracy swings exceed threshold, returns true.
    /// When profile is null, uses default constants (matching v0.5.0 behavior).
    /// </summary>
    public bool IsYoYoing(string language, PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;
        var lang = language.ToLowerInvariant();

        // If user dismissed this lock, respect that unless new data shows a fresh pattern
        if (YoYoDismissedAt.TryGetValue(lang, out int dismissedAtCount))
        {
            int currentCount = TotalRecordCount(lang);
            // Need at least YoYoWindowSize new records after dismissal to detect fresh pattern
            if (currentCount - dismissedAtCount < p.YoYoWindowSize)
                return false;
            // Enough new data — remove dismissal and let normal detection proceed
            YoYoDismissedAt.Remove(lang);
        }

        // If currently locked, report as yo-yoing so lock stays
        if (YoYoLockRemaining.TryGetValue(lang, out int remaining) && remaining > 0)
            return true;

        if (!History.TryGetValue(lang, out var byDifficulty))
            return false;

        // Collect all records across difficulties, sorted by timestamp
        var allRecords = byDifficulty
            .SelectMany(kv => kv.Value.Select(r => (Difficulty: kv.Key, Record: r)))
            .OrderBy(x => x.Record.Timestamp)
            .TakeLast(p.YoYoWindowSize)
            .ToList();

        if (allRecords.Count < p.YoYoWindowSize)
            return false;

        // Check: at least 2 distinct difficulties
        var distinctDiffs = allRecords.Select(x => x.Difficulty).Distinct().Count();
        if (distinctDiffs < 2)
            return false;

        // Check: accuracy swing > threshold
        double maxAcc = allRecords.Max(x => x.Record.Accuracy);
        double minAcc = allRecords.Min(x => x.Record.Accuracy);
        if (maxAcc - minAcc > p.YoYoAccuracySwing)
        {
            // Activate lock
            YoYoLockRemaining[lang] = 3;
            return true;
        }

        return false;
    }

    private int TotalRecordCount(string lang)
    {
        if (!History.TryGetValue(lang, out var byDifficulty))
            return 0;
        return byDifficulty.Values.Sum(records => records.Count);
    }
}
