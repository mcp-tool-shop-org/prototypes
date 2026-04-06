using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Typing;

namespace LinuxDevTyper.Core.Tests;

public class OrientationEngineTests
{
    private static Result MakeResult(string language = "python", string snippetId = "s1") =>
        new(DateTimeOffset.UtcNow, language, snippetId, 50, 90, 1, 100, 10);

    private static List<Snippet> MakeSnippets(string language, params string[] ids) =>
        ids.Select(id => new Snippet { Id = id, Language = language, Difficulty = 3, Code = "x" }).ToList();

    [Fact]
    public void TooFewSessions_ReturnsNull()
    {
        var results = Enumerable.Range(0, 9).Select(_ => MakeResult()).ToList();
        var snippets = MakeSnippets("python", "s1");

        var cue = OrientationEngine.GenerateCue(results, snippets, "python", null);

        Assert.Null(cue);
    }

    [Fact]
    public void StaleLanguage_Detected()
    {
        // 10 old rust sessions, then 20 recent python sessions
        var results = new List<Result>();
        for (int i = 0; i < 10; i++)
            results.Add(MakeResult("rust", $"rs{i}"));
        for (int i = 0; i < 20; i++)
            results.Add(MakeResult("python", $"py{i}"));

        var cue = OrientationEngine.GenerateCue(results, new List<Snippet>(), "python", null);

        Assert.NotNull(cue);
        Assert.Contains("rust", cue);
        Assert.Contains("still available", cue);
    }

    [Fact]
    public void NoStale_WhenAllRecent()
    {
        // All 15 sessions are mixed python and rust within the window
        var results = new List<Result>();
        for (int i = 0; i < 15; i++)
            results.Add(MakeResult(i % 2 == 0 ? "python" : "rust"));

        var snippets = MakeSnippets("python", "s1");
        // All snippets seen, no stale language (both are recent), no improving trend
        var cue = OrientationEngine.GenerateCue(results, snippets, "python", null);

        // Should be null — no stale language, snippet already seen, no trend
        Assert.Null(cue);
    }

    [Fact]
    public void AccuracyImproving_ShowsCue()
    {
        var results = Enumerable.Range(0, 10).Select(_ => MakeResult()).ToList();
        var trend = new TrendSnapshot(50, 92, 2.0, 1.5, MetricTrend.Stable, MetricTrend.Improving, 10);
        var snippets = MakeSnippets("python", "s1"); // all seen

        var cue = OrientationEngine.GenerateCue(results, snippets, "python", trend);

        Assert.NotNull(cue);
        Assert.Contains("accuracy", cue, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("climbing", cue);
    }

    [Fact]
    public void UnseenSnippets_Counted()
    {
        var results = Enumerable.Range(0, 10).Select(_ => MakeResult("python", "s1")).ToList();
        var snippets = MakeSnippets("python", "s1", "s2", "s3");

        var cue = OrientationEngine.GenerateCue(results, snippets, "python", null);

        Assert.NotNull(cue);
        Assert.Contains("2", cue);
        Assert.Contains("snippet", cue);
    }

    [Fact]
    public void AllSeen_NoCue()
    {
        var results = new List<Result>();
        for (int i = 0; i < 10; i++)
            results.Add(MakeResult("python", $"s{i % 3 + 1}"));

        // All 3 snippets have been seen
        var snippets = MakeSnippets("python", "s1", "s2", "s3");

        var cue = OrientationEngine.GenerateCue(results, snippets, "python", null);

        Assert.Null(cue);
    }

    [Fact]
    public void StaleLanguage_TakesPriority_OverUnseenSnippets()
    {
        // Stale rust AND unseen python snippets — stale takes priority
        var results = new List<Result>();
        for (int i = 0; i < 10; i++) results.Add(MakeResult("rust", $"rs{i}"));
        for (int i = 0; i < 20; i++) results.Add(MakeResult("python", "py1"));
        var snippets = MakeSnippets("python", "py1", "py2", "py3"); // 2 unseen

        var cue = OrientationEngine.GenerateCue(results, snippets, "python", null);

        Assert.NotNull(cue);
        Assert.Contains("rust", cue); // stale language, not unseen snippets
    }

    [Fact]
    public void NoCue_ContainsTimeReferences()
    {
        // Generate every possible cue type and verify none mention time-of-day
        var forbiddenTerms = new[] { "morning", "afternoon", "evening", "usually practice" };

        // Stale language cue
        var results1 = new List<Result>();
        for (int i = 0; i < 10; i++) results1.Add(MakeResult("rust", $"rs{i}"));
        for (int i = 0; i < 20; i++) results1.Add(MakeResult("python", $"py{i}"));
        var cue1 = OrientationEngine.GenerateCue(results1, new List<Snippet>(), "python", null);

        // Improving accuracy cue
        var results2 = Enumerable.Range(0, 10).Select(_ => MakeResult()).ToList();
        var trend = new TrendSnapshot(50, 92, 2.0, 1.5, MetricTrend.Stable, MetricTrend.Improving, 10);
        var cue2 = OrientationEngine.GenerateCue(results2, MakeSnippets("python", "s1"), "python", trend);

        // Unseen snippets cue
        var results3 = Enumerable.Range(0, 10).Select(_ => MakeResult("python", "s1")).ToList();
        var cue3 = OrientationEngine.GenerateCue(results3, MakeSnippets("python", "s1", "s2", "s3"), "python", null);

        foreach (var cue in new[] { cue1, cue2, cue3 })
        {
            if (cue == null) continue;
            foreach (var term in forbiddenTerms)
                Assert.DoesNotContain(term, cue, StringComparison.OrdinalIgnoreCase);
        }
    }
}
