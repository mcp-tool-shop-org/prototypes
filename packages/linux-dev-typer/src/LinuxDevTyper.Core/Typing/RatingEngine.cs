using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Simple Elo-inspired rating adjustment.
///
/// Constants:
///   K = 32        — maximum rating shift per session (standard Elo K-factor)
///   ScaleFactor   — maps difficulty to an "opponent rating" (difficulty * 200 + 400)
///   Performance   — combined score from accuracy (70% weight) and WPM bonus (30% weight)
/// </summary>
public static class RatingEngine
{
    /// <summary>
    /// Compute new rating after a completed session.
    /// When profile is null, uses default constants (matching v0.5.0 behavior).
    /// </summary>
    public static int Adjust(int currentRating, int snippetDifficulty, Result result,
                             PracticeProfile? profile = null)
    {
        var p = profile ?? PracticeProfile.Default;

        // Map snippet difficulty to an "opponent rating"
        int opponentRating = p.RatingDifficultyBase + (snippetDifficulty * p.RatingDifficultyScale);

        // Expected score (Elo formula): E = 1 / (1 + 10^((opponent - player) / 400))
        double expected = 1.0 / (1.0 + Math.Pow(10.0, (opponentRating - currentRating) / 400.0));

        // Actual score: blend of accuracy and WPM performance
        double accScore = Math.Clamp(result.Accuracy / 100.0, 0.0, 1.0);
        double wpmScore = Math.Clamp(result.Wpm / 60.0, 0.0, 1.0);
        double actual = (accScore * 0.7) + (wpmScore * 0.3);

        // Elo adjustment
        int delta = (int)Math.Round(p.RatingKFactor * (actual - expected));
        int newRating = currentRating + delta;

        return Math.Max(100, newRating);
    }
}
