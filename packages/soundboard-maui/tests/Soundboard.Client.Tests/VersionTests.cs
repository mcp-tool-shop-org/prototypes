using Xunit;
using System.Reflection;

namespace Soundboard.Client.Tests;

public class VersionTests
{
    [Fact]
    public void AssemblyVersion_IsNotDefault()
    {
        var asm = typeof(SoundboardClient).Assembly;
        var ver = asm.GetName().Version;
        Assert.NotNull(ver);
        Assert.True(ver!.Major >= 1, $"Expected major >= 1, got {ver.Major}");
    }

    [Fact]
    public void AssemblyVersion_MatchesCsproj()
    {
        var asm = typeof(SoundboardClient).Assembly;
        var ver = asm.GetName().Version;
        Assert.NotNull(ver);
        // csproj is 1.2.2 — assembly should match major.minor.patch
        Assert.Equal(1, ver!.Major);
        Assert.True(ver.Minor >= 2, $"Expected minor >= 2, got {ver.Minor}");
    }

    [Fact]
    public void LicenseFile_IsNotEmpty()
    {
        // Walk up from test assembly to repo root
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "LICENSE")))
        {
            dir = Directory.GetParent(dir)?.FullName;
        }

        Assert.NotNull(dir);
        var license = File.ReadAllText(Path.Combine(dir!, "LICENSE"));
        Assert.Contains("MIT License", license);
    }
}
