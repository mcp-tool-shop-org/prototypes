namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Describes why the user is practicing this session.
/// Purely descriptive — has zero impact on scoring, XP, or difficulty.
/// </summary>
public enum PracticeIntent
{
    /// <summary>No intent selected (default).</summary>
    None,

    /// <summary>Getting warmed up before serious practice.</summary>
    Warmup,

    /// <summary>Exploring a new language or snippet type.</summary>
    Explore,

    /// <summary>Deliberate repetition to build muscle memory.</summary>
    Drill,

    /// <summary>Pushing beyond comfort zone intentionally.</summary>
    Challenge
}
