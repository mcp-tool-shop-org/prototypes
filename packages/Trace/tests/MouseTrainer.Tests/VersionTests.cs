using Xunit;

namespace MouseTrainer.Tests;

public class VersionTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "CHANGELOG.md")))
        {
            dir = Directory.GetParent(dir)?.FullName;
        }
        return dir ?? throw new InvalidOperationException("Could not find repo root");
    }

    [Fact]
    public void MauiHost_ApplicationDisplayVersion_IsSemver()
    {
        var csproj = File.ReadAllText(
            Path.Combine(RepoRoot, "src", "MouseTrainer.MauiHost", "MouseTrainer.MauiHost.csproj"));
        // Extract ApplicationDisplayVersion
        var match = System.Text.RegularExpressions.Regex.Match(
            csproj, @"<ApplicationDisplayVersion>([^<]+)</ApplicationDisplayVersion>");
        Assert.True(match.Success, "ApplicationDisplayVersion not found in MauiHost.csproj");
        var ver = match.Groups[1].Value;
        var parts = ver.Split('.');
        Assert.True(parts.Length >= 3, $"Expected semver, got {ver}");
        Assert.All(parts[..3], p => Assert.True(int.TryParse(p, out _), $"Non-numeric part: {p}"));
    }

    [Fact]
    public void MauiHost_Version_IsAtLeast_1_0_0()
    {
        var csproj = File.ReadAllText(
            Path.Combine(RepoRoot, "src", "MouseTrainer.MauiHost", "MouseTrainer.MauiHost.csproj"));
        var match = System.Text.RegularExpressions.Regex.Match(
            csproj, @"<ApplicationDisplayVersion>([^<]+)</ApplicationDisplayVersion>");
        Assert.True(match.Success);
        var major = int.Parse(match.Groups[1].Value.Split('.')[0]);
        Assert.True(major >= 1, $"Expected major >= 1, got {major}");
    }

    [Fact]
    public void Changelog_Contains_Current_Version()
    {
        var csproj = File.ReadAllText(
            Path.Combine(RepoRoot, "src", "MouseTrainer.MauiHost", "MouseTrainer.MauiHost.csproj"));
        var match = System.Text.RegularExpressions.Regex.Match(
            csproj, @"<ApplicationDisplayVersion>([^<]+)</ApplicationDisplayVersion>");
        Assert.True(match.Success);
        var ver = match.Groups[1].Value;
        var changelog = File.ReadAllText(Path.Combine(RepoRoot, "CHANGELOG.md"));
        Assert.Contains($"[{ver}]", changelog);
    }

    [Fact]
    public void License_File_Exists_And_Is_Not_Empty()
    {
        var license = File.ReadAllText(Path.Combine(RepoRoot, "LICENSE"));
        Assert.Contains("MIT", license);
    }
}
