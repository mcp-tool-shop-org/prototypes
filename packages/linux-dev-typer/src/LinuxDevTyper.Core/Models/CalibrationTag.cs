namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Constants for calibration content tagging and identification.
/// Calibration items use these to distinguish themselves from
/// builtin, user, and community content.
/// </summary>
public static class CalibrationTag
{
    /// <summary>
    /// Source tag for calibration content.
    /// </summary>
    public const string Source = "calibration";

    /// <summary>
    /// Origin tag for the initial calibration pack generation.
    /// </summary>
    public const string Origin = "calibration-pack-v1";

    /// <summary>
    /// ID prefix for all calibration snippet IDs.
    /// Convention: cal-{lang_prefix}-d{band}-{seq}.
    /// </summary>
    public const string IdPrefix = "cal-";

    /// <summary>
    /// Returns true if the snippet ID belongs to a calibration item.
    /// Calibration results should be excluded from lifetime stats and personal bests.
    /// </summary>
    public static bool IsCalibration(string? snippetId)
        => snippetId?.StartsWith(IdPrefix, StringComparison.OrdinalIgnoreCase) == true;
}
