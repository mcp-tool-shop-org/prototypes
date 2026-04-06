using System.Text.Json;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests;

public class PortableBundleTests
{
    [Fact]
    public void Roundtrip_Serialization()
    {
        var bundle = new PortableBundle
        {
            ExportedAt = new DateTimeOffset(2026, 2, 1, 12, 0, 0, TimeSpan.Zero),
            Profiles =
            {
                ["Relaxed"] = new PracticeProfile { Name = "Relaxed", XpBaseMultiplier = 1.2 }
            },
            SnippetPacks =
            {
                ["go"] = new List<Snippet>
                {
                    new() { Id = "go-001", Language = "go", Difficulty = 2, Code = "fmt.Println(\"hi\")\n" }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        Assert.Equal("3", deserialized.FormatVersion);
        Assert.Single(deserialized.Profiles);
        Assert.True(deserialized.Profiles.ContainsKey("Relaxed"));
        Assert.Equal(1.2, deserialized.Profiles["Relaxed"].XpBaseMultiplier);
        Assert.Single(deserialized.SnippetPacks);
        Assert.True(deserialized.SnippetPacks.ContainsKey("go"));
        Assert.Single(deserialized.SnippetPacks["go"]);
    }

    [Fact]
    public void MergeInto_AddsNewItems()
    {
        var bundle = new PortableBundle
        {
            Profiles =
            {
                ["Challenge"] = new PracticeProfile { Name = "Challenge", XpBaseMultiplier = 0.5 }
            },
            SnippetPacks =
            {
                ["typescript"] = new List<Snippet>
                {
                    new() { Id = "ts-001", Language = "typescript", Difficulty = 3, Code = "const x = 1;\n" }
                }
            }
        };

        var existingProfiles = new Dictionary<string, PracticeProfile>();
        var existingPacks = new Dictionary<string, List<Snippet>>();

        var (profiles, packs) = bundle.MergeInto(existingProfiles, existingPacks);

        Assert.Equal(1, profiles);
        Assert.Equal(1, packs);
        Assert.True(existingProfiles.ContainsKey("Challenge"));
        Assert.True(existingPacks.ContainsKey("typescript"));
    }

    [Fact]
    public void MergeInto_DoesNotOverwriteExisting()
    {
        var bundle = new PortableBundle
        {
            Profiles =
            {
                ["Existing"] = new PracticeProfile { Name = "Existing", XpBaseMultiplier = 1.5 }
            },
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new() { Id = "py-new", Language = "python", Difficulty = 1, Code = "x=1\n" }
                }
            }
        };

        var existingProfiles = new Dictionary<string, PracticeProfile>
        {
            ["Existing"] = new PracticeProfile { Name = "Existing", XpBaseMultiplier = 0.8 }
        };
        var existingPacks = new Dictionary<string, List<Snippet>>
        {
            ["python"] = new List<Snippet>
            {
                new() { Id = "py-old", Language = "python", Difficulty = 2, Code = "y=2\n" }
            }
        };

        var (profiles, packs) = bundle.MergeInto(existingProfiles, existingPacks);

        Assert.Equal(0, profiles);
        Assert.Equal(0, packs);
        // Original values preserved
        Assert.Equal(0.8, existingProfiles["Existing"].XpBaseMultiplier);
        Assert.Equal("py-old", existingPacks["python"][0].Id);
    }

    [Fact]
    public void MergeInto_SkipsDefaultProfile()
    {
        var bundle = new PortableBundle
        {
            Profiles =
            {
                ["Default"] = new PracticeProfile { Name = "Default" },
                ["Custom"] = new PracticeProfile { Name = "Custom" }
            }
        };

        var existingProfiles = new Dictionary<string, PracticeProfile>();
        var existingPacks = new Dictionary<string, List<Snippet>>();

        var (profiles, _) = bundle.MergeInto(existingProfiles, existingPacks);

        Assert.Equal(1, profiles);
        Assert.True(existingProfiles.ContainsKey("Custom"));
        Assert.False(existingProfiles.ContainsKey("Default"));
    }

    [Fact]
    public void MergeInto_ClampsImportedProfiles()
    {
        var bundle = new PortableBundle
        {
            Profiles =
            {
                ["Extreme"] = new PracticeProfile
                {
                    Name = "Extreme",
                    XpBaseMultiplier = 999.0,
                    RatingKFactor = 1000,
                }
            }
        };

        var existingProfiles = new Dictionary<string, PracticeProfile>();
        var existingPacks = new Dictionary<string, List<Snippet>>();

        bundle.MergeInto(existingProfiles, existingPacks);

        var imported = existingProfiles["Extreme"];
        Assert.Equal(2.0, imported.XpBaseMultiplier);
        Assert.Equal(64, imported.RatingKFactor);
    }

    [Fact]
    public void EmptyBundle_MergesNothing()
    {
        var bundle = new PortableBundle();
        var existingProfiles = new Dictionary<string, PracticeProfile>();
        var existingPacks = new Dictionary<string, List<Snippet>>();

        var (profiles, packs) = bundle.MergeInto(existingProfiles, existingPacks);

        Assert.Equal(0, profiles);
        Assert.Equal(0, packs);
    }

    [Fact]
    public void MergeInto_NormalizesLanguageKeys()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["Go"] = new List<Snippet>
                {
                    new() { Id = "go-001", Language = "go", Difficulty = 2, Code = "x\n" }
                }
            }
        };

        var existingPacks = new Dictionary<string, List<Snippet>>();
        bundle.MergeInto(new Dictionary<string, PracticeProfile>(), existingPacks);

        // Key should be lowercase
        Assert.True(existingPacks.ContainsKey("go"));
    }

    [Fact]
    public void Roundtrip_WithNotes_PreservesNotes()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = [i for i in range(10)]\n",
                        Notes = new[] { "Some prefer generator expressions.", "An alternative: filter()" }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var snippet = deserialized.SnippetPacks["python"][0];
        Assert.NotNull(snippet.Notes);
        Assert.Equal(2, snippet.Notes!.Length);
        Assert.Equal("Some prefer generator expressions.", snippet.Notes[0]);
        Assert.Equal("An alternative: filter()", snippet.Notes[1]);
    }

    [Fact]
    public void FormatVersion_IsV3()
    {
        var bundle = new PortableBundle();
        Assert.Equal("3", bundle.FormatVersion);
    }

    [Fact]
    public void V1Bundle_DeserializesWithNullNotes()
    {
        // Simulate a v1 bundle JSON — no "notes" field on snippet
        var v1Json = """
        {
            "FormatVersion": "1",
            "ExportedAt": "2026-01-15T00:00:00+00:00",
            "Profiles": {},
            "SnippetPacks": {
                "python": [
                    {
                        "Id": "py-001",
                        "Language": "python",
                        "Difficulty": 3,
                        "Title": "Test",
                        "Code": "x = 1\n",
                        "Topics": [],
                        "Explain": []
                    }
                ]
            }
        }
        """;

        var bundle = JsonSerializer.Deserialize<PortableBundle>(v1Json)!;

        Assert.Equal("1", bundle.FormatVersion);
        var snippet = bundle.SnippetPacks["python"][0];
        Assert.Null(snippet.Notes); // Missing field → null
    }

    [Fact]
    public void MergeInto_V2Bundle_PreservesNotes()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["go"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "go-001", Language = "go", Difficulty = 2,
                        Code = "fmt.Println(\"hi\")\n",
                        Notes = new[] { "Some prefer fmt.Printf for formatting." }
                    }
                }
            }
        };

        var existingPacks = new Dictionary<string, List<Snippet>>();
        bundle.MergeInto(new Dictionary<string, PracticeProfile>(), existingPacks);

        var snippet = existingPacks["go"][0];
        Assert.NotNull(snippet.Notes);
        Assert.Single(snippet.Notes!);
        Assert.Equal("Some prefer fmt.Printf for formatting.", snippet.Notes![0]);
    }

    [Fact]
    public void MergeInto_V1BundleJson_ImportsWithNullNotes()
    {
        // Parse a v1 bundle (no Notes field) and merge
        var v1Json = """
        {
            "FormatVersion": "1",
            "ExportedAt": "2026-01-15T00:00:00+00:00",
            "Profiles": {},
            "SnippetPacks": {
                "rust": [
                    {
                        "Id": "rs-001",
                        "Language": "rust",
                        "Difficulty": 4,
                        "Title": "Ownership",
                        "Code": "let s = String::from(\"hello\");\n",
                        "Topics": ["ownership"],
                        "Explain": ["Strings are heap-allocated in Rust."]
                    }
                ]
            }
        }
        """;

        var bundle = JsonSerializer.Deserialize<PortableBundle>(v1Json)!;
        var existingPacks = new Dictionary<string, List<Snippet>>();
        bundle.MergeInto(new Dictionary<string, PracticeProfile>(), existingPacks);

        var snippet = existingPacks["rust"][0];
        Assert.Null(snippet.Notes); // v1 bundles have no Notes
        Assert.Equal("rs-001", snippet.Id);
    }

    private static readonly JsonSerializerOptions ExportOpts = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    [Fact]
    public void Export_WithNotes_IncludesInJson()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        Notes = new[] { "A tip from shared practice." }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.Contains("\"Notes\"", json);
        Assert.Contains("A tip from shared practice.", json);
    }

    [Fact]
    public void Export_WithoutNotes_OmitsNullField()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        Notes = null
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.DoesNotContain("\"Notes\"", json);
    }

    [Fact]
    public void ImportedSnippets_HaveNoSourceField()
    {
        // Reflection test: Snippet must never have Source, Author, or Origin properties.
        // Imported content is indistinguishable from local content by design.
        var props = typeof(Snippet).GetProperties()
            .Select(p => p.Name)
            .ToList();

        Assert.DoesNotContain("Source", props);
        Assert.DoesNotContain("Author", props);
        Assert.DoesNotContain("Origin", props);
        Assert.DoesNotContain("ImportedFrom", props);
    }

    [Fact]
    public void Notes_HaveNoMetadata()
    {
        // Notes is string[]? — no wrapper type, no metadata.
        var notesProp = typeof(Snippet).GetProperty("Notes")!;
        Assert.Equal(typeof(string[]), Nullable.GetUnderlyingType(notesProp.PropertyType) ?? notesProp.PropertyType);
    }

    [Fact]
    public void Notes_MultipleEntries_AllPreserved()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = [i for i in range(10)]\n",
                        Notes = new[]
                        {
                            "Some prefer generator expressions for large sequences.",
                            "An alternative: filter(lambda x: x % 2 == 0, range(20))",
                            "In production, consider readability over cleverness."
                        }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var notes = deserialized.SnippetPacks["python"][0].Notes!;
        Assert.Equal(3, notes.Length);
        Assert.Equal("Some prefer generator expressions for large sequences.", notes[0]);
        Assert.Equal("An alternative: filter(lambda x: x % 2 == 0, range(20))", notes[1]);
        Assert.Equal("In production, consider readability over cleverness.", notes[2]);
    }

    [Fact]
    public void MergeInto_NotesFromDifferentPacks_IndependentlyPreserved()
    {
        // Two separate bundles with Notes on different languages
        var bundle1 = new PortableBundle
        {
            SnippetPacks =
            {
                ["go"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "go-001", Language = "go", Difficulty = 2,
                        Code = "fmt.Println()\n",
                        Notes = new[] { "Some prefer log.Println for server code." }
                    }
                }
            }
        };

        var bundle2 = new PortableBundle
        {
            SnippetPacks =
            {
                ["rust"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "rs-001", Language = "rust", Difficulty = 4,
                        Code = "let s = String::from(\"hello\");\n",
                        Notes = new[] { "Consider &str for borrowed strings." }
                    }
                }
            }
        };

        var existingPacks = new Dictionary<string, List<Snippet>>();
        var profiles = new Dictionary<string, PracticeProfile>();

        bundle1.MergeInto(profiles, existingPacks);
        bundle2.MergeInto(profiles, existingPacks);

        Assert.NotNull(existingPacks["go"][0].Notes);
        Assert.Single(existingPacks["go"][0].Notes!);
        Assert.NotNull(existingPacks["rust"][0].Notes);
        Assert.Single(existingPacks["rust"][0].Notes!);
    }

    [Fact]
    public void Roundtrip_WithCommunityDifficulty_Preserved()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 5,
                        Code = "x = 1\n",
                        CommunityDifficulty = 4.2
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var snippet = deserialized.SnippetPacks["python"][0];
        Assert.NotNull(snippet.CommunityDifficulty);
        Assert.Equal(4.2, snippet.CommunityDifficulty!.Value);
    }

    [Fact]
    public void Roundtrip_NullCommunityDifficulty_OmittedInJson()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        CommunityDifficulty = null
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.DoesNotContain("\"CommunityDifficulty\"", json);
    }

    [Fact]
    public void LargeBundle_WithNotes_SerializesEfficiently()
    {
        // 500 snippets with Notes and CommunityDifficulty — roundtrip must complete quickly
        var snippets = new List<Snippet>();
        for (int i = 0; i < 500; i++)
        {
            snippets.Add(new Snippet
            {
                Id = $"py-{i:D4}",
                Language = "python",
                Difficulty = (i % 7) + 1,
                Title = $"Snippet {i}",
                Code = $"x = {i}\nprint(x)\n",
                Notes = new[] { $"Tip {i}", $"Alternative {i}" },
                CommunityDifficulty = (i % 7) + 0.5,
            });
        }

        var bundle = new PortableBundle
        {
            SnippetPacks = { ["python"] = snippets }
        };

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var json = JsonSerializer.Serialize(bundle, ExportOpts);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;
        sw.Stop();

        Assert.Equal(500, deserialized.SnippetPacks["python"].Count);
        Assert.True(sw.ElapsedMilliseconds < 1000, $"500-snippet roundtrip took {sw.ElapsedMilliseconds}ms");
    }

    [Fact]
    public void Roundtrip_WithScaffold_PreservesScaffold()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = [i for i in range(10)]\n",
                        Scaffold = new[]
                        {
                            "This uses a list comprehension with a range.",
                            "List comprehensions evolved from set-builder notation in mathematics."
                        }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var snippet = deserialized.SnippetPacks["python"][0];
        Assert.NotNull(snippet.Scaffold);
        Assert.Equal(2, snippet.Scaffold!.Length);
        Assert.Equal("This uses a list comprehension with a range.", snippet.Scaffold[0]);
        Assert.Equal("List comprehensions evolved from set-builder notation in mathematics.", snippet.Scaffold[1]);
    }

    [Fact]
    public void V2Bundle_DeserializesWithNullScaffoldAndVariants()
    {
        // Simulate a v2 bundle JSON — no "scaffold" or "variants" fields on snippet
        var v2Json = """
        {
            "FormatVersion": "2",
            "ExportedAt": "2026-01-15T00:00:00+00:00",
            "Profiles": {},
            "SnippetPacks": {
                "python": [
                    {
                        "Id": "py-001",
                        "Language": "python",
                        "Difficulty": 3,
                        "Title": "Test",
                        "Code": "x = 1\n",
                        "Topics": [],
                        "Explain": [],
                        "Notes": ["A tip."]
                    }
                ]
            }
        }
        """;

        var bundle = JsonSerializer.Deserialize<PortableBundle>(v2Json)!;

        Assert.Equal("2", bundle.FormatVersion);
        var snippet = bundle.SnippetPacks["python"][0];
        Assert.NotNull(snippet.Notes); // v2 has Notes
        Assert.Null(snippet.Scaffold); // Missing field -> null
        Assert.Null(snippet.Variants); // Missing field -> null
    }

    [Fact]
    public void ImportedSnippets_HaveNoPedagogyMetadata()
    {
        // Reflection: Snippet must never carry teaching hierarchy metadata.
        // No TeachingLevel, Rank, Prerequisite, or PreferredVariant properties.
        var props = typeof(Snippet).GetProperties()
            .Select(p => p.Name)
            .ToList();

        Assert.DoesNotContain("TeachingLevel", props);
        Assert.DoesNotContain("Rank", props);
        Assert.DoesNotContain("Prerequisite", props);
        Assert.DoesNotContain("PreferredVariant", props);
        Assert.DoesNotContain("ScaffoldLevel", props);
        Assert.DoesNotContain("TeachingOrder", props);
    }

    [Fact]
    public void Scaffold_HasNoMetadata()
    {
        // Scaffold is string[]? — a raw array, no wrapper type with metadata.
        var scaffoldProp = typeof(Snippet).GetProperty("Scaffold")!;
        Assert.Equal(typeof(string[]), Nullable.GetUnderlyingType(scaffoldProp.PropertyType) ?? scaffoldProp.PropertyType);
    }

    [Fact]
    public void Variants_HasNoMetadata()
    {
        // Variants is string[]? — a raw array, no wrapper type with metadata.
        var variantsProp = typeof(Snippet).GetProperty("Variants")!;
        Assert.Equal(typeof(string[]), Nullable.GetUnderlyingType(variantsProp.PropertyType) ?? variantsProp.PropertyType);
    }

    [Fact]
    public void Roundtrip_WithVariants_PreservesVariants()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "evens = [x for x in range(20) if x % 2 == 0]\n",
                        Variants = new[]
                        {
                            "evens = list(filter(lambda x: x % 2 == 0, range(20)))",
                            "evens = []\nfor x in range(20):\n    if x % 2 == 0:\n        evens.append(x)"
                        }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var snippet = deserialized.SnippetPacks["python"][0];
        Assert.NotNull(snippet.Variants);
        Assert.Equal(2, snippet.Variants!.Length);
        Assert.Contains("filter", snippet.Variants[0]);
        Assert.Contains("append", snippet.Variants[1]);
    }

    [Fact]
    public void Export_WithScaffold_IncludesInJson()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        Scaffold = new[] { "This uses simple assignment." }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.Contains("\"Scaffold\"", json);
        Assert.Contains("This uses simple assignment.", json);
    }

    [Fact]
    public void Export_WithoutScaffold_OmitsNullField()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        Scaffold = null
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.DoesNotContain("\"Scaffold\"", json);
    }

    [Fact]
    public void Export_WithVariants_IncludesInJson()
    {
        var snippet = new Snippet
        {
            Id = "py-001", Language = "python", Difficulty = 3,
            Code = "x = 1\n",
            Variants = new[] { "evens = list(filter(...))", "for loop approach" }
        };
        var bundle = new PortableBundle
        {
            SnippetPacks = { ["python"] = new List<Snippet> { snippet } }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.Contains("Variants", json);
        Assert.Contains("evens = list(filter(...))", json);
        Assert.Contains("for loop approach", json);
    }

    [Fact]
    public void Export_WithoutVariants_OmitsNullField()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = 1\n",
                        Variants = null
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle, ExportOpts);

        Assert.DoesNotContain("\"Variants\"", json);
    }

    [Fact]
    public void Scaffold_MultipleEntries_OrderPreserved()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "x = [i for i in range(10)]\n",
                        Scaffold = new[]
                        {
                            "Shallow hint about list comprehensions.",
                            "Intermediate context about iteration patterns.",
                            "Deep context about set-builder notation origins."
                        }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var scaffold = deserialized.SnippetPacks["python"][0].Scaffold!;
        Assert.Equal(3, scaffold.Length);
        Assert.Equal("Shallow hint about list comprehensions.", scaffold[0]);
        Assert.Equal("Intermediate context about iteration patterns.", scaffold[1]);
        Assert.Equal("Deep context about set-builder notation origins.", scaffold[2]);
    }

    [Fact]
    public void Variants_MultipleEntries_AllPreserved()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["python"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "py-001", Language = "python", Difficulty = 3,
                        Code = "evens = [x for x in range(20) if x % 2 == 0]\n",
                        Variants = new[]
                        {
                            "evens = list(filter(lambda x: x % 2 == 0, range(20)))",
                            "evens = []\nfor x in range(20):\n    if x % 2 == 0:\n        evens.append(x)",
                            "import itertools\nevens = list(itertools.filterfalse(lambda x: x % 2, range(20)))"
                        }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(bundle);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;

        var variants = deserialized.SnippetPacks["python"][0].Variants!;
        Assert.Equal(3, variants.Length);
        Assert.Contains("filter", variants[0]);
        Assert.Contains("append", variants[1]);
        Assert.Contains("itertools", variants[2]);
    }

    [Fact]
    public void MergeInto_V3Bundle_PreservesScaffoldAndVariants()
    {
        var bundle = new PortableBundle
        {
            SnippetPacks =
            {
                ["go"] = new List<Snippet>
                {
                    new()
                    {
                        Id = "go-001", Language = "go", Difficulty = 2,
                        Code = "fmt.Println(\"hi\")\n",
                        Scaffold = new[] { "Go uses fmt for formatted output." },
                        Variants = new[] { "log.Println(\"hi\")" }
                    }
                }
            }
        };

        var existingPacks = new Dictionary<string, List<Snippet>>();
        bundle.MergeInto(new Dictionary<string, PracticeProfile>(), existingPacks);

        var snippet = existingPacks["go"][0];
        Assert.NotNull(snippet.Scaffold);
        Assert.Single(snippet.Scaffold!);
        Assert.Equal("Go uses fmt for formatted output.", snippet.Scaffold![0]);
        Assert.NotNull(snippet.Variants);
        Assert.Single(snippet.Variants!);
        Assert.Equal("log.Println(\"hi\")", snippet.Variants![0]);
    }

    [Fact]
    public void V1Bundle_DeserializesWithAllNewFieldsNull()
    {
        // v1 JSON has none of the post-v1 fields
        var v1Json = """
        {
            "FormatVersion": "1",
            "ExportedAt": "2026-01-15T00:00:00+00:00",
            "Profiles": {},
            "SnippetPacks": {
                "python": [
                    {
                        "Id": "py-001",
                        "Language": "python",
                        "Difficulty": 3,
                        "Title": "Test",
                        "Code": "x = 1\n",
                        "Topics": [],
                        "Explain": []
                    }
                ]
            }
        }
        """;

        var bundle = JsonSerializer.Deserialize<PortableBundle>(v1Json)!;
        var snippet = bundle.SnippetPacks["python"][0];

        Assert.Equal("1", bundle.FormatVersion);
        Assert.Null(snippet.Notes);
        Assert.Null(snippet.CommunityDifficulty);
        Assert.Null(snippet.Scaffold);
        Assert.Null(snippet.Variants);
    }

    [Fact]
    public void MergeInto_V2Bundle_PreservesExistingNotesButNullPedagogy()
    {
        // v2 bundle has Notes and CommunityDifficulty but no Scaffold/Variants
        var v2Json = """
        {
            "FormatVersion": "2",
            "ExportedAt": "2026-01-15T00:00:00+00:00",
            "Profiles": {},
            "SnippetPacks": {
                "go": [
                    {
                        "Id": "go-001",
                        "Language": "go",
                        "Difficulty": 2,
                        "Title": "Hello",
                        "Code": "fmt.Println()\n",
                        "Topics": [],
                        "Explain": [],
                        "Notes": ["Some prefer log.Println."],
                        "CommunityDifficulty": 2.5
                    }
                ]
            }
        }
        """;

        var bundle = JsonSerializer.Deserialize<PortableBundle>(v2Json)!;
        var existingPacks = new Dictionary<string, List<Snippet>>();
        bundle.MergeInto(new Dictionary<string, PracticeProfile>(), existingPacks);

        var snippet = existingPacks["go"][0];
        Assert.NotNull(snippet.Notes);
        Assert.Single(snippet.Notes!);
        Assert.Equal(2.5, snippet.CommunityDifficulty);
        Assert.Null(snippet.Scaffold); // v2 has no Scaffold
        Assert.Null(snippet.Variants); // v2 has no Variants
    }

    [Fact]
    public void LargeBundle_WithScaffoldAndVariants_SerializesEfficiently()
    {
        // 500 snippets with all fields populated — roundtrip must complete quickly
        var snippets = new List<Snippet>();
        for (int i = 0; i < 500; i++)
        {
            snippets.Add(new Snippet
            {
                Id = $"py-{i:D4}",
                Language = "python",
                Difficulty = (i % 7) + 1,
                Title = $"Snippet {i}",
                Code = $"x = {i}\nprint(x)\n",
                Notes = new[] { $"Tip {i}", $"Alternative {i}" },
                CommunityDifficulty = (i % 7) + 0.5,
                Scaffold = new[] { $"Hint {i}", $"Deeper {i}", $"Deepest {i}" },
                Variants = new[] { $"alt_a_{i}", $"alt_b_{i}" },
            });
        }

        var bundle = new PortableBundle
        {
            SnippetPacks = { ["python"] = snippets }
        };

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var json = JsonSerializer.Serialize(bundle, ExportOpts);
        var deserialized = JsonSerializer.Deserialize<PortableBundle>(json)!;
        sw.Stop();

        Assert.Equal(500, deserialized.SnippetPacks["python"].Count);
        // Verify pedagogy fields survived
        Assert.NotNull(deserialized.SnippetPacks["python"][0].Scaffold);
        Assert.NotNull(deserialized.SnippetPacks["python"][0].Variants);
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"500-snippet roundtrip with pedagogy took {sw.ElapsedMilliseconds}ms");
    }
}
