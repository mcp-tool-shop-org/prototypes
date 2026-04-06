namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Named practice configuration that bundles tuning overrides for all engine constants.
/// The "Default" profile matches hardcoded values from v0.5.0, ensuring zero behavioral
/// change when no profile is active. Users create custom profiles to tune practice behavior.
/// </summary>
public sealed class PracticeProfile
{
    public string Name { get; set; } = "Default";
    public string? Description { get; set; }

    // --- XP tuning ---

    /// <summary>Base multiplier for (WPM × accuracy%) in XP calculation. Default: 0.8</summary>
    public double XpBaseMultiplier { get; set; } = 0.8;

    /// <summary>Repeat decay coefficient: 1/(1 + decay × repeatCount). Default: 0.3</summary>
    public double XpRepeatDecay { get; set; } = 0.3;

    /// <summary>Accuracy below this threshold triggers sloppy penalty. Default: 70.0%</summary>
    public double XpSloppyThreshold { get; set; } = 70.0;

    /// <summary>XP multiplier applied when accuracy is below sloppy threshold. Default: 0.5</summary>
    public double XpSloppyPenalty { get; set; } = 0.5;

    /// <summary>Base XP bonus on snippet completion. Default: 25</summary>
    public int XpCompletionBonus { get; set; } = 25;

    // --- Rating tuning ---

    /// <summary>Elo K-factor: maximum rating shift per session. Default: 32</summary>
    public int RatingKFactor { get; set; } = 32;

    /// <summary>Base opponent rating in Elo formula. Default: 400</summary>
    public int RatingDifficultyBase { get; set; } = 400;

    /// <summary>Per-difficulty multiplier for opponent rating. Default: 200</summary>
    public int RatingDifficultyScale { get; set; } = 200;

    // --- Difficulty tuning ---

    /// <summary>Minimum average accuracy to establish a comfort zone. Default: 85.0%</summary>
    public double ComfortAccuracyThreshold { get; set; } = 85.0;

    /// <summary>Minimum sessions at a difficulty to establish comfort. Default: 3</summary>
    public int ComfortMinSessions { get; set; } = 3;

    /// <summary>Number of recent sessions checked for yo-yo detection. Default: 6</summary>
    public int YoYoWindowSize { get; set; } = 6;

    /// <summary>Accuracy swing threshold for yo-yo detection. Default: 20.0%</summary>
    public double YoYoAccuracySwing { get; set; } = 20.0;

    // --- Trend tuning ---

    /// <summary>WPM delta required to classify a non-Stable trend. Default: 2.0</summary>
    public double TrendWpmThreshold { get; set; } = 2.0;

    /// <summary>Accuracy delta required to classify a non-Stable trend. Default: 1.0</summary>
    public double TrendAccuracyThreshold { get; set; } = 1.0;

    /// <summary>Minimum sessions before reporting non-Stable trends. Default: 5</summary>
    public int TrendMinSessions { get; set; } = 5;

    // --- Fatigue tuning ---

    /// <summary>Suggest break after this many sessions in a sitting. Default: 5</summary>
    public int FatigueBreakSessions { get; set; } = 5;

    /// <summary>Suggest break if accuracy drops by this % within a sitting. Default: 3.0</summary>
    public double FatigueAccuracyDrop { get; set; } = 3.0;

    /// <summary>
    /// Clamp all parameters to safe ranges. Called at load time and before engine use.
    /// Prevents extreme values from breaking invariants.
    /// </summary>
    public PracticeProfile Clamp()
    {
        XpBaseMultiplier = Math.Clamp(XpBaseMultiplier, 0.1, 2.0);
        XpRepeatDecay = Math.Clamp(XpRepeatDecay, 0.0, 1.0);
        XpSloppyThreshold = Math.Clamp(XpSloppyThreshold, 50.0, 95.0);
        XpSloppyPenalty = Math.Clamp(XpSloppyPenalty, 0.0, 1.0);
        XpCompletionBonus = Math.Clamp(XpCompletionBonus, 0, 100);

        RatingKFactor = Math.Clamp(RatingKFactor, 8, 64);
        RatingDifficultyBase = Math.Clamp(RatingDifficultyBase, 100, 1000);
        RatingDifficultyScale = Math.Clamp(RatingDifficultyScale, 50, 500);

        ComfortAccuracyThreshold = Math.Clamp(ComfortAccuracyThreshold, 60.0, 98.0);
        ComfortMinSessions = Math.Clamp(ComfortMinSessions, 1, 10);
        YoYoWindowSize = Math.Clamp(YoYoWindowSize, 3, 20);
        YoYoAccuracySwing = Math.Clamp(YoYoAccuracySwing, 5.0, 50.0);

        TrendWpmThreshold = Math.Clamp(TrendWpmThreshold, 0.5, 10.0);
        TrendAccuracyThreshold = Math.Clamp(TrendAccuracyThreshold, 0.5, 5.0);
        TrendMinSessions = Math.Clamp(TrendMinSessions, 3, 20);

        FatigueBreakSessions = Math.Clamp(FatigueBreakSessions, 3, 20);
        FatigueAccuracyDrop = Math.Clamp(FatigueAccuracyDrop, 1.0, 15.0);

        return this;
    }

    /// <summary>
    /// Compare this profile to another and return a list of differences.
    /// Useful for showing "Changes from Default" in the UI.
    /// </summary>
    public List<(string Field, string ThisValue, string OtherValue)> Diff(PracticeProfile other)
    {
        var diffs = new List<(string, string, string)>();
        if (XpBaseMultiplier != other.XpBaseMultiplier) diffs.Add(("XP Multiplier", $"{XpBaseMultiplier:F2}", $"{other.XpBaseMultiplier:F2}"));
        if (XpRepeatDecay != other.XpRepeatDecay) diffs.Add(("Repeat Decay", $"{XpRepeatDecay:F2}", $"{other.XpRepeatDecay:F2}"));
        if (XpSloppyThreshold != other.XpSloppyThreshold) diffs.Add(("Sloppy Threshold", $"{XpSloppyThreshold:F0}%", $"{other.XpSloppyThreshold:F0}%"));
        if (XpSloppyPenalty != other.XpSloppyPenalty) diffs.Add(("Sloppy Penalty", $"{XpSloppyPenalty:F2}", $"{other.XpSloppyPenalty:F2}"));
        if (XpCompletionBonus != other.XpCompletionBonus) diffs.Add(("Completion Bonus", $"{XpCompletionBonus}", $"{other.XpCompletionBonus}"));
        if (RatingKFactor != other.RatingKFactor) diffs.Add(("Rating K-Factor", $"{RatingKFactor}", $"{other.RatingKFactor}"));
        if (RatingDifficultyBase != other.RatingDifficultyBase) diffs.Add(("Rating Base", $"{RatingDifficultyBase}", $"{other.RatingDifficultyBase}"));
        if (RatingDifficultyScale != other.RatingDifficultyScale) diffs.Add(("Rating Scale", $"{RatingDifficultyScale}", $"{other.RatingDifficultyScale}"));
        if (ComfortAccuracyThreshold != other.ComfortAccuracyThreshold) diffs.Add(("Comfort Accuracy", $"{ComfortAccuracyThreshold:F0}%", $"{other.ComfortAccuracyThreshold:F0}%"));
        if (ComfortMinSessions != other.ComfortMinSessions) diffs.Add(("Comfort Sessions", $"{ComfortMinSessions}", $"{other.ComfortMinSessions}"));
        if (YoYoWindowSize != other.YoYoWindowSize) diffs.Add(("Yo-Yo Window", $"{YoYoWindowSize}", $"{other.YoYoWindowSize}"));
        if (YoYoAccuracySwing != other.YoYoAccuracySwing) diffs.Add(("Yo-Yo Swing", $"{YoYoAccuracySwing:F0}%", $"{other.YoYoAccuracySwing:F0}%"));
        if (TrendWpmThreshold != other.TrendWpmThreshold) diffs.Add(("Trend WPM Threshold", $"{TrendWpmThreshold:F1}", $"{other.TrendWpmThreshold:F1}"));
        if (TrendAccuracyThreshold != other.TrendAccuracyThreshold) diffs.Add(("Trend Accuracy Threshold", $"{TrendAccuracyThreshold:F1}", $"{other.TrendAccuracyThreshold:F1}"));
        if (TrendMinSessions != other.TrendMinSessions) diffs.Add(("Trend Min Sessions", $"{TrendMinSessions}", $"{other.TrendMinSessions}"));
        if (FatigueBreakSessions != other.FatigueBreakSessions) diffs.Add(("Fatigue Sessions", $"{FatigueBreakSessions}", $"{other.FatigueBreakSessions}"));
        if (FatigueAccuracyDrop != other.FatigueAccuracyDrop) diffs.Add(("Fatigue Accuracy Drop", $"{FatigueAccuracyDrop:F1}%", $"{other.FatigueAccuracyDrop:F1}%"));
        return diffs;
    }

    /// <summary>Cached singleton with all default values. Never modified.</summary>
    private static readonly PracticeProfile _default = new();

    /// <summary>Returns the immutable default profile. Zero allocation on repeated access.</summary>
    public static PracticeProfile Default => _default;
}
