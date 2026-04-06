using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class WeaknessWindowTests
{
    private static DateTimeOffset Now => DateTimeOffset.UtcNow;

    // --- Basic recording and scoring ---

    [Fact]
    public void RecordMistakes_AccumulatesEvents()
    {
        var window = new WeaknessWindow();
        var events = new[]
        {
            new MistakeEvent("CurlyBraces", Now),
            new MistakeEvent("CurlyBraces", Now),
            new MistakeEvent("Parentheses", Now)
        };

        window.RecordMistakes(events);

        Assert.Equal(3, window.Events.Count);
    }

    [Fact]
    public void GetWeaknessScores_RankedByScore()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now), new("CurlyBraces", now), new("CurlyBraces", now),
            new("Parentheses", now), new("Parentheses", now),
            new("Operators", now)
        };
        window.RecordMistakes(events);

        var scores = window.GetWeaknessScores(now: now);

        Assert.True(scores.Count >= 2);
        Assert.Equal("CurlyBraces", scores[0].Category);
    }

    [Fact]
    public void GetWeaknessScores_ExcludesAlphanumericAndWhitespace()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var events = new List<MistakeEvent>
        {
            new("Alphanumeric", now),
            new("Alphanumeric", now),
            new("Whitespace", now),
            new("CurlyBraces", now)
        };
        window.RecordMistakes(events);

        var scores = window.GetWeaknessScores(now: now);
        var categories = scores.Select(s => s.Category).ToList();

        Assert.DoesNotContain("Alphanumeric", categories);
        Assert.DoesNotContain("Whitespace", categories);
        Assert.Contains("CurlyBraces", categories);
    }

    // --- Recency weighting ---

    [Fact]
    public void RecencyDecay_RecentEventsWeightedMore()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var twoWeeksAgo = now.AddDays(-14);
        var yesterday = now.AddDays(-1);

        // 5 old CurlyBraces errors, 3 recent Parentheses errors
        var events = new List<MistakeEvent>();
        for (int i = 0; i < 5; i++) events.Add(new("CurlyBraces", twoWeeksAgo));
        for (int i = 0; i < 3; i++) events.Add(new("Parentheses", yesterday));

        window.RecordMistakes(events);
        var scores = window.GetWeaknessScores(now: now);

        // Parentheses (recent, 3 × 1.0 = 3.0) should score close to or above
        // CurlyBraces (old, 5 × 0.5 = 2.5)
        var parens = scores.First(s => s.Category == "Parentheses");
        var curlies = scores.First(s => s.Category == "CurlyBraces");

        Assert.True(parens.Score >= curlies.Score,
            $"Recent Parentheses ({parens.Score:F1}) should score >= old CurlyBraces ({curlies.Score:F1})");
    }

    [Fact]
    public void RecencyDecay_AllRecentEvents_HighWeight()
    {
        var now = Now;
        var window = new WeaknessWindow();
        // All events at the same timestamp → all in the recent half → full weight
        var events = new List<MistakeEvent>
        {
            new("Operators", now),
            new("Operators", now),
            new("Operators", now)
        };
        window.RecordMistakes(events);

        var scores = window.GetWeaknessScores(now: now);
        var ops = scores.First(s => s.Category == "Operators");

        // All events at same timestamp → all in recent half → 3.0
        Assert.Equal(3.0, ops.Score, 0.1);
    }

    // --- Pruning ---

    [Fact]
    public void Prune_RemovesOldEvents()
    {
        var now = Now;
        var window = new WeaknessWindow { MaxAgeDays = 7 };
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now.AddDays(-10)),  // Should be pruned
            new("CurlyBraces", now.AddDays(-5)),    // Should remain
            new("Parentheses", now)                  // Should remain
        };
        window.RecordMistakes(events);
        window.Prune(now);

        Assert.Equal(2, window.Events.Count);
    }

    [Fact]
    public void Prune_CapsAtMaxEvents()
    {
        var now = Now;
        var window = new WeaknessWindow { MaxEvents = 5 };
        var events = Enumerable.Range(0, 10)
            .Select(i => new MistakeEvent("CurlyBraces", now.AddMinutes(-i)))
            .ToList();

        window.RecordMistakes(events);

        Assert.True(window.Events.Count <= 5);
    }

    [Fact]
    public void Prune_KeepsMostRecent()
    {
        var now = Now;
        var window = new WeaknessWindow { MaxEvents = 3 };
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now.AddHours(-5)),
            new("Parentheses", now.AddHours(-4)),
            new("Operators", now.AddHours(-3)),
            new("Quotes", now.AddHours(-2)),
            new("Punctuation", now.AddHours(-1))
        };
        window.RecordMistakes(events);

        Assert.Equal(3, window.Events.Count);
        var categories = window.Events.Select(e => e.Category).ToHashSet();
        Assert.Contains("Punctuation", categories);
        Assert.Contains("Quotes", categories);
    }

    // --- GetTopWeakCategories ---

    [Fact]
    public void GetTopWeakCategories_ReturnsTopN()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now), new("CurlyBraces", now), new("CurlyBraces", now),
            new("Parentheses", now), new("Parentheses", now),
            new("Operators", now),
            new("Quotes", now)
        };
        window.RecordMistakes(events);

        var top2 = window.GetTopWeakCategories(2, now);
        Assert.Equal(2, top2.Count);
        Assert.Equal("CurlyBraces", top2[0]);
        Assert.Equal("Parentheses", top2[1]);
    }

    // --- IsWeak ---

    [Fact]
    public void IsWeak_ReturnsTrueForTopCategories()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now), new("CurlyBraces", now), new("CurlyBraces", now),
            new("Parentheses", now)
        };
        window.RecordMistakes(events);

        Assert.True(window.IsWeak("CurlyBraces", now: now));
        Assert.True(window.IsWeak("Parentheses", now: now));
    }

    [Fact]
    public void IsWeak_ReturnsFalseForNonWeakCategories()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", now)
        };
        window.RecordMistakes(events);

        Assert.False(window.IsWeak("SquareBrackets", now: now));
    }

    // --- Empty state ---

    [Fact]
    public void EmptyWindow_NoWeaknesses()
    {
        var now = Now;
        var window = new WeaknessWindow();
        var scores = window.GetWeaknessScores(now: now);
        Assert.Empty(scores);
        Assert.False(window.IsWeak("CurlyBraces", now: now));
    }

    // --- Natural recovery ---

    [Fact]
    public void NaturalRecovery_OldWeaknessesDecayAway()
    {
        var now = Now;
        var window = new WeaknessWindow { MaxAgeDays = 14 };
        var thirteenDaysAgo = now.AddDays(-13);

        var events = new List<MistakeEvent>
        {
            new("CurlyBraces", thirteenDaysAgo),
            new("CurlyBraces", thirteenDaysAgo),
            new("CurlyBraces", thirteenDaysAgo)
        };
        window.RecordMistakes(events);

        // Still present at 13 days
        Assert.True(window.Events.Count > 0);

        // Pruned at 15 days later
        window.Prune(now.AddDays(2));
        Assert.Empty(window.Events);
    }
}
