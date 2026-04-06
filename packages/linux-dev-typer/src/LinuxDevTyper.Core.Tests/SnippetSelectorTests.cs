using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;

namespace LinuxDevTyper.Core.Tests;

public class SnippetSelectorTests
{
    private static List<Snippet> MakeSnippets()
    {
        return new List<Snippet>
        {
            new() { Id = "easy", Difficulty = 1, Title = "Easy", Code = "a" },
            new() { Id = "med",  Difficulty = 3, Title = "Medium", Code = "b" },
            new() { Id = "hard", Difficulty = 5, Title = "Hard", Code = "c" },
            new() { Id = "boss", Difficulty = 7, Title = "Boss", Code = "d" },
        };
    }

    [Fact]
    public void EmptyList_ReturnsFallback()
    {
        var result = SnippetSelector.Pick(new List<Snippet>(), 1200);
        Assert.Equal("No snippets found", result.Title);
    }

    [Fact]
    public void DeterministicSeed_ProducesSameResult()
    {
        var snippets = MakeSnippets();

        var pick1 = SnippetSelector.Pick(snippets, 1200, rng: new Random(42));
        var pick2 = SnippetSelector.Pick(snippets, 1200, rng: new Random(42));

        Assert.Equal(pick1.Id, pick2.Id);
    }

    [Fact]
    public void HighRating_PrefersDifficult()
    {
        var snippets = MakeSnippets();
        var rng = new Random(100);
        int hardCount = 0;
        for (int i = 0; i < 50; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1600, rng: new Random(rng.Next()));
            if (pick.Id == "hard") hardCount++;
        }

        Assert.True(hardCount > 20, $"Expected mostly 'hard' picks, got {hardCount}/50");
    }

    [Fact]
    public void LowRating_PrefersEasy()
    {
        var snippets = MakeSnippets();
        var rng = new Random(200);
        int easyCount = 0;
        for (int i = 0; i < 50; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1000, rng: new Random(rng.Next()));
            if (pick.Id == "easy" || pick.Id == "med") easyCount++;
        }

        Assert.True(easyCount > 30, $"Expected mostly easy/med picks, got {easyCount}/50");
    }

    [Fact]
    public void HighLevel_WidensDifficultyWindow()
    {
        var snippets = MakeSnippets();
        // At level 15, window extends +3 upward from target
        // With rating 1200 (target diff = 3), window is 2-6
        // So "hard" (diff=5) should appear more often than at level 1
        var rng = new Random(300);
        int hardAtLow = 0;
        int hardAtHigh = 0;

        for (int i = 0; i < 100; i++)
        {
            var pickLow = SnippetSelector.Pick(snippets, 1200, level: 1, rng: new Random(rng.Next()));
            if (pickLow.Id == "hard") hardAtLow++;
        }

        rng = new Random(300); // same seed
        for (int i = 0; i < 100; i++)
        {
            var pickHigh = SnippetSelector.Pick(snippets, 1200, level: 15, rng: new Random(rng.Next()));
            if (pickHigh.Id == "hard") hardAtHigh++;
        }

        Assert.True(hardAtHigh >= hardAtLow,
            $"High level should see >= hard picks: low={hardAtLow}, high={hardAtHigh}");
    }

    // --- Adaptive snippet selection tests ---

    [Fact]
    public void WeaknessBoost_EmptySet_ReturnsZero()
    {
        int boost = SnippetSelector.WeaknessBoost("if (x) { return; }", new HashSet<SymbolCategoryKind>());
        Assert.Equal(0, boost);
    }

    [Fact]
    public void WeaknessBoost_MatchingCategories_ReturnsCount()
    {
        var weak = new HashSet<SymbolCategoryKind> { SymbolCategoryKind.CurlyBraces, SymbolCategoryKind.Parentheses };
        // Code contains both { } and ( )
        int boost = SnippetSelector.WeaknessBoost("if (x) { return; }", weak);
        Assert.Equal(2, boost); // found both weak categories
    }

    [Fact]
    public void WeaknessBoost_CappedAt3()
    {
        var weak = new HashSet<SymbolCategoryKind>
        {
            SymbolCategoryKind.CurlyBraces,
            SymbolCategoryKind.Parentheses,
            SymbolCategoryKind.Operators,
            SymbolCategoryKind.SquareBrackets
        };
        // Code has all 4 categories: { } ( ) = [ ]
        int boost = SnippetSelector.WeaknessBoost("a[0] = (x) { y }", weak);
        Assert.Equal(3, boost); // capped at 3
    }

    [Fact]
    public void WeaknessBoost_NoMatch_ReturnsZero()
    {
        var weak = new HashSet<SymbolCategoryKind> { SymbolCategoryKind.AngleBrackets };
        int boost = SnippetSelector.WeaknessBoost("hello world", weak);
        Assert.Equal(0, boost); // no < > in the code
    }

    [Fact]
    public void Adaptive_BoostsSnippetsWithWeakChars()
    {
        // Two snippets at same difficulty — one has curly braces, one doesn't
        var snippets = new List<Snippet>
        {
            new() { Id = "plain",  Difficulty = 3, Title = "Plain",  Code = "x = 1 + 2" },
            new() { Id = "braces", Difficulty = 3, Title = "Braces", Code = "if (x) { y }" },
        };

        // Profile weak on CurlyBraces
        var profile = new MistakeProfile();
        profile.CategoryErrors["CurlyBraces"] = 10;
        profile.CategoryErrors["Parentheses"] = 5;

        int bracesCount = 0;
        for (int i = 0; i < 200; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1200, weaknessProfile: profile, rng: new Random(i));
            if (pick.Id == "braces") bracesCount++;
        }

        // With adaptive boost, "braces" snippet should be picked significantly more
        // Without boost: 50/50 → ~100. With boost of +2: weight 5 vs 3 → ~62.5%
        Assert.True(bracesCount > 110, $"Expected adaptive boost toward braces snippets: {bracesCount}/200");
    }

    [Fact]
    public void NullProfile_NoBoost()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 3, Title = "A", Code = "if (x) { y }" },
            new() { Id = "b", Difficulty = 3, Title = "B", Code = "a = b" },
        };

        // No crash, no boost
        var pick = SnippetSelector.Pick(snippets, 1200, weaknessProfile: null, rng: new Random(42));
        Assert.NotNull(pick);
    }

    // --- Focus boost tests ---

    [Fact]
    public void FocusBoost_ReturnsZero_WhenCategoryAbsent()
    {
        int boost = SnippetSelector.FocusBoost("hello world", SymbolCategoryKind.CurlyBraces);
        Assert.Equal(0, boost);
    }

    [Fact]
    public void FocusBoost_ReturnsFive_WhenCategoryPresent()
    {
        int boost = SnippetSelector.FocusBoost("if (x) { return; }", SymbolCategoryKind.CurlyBraces);
        Assert.Equal(5, boost);
    }

    [Fact]
    public void FocusBoost_EmptyCode_ReturnsZero()
    {
        int boost = SnippetSelector.FocusBoost("", SymbolCategoryKind.Parentheses);
        Assert.Equal(0, boost);
    }

    [Fact]
    public void FocusCategory_HeavilyBoostsMatchingSnippets()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "nobraces", Difficulty = 3, Title = "No Braces", Code = "x = 1 + 2" },
            new() { Id = "braces",   Difficulty = 3, Title = "Braces",    Code = "if (x) { y }" },
        };

        int bracesCount = 0;
        for (int i = 0; i < 200; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1200,
                focusCategory: SymbolCategoryKind.CurlyBraces, rng: new Random(i));
            if (pick.Id == "braces") bracesCount++;
        }

        // With +5 focus boost: weight 8 vs 3 → ~72.7%
        Assert.True(bracesCount > 120, $"Expected focus boost toward braces: {bracesCount}/200");
    }

    // --- Suggested difficulty tests ---

    [Fact]
    public void SuggestedDifficulty_OverridesRatingBased()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "d2", Difficulty = 2, Title = "D2", Code = "a" },
            new() { Id = "d3", Difficulty = 3, Title = "D3", Code = "b" },
            new() { Id = "d5", Difficulty = 5, Title = "D5", Code = "c" },
        };

        // Rating 1000 normally targets diff=2, but suggestedDifficulty=5
        int d5Count = 0;
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1000, suggestedDifficulty: 5, rng: new Random(i));
            if (pick.Id == "d5") d5Count++;
        }

        Assert.True(d5Count > 50, $"Expected suggested difficulty=5 to dominate: {d5Count}/100");
    }

    // --- ±1 clamp tests ---

    [Fact]
    public void LastDifficulty_ClampsTargetWithinOne()
    {
        // All difficulties available
        var snippets = new List<Snippet>
        {
            new() { Id = "d1", Difficulty = 1, Title = "D1", Code = "a" },
            new() { Id = "d2", Difficulty = 2, Title = "D2", Code = "b" },
            new() { Id = "d3", Difficulty = 3, Title = "D3", Code = "c" },
            new() { Id = "d4", Difficulty = 4, Title = "D4", Code = "d" },
            new() { Id = "d5", Difficulty = 5, Title = "D5", Code = "e" },
            new() { Id = "d6", Difficulty = 6, Title = "D6", Code = "f" },
            new() { Id = "d7", Difficulty = 7, Title = "D7", Code = "g" },
        };

        // suggestedDifficulty=7 but lastDifficulty=3 → clamped to 4
        int nearTarget = 0;
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1000,
                suggestedDifficulty: 7, lastDifficulty: 3, rng: new Random(i));
            // Clamped target = 4, window includes 3-5 (level 1 → ±1)
            if (pick.Difficulty >= 3 && pick.Difficulty <= 5) nearTarget++;
        }

        Assert.True(nearTarget > 80, $"Expected ±1 clamp to keep difficulty near 4: {nearTarget}/100 in range 3-5");
    }

    [Fact]
    public void LastDifficulty_ClampsDownward()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "d1", Difficulty = 1, Title = "D1", Code = "a" },
            new() { Id = "d2", Difficulty = 2, Title = "D2", Code = "b" },
            new() { Id = "d3", Difficulty = 3, Title = "D3", Code = "c" },
            new() { Id = "d5", Difficulty = 5, Title = "D5", Code = "e" },
        };

        // suggestedDifficulty=1 but lastDifficulty=5 → clamped to 4
        // Nearest available is d3 or d5
        int inRange = 0;
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1600,
                suggestedDifficulty: 1, lastDifficulty: 5, rng: new Random(i));
            // Clamped target = 4, window 3-5
            if (pick.Difficulty >= 3 && pick.Difficulty <= 5) inRange++;
        }

        Assert.True(inRange > 80, $"Expected ±1 clamp downward: {inRange}/100 in range 3-5");
    }

    [Fact]
    public void LastDifficulty_NoClampWhenNull()
    {
        var snippets = new List<Snippet>
        {
            new() { Id = "d2", Difficulty = 2, Title = "D2", Code = "a" },
            new() { Id = "d5", Difficulty = 5, Title = "D5", Code = "c" },
        };

        // suggestedDifficulty=5, no lastDifficulty → no clamp, targets 5
        int d5Count = 0;
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1000,
                suggestedDifficulty: 5, lastDifficulty: null, rng: new Random(i));
            if (pick.Id == "d5") d5Count++;
        }

        Assert.True(d5Count > 50, $"Expected no clamp, d5 picks: {d5Count}/100");
    }

    [Fact]
    public void Pick_SnippetWithNullNotes_BehavesIdentically()
    {
        // Notes=null must not affect selection behavior
        var withNotes = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 3, Title = "A", Code = "x = 1\n", Notes = new[] { "tip" } },
            new() { Id = "b", Difficulty = 3, Title = "B", Code = "y = 2\n", Notes = null },
        };
        var withoutNotes = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 3, Title = "A", Code = "x = 1\n" },
            new() { Id = "b", Difficulty = 3, Title = "B", Code = "y = 2\n" },
        };

        // Same seed, same results — Notes have zero impact on selection
        for (int i = 0; i < 50; i++)
        {
            var pick1 = SnippetSelector.Pick(withNotes, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(withoutNotes, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void NoBossPick_DifficultyAlwaysFollowsWeighting()
    {
        // With target difficulty 3, no snippet at difficulty 5+ should appear
        // because the window is target ±1 (level 1), so only d2-d4 are candidates
        var snippets = new List<Snippet>
        {
            new() { Id = "d2", Difficulty = 2, Title = "D2", Code = "a" },
            new() { Id = "d3", Difficulty = 3, Title = "D3", Code = "b" },
            new() { Id = "d4", Difficulty = 4, Title = "D4", Code = "c" },
            new() { Id = "d6", Difficulty = 6, Title = "D6", Code = "d" },
            new() { Id = "d7", Difficulty = 7, Title = "D7", Code = "e" },
        };

        for (int i = 0; i < 200; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1200, level: 1,
                suggestedDifficulty: 3, rng: new Random(i));
            // d6 and d7 should never appear — no boss pick override
            Assert.True(pick.Difficulty <= 4,
                $"Unexpected high difficulty {pick.Difficulty} at seed {i}");
        }
    }

    [Fact]
    public void Notes_NeverAffectSnippetSelection()
    {
        // Even when Notes contain rich content, selection uses only Difficulty/Code/etc.
        var snippets = new List<Snippet>
        {
            new()
            {
                Id = "heavy", Difficulty = 3, Title = "Heavy Notes", Code = "a = 1\n",
                Notes = new[] { "Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5" }
            },
            new()
            {
                Id = "light", Difficulty = 3, Title = "No Notes", Code = "b = 2\n",
                Notes = null
            },
        };

        var baseSnippets = new List<Snippet>
        {
            new() { Id = "heavy", Difficulty = 3, Title = "Heavy Notes", Code = "a = 1\n" },
            new() { Id = "light", Difficulty = 3, Title = "No Notes", Code = "b = 2\n" },
        };

        // Identical selection regardless of Notes content
        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(snippets, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(baseSnippets, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void CommunityDifficulty_NeverAffectsSelection()
    {
        // CommunityDifficulty is display-only. SnippetSelector uses authored Difficulty only.
        var withCommunity = new List<Snippet>
        {
            new() { Id = "easy", Difficulty = 2, Code = "a\n", CommunityDifficulty = 6.0 },
            new() { Id = "hard", Difficulty = 5, Code = "b\n", CommunityDifficulty = 1.0 },
        };
        var withoutCommunity = new List<Snippet>
        {
            new() { Id = "easy", Difficulty = 2, Code = "a\n" },
            new() { Id = "hard", Difficulty = 5, Code = "b\n" },
        };

        // Same seed, same results — CommunityDifficulty never influences selection
        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(withCommunity, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(withoutCommunity, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void CommunityDifficulty_NeverAffectsWeighting()
    {
        // Even when CommunityDifficulty contradicts authored Difficulty,
        // selection uses authored Difficulty. With rating 1000 (target diff ~2),
        // "easy" (diff=2) should still dominate even though CommunityDifficulty=7.
        var snippets = new List<Snippet>
        {
            new() { Id = "easy", Difficulty = 2, Code = "a\n", CommunityDifficulty = 7.0 },
            new() { Id = "hard", Difficulty = 5, Code = "b\n", CommunityDifficulty = 1.0 },
        };

        int easyCount = 0;
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1000, rng: new Random(i));
            if (pick.Id == "easy") easyCount++;
        }

        // At rating 1000, authored Difficulty=2 should be favored heavily
        Assert.True(easyCount > 60, $"Expected authored Difficulty to dominate, got easy={easyCount}/100");
    }

    [Fact]
    public void Pick_LargePackWithNotes_PerformsWell()
    {
        // 1000 snippets, each with Notes — selection must complete quickly
        var snippets = new List<Snippet>();
        for (int i = 0; i < 1000; i++)
        {
            snippets.Add(new Snippet
            {
                Id = $"s{i:D4}",
                Language = "python",
                Difficulty = (i % 7) + 1,
                Title = $"Snippet {i}",
                Code = $"x = {i}\n",
                Notes = new[] { $"Tip for snippet {i}.", $"Alternative for {i}." },
                CommunityDifficulty = (i % 7) + 0.5,
            });
        }

        // 100 picks from a 1000-snippet pack — should complete in well under 1 second
        var sw = System.Diagnostics.Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
        {
            var pick = SnippetSelector.Pick(snippets, 1200, rng: new Random(i));
            Assert.NotNull(pick);
        }
        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000, $"100 picks from 1000 snippets took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void Pick_SnippetWithNullScaffold_BehavesIdentically()
    {
        var withScaffold = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 3, Title = "A", Code = "x = 1\n", Scaffold = new[] { "hint", "deeper" } },
            new() { Id = "b", Difficulty = 3, Title = "B", Code = "y = 2\n", Scaffold = null },
        };
        var withoutScaffold = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 3, Title = "A", Code = "x = 1\n" },
            new() { Id = "b", Difficulty = 3, Title = "B", Code = "y = 2\n" },
        };

        for (int i = 0; i < 50; i++)
        {
            var pick1 = SnippetSelector.Pick(withScaffold, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(withoutScaffold, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void Scaffold_NeverAffectsSnippetSelection()
    {
        // Same seed, same results with/without Scaffold — 100 picks
        var withScaffold = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 2, Title = "A", Code = "x = 1\n", Scaffold = new[] { "shallow", "deep", "deeper" } },
            new() { Id = "b", Difficulty = 4, Title = "B", Code = "y = 2\n", Scaffold = new[] { "hint" } },
            new() { Id = "c", Difficulty = 6, Title = "C", Code = "z = 3\n" },
        };
        var withoutScaffold = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 2, Title = "A", Code = "x = 1\n" },
            new() { Id = "b", Difficulty = 4, Title = "B", Code = "y = 2\n" },
            new() { Id = "c", Difficulty = 6, Title = "C", Code = "z = 3\n" },
        };

        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(withScaffold, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(withoutScaffold, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void Variants_NeverAffectsSnippetSelection()
    {
        // Same seed, same results with/without Variants — 100 picks
        var withVariants = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 2, Title = "A", Code = "x = 1\n", Variants = new[] { "alt1", "alt2" } },
            new() { Id = "b", Difficulty = 4, Title = "B", Code = "y = 2\n", Variants = new[] { "other" } },
            new() { Id = "c", Difficulty = 6, Title = "C", Code = "z = 3\n" },
        };
        var withoutVariants = new List<Snippet>
        {
            new() { Id = "a", Difficulty = 2, Title = "A", Code = "x = 1\n" },
            new() { Id = "b", Difficulty = 4, Title = "B", Code = "y = 2\n" },
            new() { Id = "c", Difficulty = 6, Title = "C", Code = "z = 3\n" },
        };

        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(withVariants, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(withoutVariants, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void Scaffold_NeverAffectsWeighting()
    {
        // Authored Difficulty is used for weighting, not Scaffold depth
        var snippets = new List<Snippet>
        {
            new() { Id = "shallow", Difficulty = 2, Title = "Shallow", Code = "a\n",
                     Scaffold = new[] { "hint" } },
            new() { Id = "deep", Difficulty = 2, Title = "Deep", Code = "b\n",
                     Scaffold = new[] { "hint", "deeper", "deepest", "bottomless" } },
        };

        // With same difficulty and same seed, both snippets should have equal weighting
        // regardless of scaffold depth. Verify 100 picks produce same results as
        // snippets without scaffold.
        var noScaffold = new List<Snippet>
        {
            new() { Id = "shallow", Difficulty = 2, Title = "Shallow", Code = "a\n" },
            new() { Id = "deep", Difficulty = 2, Title = "Deep", Code = "b\n" },
        };

        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(snippets, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(noScaffold, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void Variants_NeverAffectsWeighting()
    {
        // Authored Difficulty is used for weighting, not Variant count
        var snippets = new List<Snippet>
        {
            new() { Id = "few", Difficulty = 3, Title = "Few", Code = "a\n",
                     Variants = new[] { "one" } },
            new() { Id = "many", Difficulty = 3, Title = "Many", Code = "b\n",
                     Variants = new[] { "one", "two", "three", "four", "five" } },
        };

        var noVariants = new List<Snippet>
        {
            new() { Id = "few", Difficulty = 3, Title = "Few", Code = "a\n" },
            new() { Id = "many", Difficulty = 3, Title = "Many", Code = "b\n" },
        };

        for (int i = 0; i < 100; i++)
        {
            var pick1 = SnippetSelector.Pick(snippets, 1200, rng: new Random(i));
            var pick2 = SnippetSelector.Pick(noVariants, 1200, rng: new Random(i));
            Assert.Equal(pick1.Id, pick2.Id);
        }
    }

    [Fact]
    public void Pick_LargePackWithScaffoldAndVariants_PerformsWell()
    {
        // 1000 snippets with Scaffold and Variants — 100 picks must complete quickly
        var snippets = new List<Snippet>();
        for (int i = 0; i < 1000; i++)
        {
            snippets.Add(new Snippet
            {
                Id = $"s-{i:D4}",
                Difficulty = (i % 7) + 1,
                Title = $"Snippet {i}",
                Code = $"x = {i}\nprint(x)\n",
                Scaffold = new[] { $"Hint for {i}", $"Deeper context for {i}" },
                Variants = new[] { $"alt1_{i}", $"alt2_{i}" },
            });
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        for (int i = 0; i < 100; i++)
        {
            SnippetSelector.Pick(snippets, 1200, rng: new Random(i));
        }
        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"100 picks from 1000 scaffolded+varianted snippets took {sw.ElapsedMilliseconds}ms");
    }
}
