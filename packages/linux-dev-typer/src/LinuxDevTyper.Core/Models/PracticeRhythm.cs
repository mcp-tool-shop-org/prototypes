namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Time-of-day bracket for internal pattern tracking.
/// </summary>
public enum TimeBracket { Morning, Afternoon, Evening }

/// <summary>
/// Internal practice timing pattern tracker. Learns when the user tends to practice
/// without ever surfacing this information. The app responds to what you practice,
/// not when.
/// </summary>
public sealed class PracticeRhythm
{
    private const int WindowSize = 30;
    private const double DominantThreshold = 0.70;
    private const int MinSessionsForDominant = 5;

    public Dictionary<TimeBracket, int> BracketCounts { get; set; } = new();

    /// <summary>
    /// The dominant practice time bracket, or null if no bracket reaches 70%.
    /// </summary>
    public TimeBracket? DominantBracket { get; set; }

    /// <summary>
    /// Learn practice rhythm from recent results.
    /// </summary>
    public void LearnFromResults(IReadOnlyList<Result> results, int windowSize = WindowSize)
    {
        BracketCounts.Clear();
        DominantBracket = null;

        var recent = results
            .Skip(Math.Max(0, results.Count - windowSize))
            .ToList();

        if (recent.Count < MinSessionsForDominant)
            return;

        foreach (var r in recent)
        {
            var bracket = ClassifyTimeBracket(r.Timestamp.Hour);
            BracketCounts.TryGetValue(bracket, out int count);
            BracketCounts[bracket] = count + 1;
        }

        // Find dominant bracket (≥ 70% of sessions)
        foreach (var kv in BracketCounts)
        {
            if ((double)kv.Value / recent.Count >= DominantThreshold)
            {
                DominantBracket = kv.Key;
                break;
            }
        }
    }

    /// <summary>
    /// Classify an hour (0-23) into a time bracket.
    /// </summary>
    public static TimeBracket ClassifyTimeBracket(int hour)
    {
        return hour switch
        {
            >= 5 and < 12 => TimeBracket.Morning,
            >= 12 and < 17 => TimeBracket.Afternoon,
            _ => TimeBracket.Evening
        };
    }
}
