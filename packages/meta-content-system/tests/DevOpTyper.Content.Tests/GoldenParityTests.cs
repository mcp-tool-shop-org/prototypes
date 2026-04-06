using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Nodes;
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Services;
using Xunit;

namespace DevOpTyper.Content.Tests;

public class GoldenParityTests
{
    private static string FixturesDir
    {
        get
        {
            // Walk up from bin output to find test project root
            var dir = AppContext.BaseDirectory;
            while (dir != null && !File.Exists(Path.Combine(dir, "DevOpTyper.Content.Tests.csproj")))
                dir = Path.GetDirectoryName(dir);
            return Path.Combine(dir ?? ".", "Fixtures");
        }
    }

    private static string GoldenFilePath => Path.Combine(FixturesDir, "golden.index.json");

    /// <summary>
    /// Strips all timestamp fields from the index JSON so golden comparison is deterministic.
    /// </summary>
    private static string NormalizeForComparison(string json)
    {
        var node = JsonNode.Parse(json)!;

        // Remove top-level GeneratedUtc
        node.AsObject().Remove("generatedUtc");
        node.AsObject().Remove("GeneratedUtc");

        // Remove machine-specific and time-varying fields from each item
        var items = node["items"] ?? node["Items"];
        if (items is JsonArray arr)
        {
            foreach (var item in arr)
            {
                item?.AsObject().Remove("createdUtc");
                item?.AsObject().Remove("CreatedUtc");
                item?.AsObject().Remove("origin");
                item?.AsObject().Remove("Origin");
            }
        }

        return node.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
    }

    [Fact]
    public async Task IndexMatchesGoldenFile()
    {
        Assert.True(Directory.Exists(FixturesDir), $"Fixtures directory not found: {FixturesDir}");

        var source = new FixtureSource(FixturesDir);
        var builder = new LibraryIndexBuilder(new DefaultExtractor(), new MetricCalculator());
        var index = await builder.BuildAsync(source);

        var store = new JsonLibraryIndexStore();
        var tempPath = Path.GetTempFileName();

        try
        {
            store.Save(tempPath, index);
            var actualJson = File.ReadAllText(tempPath);
            var normalizedActual = NormalizeForComparison(actualJson);

            if (!File.Exists(GoldenFilePath))
            {
                // Bootstrap: write the golden file on first run
                File.WriteAllText(GoldenFilePath, normalizedActual);
                Assert.Fail(
                    $"Golden file did not exist and has been created at {GoldenFilePath}. " +
                    "Review it, commit it, then re-run. This test will pass on subsequent runs.");
            }

            var goldenJson = File.ReadAllText(GoldenFilePath);
            // Re-normalize golden in case formatting changed
            var normalizedGolden = NormalizeForComparison(goldenJson);

            Assert.Equal(normalizedGolden, normalizedActual);
        }
        finally
        {
            if (File.Exists(tempPath))
                File.Delete(tempPath);
        }
    }

    private sealed class FixtureSource : IContentSource
    {
        private readonly string _root;
        private static readonly string[] CodeExtensions = { ".py", ".cs", ".js", ".ts", ".java", ".rs", ".go" };

        public FixtureSource(string root) => _root = root;

        public async IAsyncEnumerable<RawContent> EnumerateAsync(
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            var files = Directory.EnumerateFiles(_root)
                .Where(f => CodeExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                .OrderBy(f => Path.GetFileName(f), StringComparer.Ordinal); // deterministic order

            foreach (var f in files)
            {
                ct.ThrowIfCancellationRequested();
                var text = await File.ReadAllTextAsync(f, ct);
                yield return new RawContent(
                    Path: f,
                    LanguageHint: null,
                    Title: Path.GetFileName(f),
                    Text: text,
                    Source: "corpus",
                    Origin: _root
                );
            }
        }
    }
}
