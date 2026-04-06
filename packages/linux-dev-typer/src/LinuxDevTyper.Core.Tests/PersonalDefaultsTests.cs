using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class PersonalDefaultsTests
{
    private static Result MakeResult(string language = "python")
    {
        return new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: language,
            SnippetId: "s1",
            Wpm: 40,
            Accuracy: 90,
            Errors: 1,
            CharactersTyped: 100,
            XpEarned: 10
        );
    }

    [Fact]
    public void NotEnoughSessions_NoSuggestions()
    {
        var defaults = new PersonalDefaults();
        var results = Enumerable.Range(0, 5).Select(_ => MakeResult()).ToList();
        var settings = new AppSettings();

        defaults.LearnFromHistory(results, settings);

        Assert.False(defaults.HasSuggestions);
        Assert.Empty(defaults.GetPendingSuggestions(settings));
    }

    [Fact]
    public void DifferentLanguage_ReturnsSuggestion()
    {
        var defaults = new PersonalDefaults();
        var settings = new AppSettings { SelectedLanguage = "python" };

        // Build confidence over multiple calls with consistent "rust" results
        for (int i = 1; i <= 20; i++)
        {
            var results = Enumerable.Range(0, i).Select(_ => MakeResult("rust")).ToList();
            defaults.LearnFromHistory(results, settings);
        }

        Assert.True(defaults.HasSuggestions);
        var suggestions = defaults.GetPendingSuggestions(settings);
        Assert.Single(suggestions);
        Assert.Contains("rust", suggestions[0]);
    }

    [Fact]
    public void DismissSuggestions_SetsCooldown()
    {
        var defaults = new PersonalDefaults();
        var settings = new AppSettings { SelectedLanguage = "python" };

        // Build confidence
        for (int i = 1; i <= 20; i++)
        {
            var results = Enumerable.Range(0, i).Select(_ => MakeResult("rust")).ToList();
            defaults.LearnFromHistory(results, settings);
        }

        Assert.True(defaults.HasSuggestions);

        defaults.DismissSuggestions(20);
        Assert.False(defaults.HasSuggestions);
        Assert.Empty(defaults.GetPendingSuggestions(settings));
    }

    [Fact]
    public void Confidence_IncreasesWithConsistency()
    {
        var defaults = new PersonalDefaults();
        var settings = new AppSettings();

        // First call establishes preference
        var results = Enumerable.Range(0, 15).Select(_ => MakeResult("python")).ToList();
        defaults.LearnFromHistory(results, settings);
        double firstConfidence = defaults.LanguageConfidence;

        // Second call with same language increases confidence
        defaults.LearnFromHistory(results, settings);
        Assert.True(defaults.LanguageConfidence > firstConfidence);
    }

    [Fact]
    public void Confidence_DecreasesWithChange()
    {
        var defaults = new PersonalDefaults();
        var settings = new AppSettings();

        // Build up confidence with python
        var pythonResults = Enumerable.Range(0, 15).Select(_ => MakeResult("python")).ToList();
        for (int i = 0; i < 10; i++)
            defaults.LearnFromHistory(pythonResults, settings);
        double highConfidence = defaults.LanguageConfidence;

        // Switch to rust — confidence drops
        var rustResults = Enumerable.Range(0, 15).Select(_ => MakeResult("rust")).ToList();
        defaults.LearnFromHistory(rustResults, settings);
        Assert.True(defaults.LanguageConfidence < highConfidence);
    }

    [Fact]
    public void Stabilization_PreventsRelearning()
    {
        var defaults = new PersonalDefaults();
        var settings = new AppSettings();

        // Build up confidence past stabilization threshold (0.9)
        var pythonResults = Enumerable.Range(0, 15).Select(_ => MakeResult("python")).ToList();
        for (int i = 0; i < 25; i++)
            defaults.LearnFromHistory(pythonResults, settings);

        Assert.NotNull(defaults.StabilizedAt);
        Assert.Equal("python", defaults.PreferredLanguage);

        // Switch to rust — preference should NOT change (stabilized)
        var rustResults = Enumerable.Range(0, 15).Select(_ => MakeResult("rust")).ToList();
        defaults.LearnFromHistory(rustResults, settings);
        Assert.Equal("python", defaults.PreferredLanguage);

        // After 5+ different-language sessions, stabilization breaks
        for (int i = 0; i < 5; i++)
            defaults.LearnFromHistory(rustResults, settings);

        Assert.Null(defaults.StabilizedAt);
    }
}
