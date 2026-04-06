using System.Xml.Linq;
using Xunit;

namespace MouseTrainer.Tests.Infrastructure;

public class VersionConsistencyTests
{
    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir, "MouseTrainer.Deterministic.sln")))
                return dir;
            dir = Path.GetDirectoryName(dir);
        }
        throw new InvalidOperationException("Could not find repo root (MouseTrainer.Deterministic.sln)");
    }

    private static string GetVersionFromCsproj(string csprojPath)
    {
        var doc = XDocument.Load(csprojPath);
        var ns = doc.Root?.Name.Namespace ?? XNamespace.None;
        var version = doc.Descendants(ns + "Version").FirstOrDefault()?.Value;
        return version ?? doc.Descendants(ns + "ApplicationDisplayVersion").FirstOrDefault()?.Value ?? "unknown";
    }

    [Fact]
    public void AllLibraryVersionsMatch()
    {
        var root = FindRepoRoot();
        var csprojFiles = new[]
        {
            "src/MouseTrainer.Domain/MouseTrainer.Domain.csproj",
            "src/MouseTrainer.Simulation/MouseTrainer.Simulation.csproj",
            "src/MouseTrainer.Audio/MouseTrainer.Audio.csproj",
        };

        var versions = csprojFiles
            .Select(f => (File: f, Version: GetVersionFromCsproj(Path.Combine(root, f))))
            .ToList();

        var expected = versions[0].Version;
        foreach (var (file, version) in versions)
        {
            Assert.Equal(expected, version);
        }
    }

    [Fact]
    public void MauiHostVersionMatchesLibraries()
    {
        var root = FindRepoRoot();
        var domainVersion = GetVersionFromCsproj(
            Path.Combine(root, "src/MouseTrainer.Domain/MouseTrainer.Domain.csproj"));

        var hostPath = Path.Combine(root, "src/MouseTrainer.MauiHost/MouseTrainer.MauiHost.csproj");
        if (!File.Exists(hostPath))
            return; // MAUI host may not be present on CI (ubuntu)

        var hostVersion = GetVersionFromCsproj(hostPath);
        Assert.Equal(domainVersion, hostVersion);
    }

    [Fact]
    public void ChangelogMentionsCurrentVersion()
    {
        var root = FindRepoRoot();
        var domainVersion = GetVersionFromCsproj(
            Path.Combine(root, "src/MouseTrainer.Domain/MouseTrainer.Domain.csproj"));
        var changelog = File.ReadAllText(Path.Combine(root, "CHANGELOG.md"));
        Assert.Contains($"[{domainVersion}]", changelog);
    }
}
