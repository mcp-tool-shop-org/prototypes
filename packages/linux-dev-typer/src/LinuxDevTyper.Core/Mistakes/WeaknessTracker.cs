using System.Text.Json.Serialization;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Mistakes;

/// <summary>
/// Enhances weakness reporting with improvement context.
/// Instead of just showing "you're bad at '{'" it shows
/// "'{' is improving (was 40% err, now 25% err)".
///
/// Combines current MistakeHeatmap state with historical snapshots
/// to produce weakness reports that acknowledge progress.
///
/// Self-contained — stores its own snapshot history without
/// depending on external longitudinal data structures.
/// </summary>
public sealed class WeaknessTracker
{
    /// <summary>
    /// Produces an enriched weakness report for a language.
    /// Combines current heatmap with historical snapshots.
    /// </summary>
    public WeaknessReport GetReport(
        string language, MistakeHeatmap heatmap, List<WeaknessSnapshot> snapshots)
    {
        var lang = language?.ToLowerInvariant() ?? "";
        var currentWeakest = heatmap.GetWeakest(count: 10, minAttempts: 5);

        if (currentWeakest.Count == 0)
        {
            return new WeaknessReport
            {
                Language = lang,
                HasData = false
            };
        }

        // Get historical changes by comparing the two most recent snapshots
        var changes = CompareRecentSnapshots(snapshots, lang);
        var changeMap = changes.ToDictionary(c => c.Character, c => c);

        // Build enriched weakness items
        var items = new List<WeaknessItem>();
        foreach (var weakness in currentWeakest)
        {
            var item = new WeaknessItem
            {
                Character = weakness.Character,
                CurrentErrorRate = weakness.ErrorRate,
                TotalAttempts = weakness.TotalAttempts,
                TotalMisses = weakness.TotalMisses,
                Category = weakness.Category,
                TopConfusion = weakness.TopConfusion
            };

            if (changeMap.TryGetValue(weakness.Character, out var change))
            {
                item.PreviousErrorRate = change.OldErrorRate;
                item.Improvement = change.Improvement;
                item.Trajectory = ClassifyTrajectory(change.Improvement, change.OldErrorRate);
            }
            else
            {
                item.Trajectory = WeaknessTrajectory.New;
            }

            items.Add(item);
        }

        // Find resolved weaknesses — chars that were weak before but aren't anymore
        var resolved = new List<ResolvedWeakness>();
        foreach (var change in changes)
        {
            bool stillWeak = currentWeakest.Any(w => w.Character == change.Character);
            if (!stillWeak && change.Improvement > 0.1)
            {
                resolved.Add(new ResolvedWeakness
                {
                    Character = change.Character,
                    OldErrorRate = change.OldErrorRate,
                    CurrentErrorRate = change.NewErrorRate
                });
            }
        }

        // Compute overall weakness trajectory
        int improving = items.Count(i => i.Trajectory == WeaknessTrajectory.Improving);
        int worsening = items.Count(i => i.Trajectory == WeaknessTrajectory.Worsening);
        int steady = items.Count(i => i.Trajectory == WeaknessTrajectory.Steady);

        return new WeaknessReport
        {
            Language = lang,
            HasData = true,
            Items = items,
            ResolvedWeaknesses = resolved,
            ImprovingCount = improving,
            WorseningCount = worsening,
            SteadyCount = steady,
            Summary = ComputeSummary(improving, worsening, steady, resolved.Count)
        };
    }

    /// <summary>
    /// Gets the single most important weakness to focus on.
    /// Prefers worsening weaknesses, then new ones, then steady.
    /// </summary>
    public WeaknessItem? GetPriorityWeakness(WeaknessReport report)
    {
        if (!report.HasData || report.Items.Count == 0) return null;

        // Priority: worsening > new > steady > improving
        return report.Items
            .OrderByDescending(i => i.Trajectory switch
            {
                WeaknessTrajectory.Worsening => 4,
                WeaknessTrajectory.New => 3,
                WeaknessTrajectory.Steady => 2,
                WeaknessTrajectory.Improving => 1,
                _ => 0
            })
            .ThenByDescending(i => i.CurrentErrorRate)
            .FirstOrDefault();
    }

    /// <summary>
    /// Captures a weakness snapshot if enough time has passed since the last one
    /// for this language (at most once per day).
    /// </summary>
    public static void MaybeSnapshot(
        string language, MistakeHeatmap heatmap, List<WeaknessSnapshot> snapshots)
    {
        var lang = language?.ToLowerInvariant() ?? "unknown";
        var today = DateTime.UtcNow.Date;

        // Check if we already have a snapshot for this language today
        bool alreadySnapped = snapshots.Any(s =>
            s.Language == lang && s.CapturedAt.Date == today);

        if (alreadySnapped) return;

        var weakest = heatmap.GetWeakest(count: 10, minAttempts: 3);
        if (weakest.Count == 0) return;

        var snapshot = new WeaknessSnapshot
        {
            Language = lang,
            CapturedAt = DateTime.UtcNow,
            TopWeaknesses = weakest.Select(w => new WeaknessEntry
            {
                Character = w.Character,
                ErrorRate = Math.Round(w.ErrorRate, 3),
                TotalAttempts = w.TotalAttempts
            }).ToList()
        };

        snapshots.Add(snapshot);

        // Cap at 90 snapshots (~3 months of daily snapshots per language)
        while (snapshots.Count > 90)
        {
            snapshots.RemoveAt(0);
        }

        // Storage hygiene: prune heatmap on snapshot (at most once/day)
        heatmap.Prune();
    }

    /// <summary>
    /// Compares the two most recent weakness snapshots for a language.
    /// Returns improvements for each character that appeared in the older snapshot.
    /// </summary>
    private static List<WeaknessChange> CompareRecentSnapshots(
        List<WeaknessSnapshot> snapshots, string language)
    {
        var langSnapshots = snapshots
            .Where(s => s.Language == language)
            .OrderByDescending(s => s.CapturedAt)
            .Take(2)
            .ToList();

        if (langSnapshots.Count < 2) return new();

        var newer = langSnapshots[0];
        var older = langSnapshots[1];
        var changes = new List<WeaknessChange>();

        foreach (var entry in older.TopWeaknesses)
        {
            var newEntry = newer.TopWeaknesses
                .FirstOrDefault(w => w.Character == entry.Character);

            double improvement;
            double newErrorRate;

            if (newEntry == null)
            {
                improvement = 1.0; // Fully resolved
                newErrorRate = 0;
            }
            else
            {
                improvement = entry.ErrorRate - newEntry.ErrorRate;
                newErrorRate = newEntry.ErrorRate;
            }

            changes.Add(new WeaknessChange
            {
                Character = entry.Character,
                OldErrorRate = entry.ErrorRate,
                NewErrorRate = newErrorRate,
                Improvement = improvement
            });
        }

        return changes.OrderByDescending(c => Math.Abs(c.Improvement)).ToList();
    }

    private static WeaknessTrajectory ClassifyTrajectory(double improvement, double oldErrorRate)
    {
        // Need at least some meaningful change relative to the old rate
        double threshold = Math.Max(0.03, oldErrorRate * 0.1);

        if (improvement > threshold) return WeaknessTrajectory.Improving;
        if (improvement < -threshold) return WeaknessTrajectory.Worsening;
        return WeaknessTrajectory.Steady;
    }

    private static string ComputeSummary(int improving, int worsening, int steady, int resolved)
    {
        var parts = new List<string>();

        if (resolved > 0)
            parts.Add($"{resolved} resolved");
        if (improving > 0)
            parts.Add($"{improving} improving");
        if (steady > 0)
            parts.Add($"{steady} steady");
        if (worsening > 0)
            parts.Add($"{worsening} need attention");

        return parts.Count > 0 ? string.Join(", ", parts) : "No weakness data yet";
    }
}

/// <summary>
/// A complete weakness report with improvement context.
/// </summary>
public sealed class WeaknessReport
{
    public string Language { get; init; } = "";
    public bool HasData { get; init; }
    public List<WeaknessItem> Items { get; init; } = new();
    public List<ResolvedWeakness> ResolvedWeaknesses { get; init; } = new();
    public int ImprovingCount { get; init; }
    public int WorseningCount { get; init; }
    public int SteadyCount { get; init; }
    public string Summary { get; init; } = "";
}

/// <summary>
/// A single weakness with trajectory context.
/// </summary>
public sealed class WeaknessItem
{
    public char Character { get; init; }
    public double CurrentErrorRate { get; init; }
    public int TotalAttempts { get; init; }
    public int TotalMisses { get; init; }
    public SymbolCategoryKind Category { get; init; }
    public char TopConfusion { get; init; }

    /// <summary>Previous error rate from last snapshot. Null if no history.</summary>
    public double? PreviousErrorRate { get; set; }

    /// <summary>Improvement value (positive = better). Null if no history.</summary>
    public double? Improvement { get; set; }

    /// <summary>Whether this weakness is getting better, worse, or unchanged.</summary>
    public WeaknessTrajectory Trajectory { get; set; }
}

/// <summary>
/// A weakness that was resolved between snapshots.
/// </summary>
public sealed class ResolvedWeakness
{
    public char Character { get; init; }
    public double OldErrorRate { get; init; }
    public double CurrentErrorRate { get; init; }
}

/// <summary>
/// Direction a weakness is moving.
/// </summary>
public enum WeaknessTrajectory
{
    /// <summary>Error rate is decreasing — getting better.</summary>
    Improving,

    /// <summary>Error rate is stable — neither better nor worse.</summary>
    Steady,

    /// <summary>Error rate is increasing — getting worse.</summary>
    Worsening,

    /// <summary>Newly detected — no historical comparison available.</summary>
    New
}

/// <summary>
/// A point-in-time snapshot of the user's weakest characters for a language.
/// Captured at most once per day per language by WeaknessTracker.MaybeSnapshot().
/// </summary>
public sealed class WeaknessSnapshot
{
    [JsonInclude]
    public string Language { get; set; } = "";

    [JsonInclude]
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;

    [JsonInclude]
    public List<WeaknessEntry> TopWeaknesses { get; set; } = new();
}

/// <summary>
/// A single character weakness at a point in time.
/// </summary>
public sealed class WeaknessEntry
{
    [JsonInclude]
    public char Character { get; set; }

    [JsonInclude]
    public double ErrorRate { get; set; }

    [JsonInclude]
    public int TotalAttempts { get; set; }
}

/// <summary>
/// Change in weakness for a single character between two snapshots.
/// </summary>
public sealed class WeaknessChange
{
    public char Character { get; init; }
    public double OldErrorRate { get; init; }
    public double NewErrorRate { get; init; }

    /// <summary>
    /// Positive = improved (lower error rate), negative = got worse.
    /// 1.0 = fully resolved (no longer in top weaknesses).
    /// </summary>
    public double Improvement { get; init; }
}
