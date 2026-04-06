using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;

namespace LinuxDevTyper.Core.Tests;

public class PackValidatorTests
{
    private static Snippet MakeValid(string id = "s1", string lang = "python", int diff = 3) => new()
    {
        Id = id,
        Language = lang,
        Difficulty = diff,
        Title = "Test",
        Code = "print('hello')",
    };

    [Fact]
    public void ValidPack_ReturnsTrue()
    {
        var snippets = new List<Snippet>
        {
            MakeValid("s1"),
            MakeValid("s2"),
            MakeValid("s3"),
        };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void NullPack_ReturnsFalse()
    {
        var (valid, errors) = PackValidator.Validate(null!);
        Assert.False(valid);
        Assert.Single(errors);
    }

    [Fact]
    public void EmptyPack_ReturnsFalse()
    {
        var (valid, errors) = PackValidator.Validate(new List<Snippet>());
        Assert.False(valid);
        Assert.Single(errors);
        Assert.Contains("empty", errors[0].ToLower());
    }

    [Fact]
    public void MissingId_ReturnsError()
    {
        var snippets = new List<Snippet> { MakeValid() };
        snippets[0].Id = "";

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("Id"));
    }

    [Fact]
    public void MissingCode_ReturnsError()
    {
        var snippets = new List<Snippet> { MakeValid() };
        snippets[0].Code = "  ";

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("Code"));
    }

    [Fact]
    public void MissingLanguage_ReturnsError()
    {
        var snippets = new List<Snippet> { MakeValid() };
        snippets[0].Language = "";

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("Language"));
    }

    [Fact]
    public void DifficultyTooLow_ReturnsError()
    {
        var snippets = new List<Snippet> { MakeValid() };
        snippets[0].Difficulty = 0;

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("Difficulty"));
    }

    [Fact]
    public void DifficultyTooHigh_ReturnsError()
    {
        var snippets = new List<Snippet> { MakeValid() };
        snippets[0].Difficulty = 8;

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("Difficulty"));
    }

    [Fact]
    public void DuplicateIds_ReturnsError()
    {
        var snippets = new List<Snippet>
        {
            MakeValid("dupe"),
            MakeValid("dupe"),
        };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        Assert.Contains(errors, e => e.Contains("duplicate"));
    }

    [Fact]
    public void MultipleErrors_AllReported()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "", Language = "", Difficulty = 0, Code = "" },
            new() { Id = "ok", Language = "python", Difficulty = 3, Code = "x = 1" },
            new() { Id = "ok", Language = "python", Difficulty = 3, Code = "y = 2" }, // duplicate
        };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.False(valid);
        // Should have errors for: missing Id, missing Code, missing Language, bad difficulty, and duplicate
        Assert.True(errors.Count >= 4, $"Expected at least 4 errors, got {errors.Count}: {string.Join("; ", errors)}");
    }

    [Fact]
    public void ValidPack_WithNullNotes_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Notes = null;

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithNotes_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Notes = new[] { "Some prefer enumerate() here.", "An alternative approach." };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithEmptyNotesEntries_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Notes = new[] { "Good tip", "", "  ", "Another tip" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
        // Empty entries filtered out
        Assert.Equal(2, snippets[0].Notes!.Length);
        Assert.Equal("Good tip", snippets[0].Notes![0]);
        Assert.Equal("Another tip", snippets[0].Notes![1]);
    }

    [Fact]
    public void ValidPack_WithAllEmptyNotes_SetsNull()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Notes = new[] { "", "  ", "\t" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Null(snippets[0].Notes); // All empty → null
    }

    [Fact]
    public void BoundaryDifficulty_Valid()
    {
        var snippets = new List<Snippet>
        {
            MakeValid("low", diff: 1),
            MakeValid("high", diff: 7),
        };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithNullScaffold_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Scaffold = null;

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithScaffold_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Scaffold = new[] { "This uses a list comprehension.", "Deeper context here." };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithEmptyScaffoldEntries_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Scaffold = new[] { "Shallow hint", "", "  ", "Deeper context" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
        // Empty entries filtered out
        Assert.Equal(2, snippets[0].Scaffold!.Length);
        Assert.Equal("Shallow hint", snippets[0].Scaffold![0]);
        Assert.Equal("Deeper context", snippets[0].Scaffold![1]);
    }

    [Fact]
    public void ValidPack_WithAllEmptyScaffold_SetsNull()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Scaffold = new[] { "", "  ", "\t" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Null(snippets[0].Scaffold); // All empty → null
    }

    [Fact]
    public void ValidPack_WithNullVariants_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Variants = null;

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithVariants_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Variants = new[] { "x = list(filter(...))", "for loop approach" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidPack_WithEmptyVariantEntries_StillValid()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Variants = new[] { "filter approach", "", "  ", "for loop" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Empty(errors);
        // Empty entries filtered out
        Assert.Equal(2, snippets[0].Variants!.Length);
        Assert.Equal("filter approach", snippets[0].Variants![0]);
        Assert.Equal("for loop", snippets[0].Variants![1]);
    }

    [Fact]
    public void ValidPack_WithAllEmptyVariants_SetsNull()
    {
        var snippets = new List<Snippet> { MakeValid("s1") };
        snippets[0].Variants = new[] { "", "  ", "\t" };

        var (valid, errors) = PackValidator.Validate(snippets);
        Assert.True(valid);
        Assert.Null(snippets[0].Variants); // All empty → null
    }
}
