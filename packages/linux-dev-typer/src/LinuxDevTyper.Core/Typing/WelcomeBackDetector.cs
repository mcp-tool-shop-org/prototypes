using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

/// <summary>
/// Detects when a user is returning after an absence and generates
/// a contextual welcome-back message. Pure static engine.
/// </summary>
public static class WelcomeBackDetector
{
    /// <summary>
    /// Analyze recent results to determine if the user is returning after a gap.
    /// </summary>
    public static WelcomeBackReport Analyze(IReadOnlyList<Result> results, DateTimeOffset now)
    {
        if (results.Count == 0)
            return new WelcomeBackReport(false, null, null, null);

        var lastResult = results[^1];
        var gap = now - lastResult.Timestamp;

        var recap = new LastSessionRecap(lastResult.Language, lastResult.Difficulty, lastResult.Wpm);

        if (gap.TotalDays >= 30)
        {
            return new WelcomeBackReport(
                IsReturning: true,
                TimeSinceLastSession: gap,
                Message: "Welcome back. You've been away a while \u2014 your previous practice is still here.",
                LastSession: recap
            );
        }

        if (gap.TotalDays >= 7)
        {
            int days = (int)gap.TotalDays;
            return new WelcomeBackReport(
                IsReturning: true,
                TimeSinceLastSession: gap,
                Message: $"Welcome back. It's been {days} days \u2014 take it easy.",
                LastSession: recap
            );
        }

        if (gap.TotalHours >= 24)
        {
            return new WelcomeBackReport(
                IsReturning: true,
                TimeSinceLastSession: gap,
                Message: "Good to see you again.",
                LastSession: recap
            );
        }

        return new WelcomeBackReport(false, gap, null, null);
    }
}

/// <summary>
/// Report from WelcomeBackDetector analysis.
/// </summary>
public sealed record WelcomeBackReport(
    bool IsReturning,
    TimeSpan? TimeSinceLastSession,
    string? Message,
    LastSessionRecap? LastSession
);

/// <summary>
/// Summary of the user's last session, shown in the welcome-back banner.
/// </summary>
public sealed record LastSessionRecap(string Language, int Difficulty, double Wpm);
