using FluentAssertions;
using Xunit;

namespace PocketLedger.Infrastructure.Tests;

public class DiagnosticsTests
{
    [Fact]
    public void RunChecks_ReturnsReport()
    {
        var report = Diagnostics.RunChecks();

        report.Should().NotBeNull();
        report.Checks.Should().NotBeEmpty();
        report.AllOk.Should().BeTrue();
    }

    [Fact]
    public void RunChecks_ContainsRuntimeInfo()
    {
        var report = Diagnostics.RunChecks();
        var names = report.Checks.Select(c => c.Name).ToList();

        names.Should().Contain("runtime");
        names.Should().Contain("os");
        names.Should().Contain("product.version");
    }

    [Fact]
    public void RunChecks_DetectsDomainAssembly()
    {
        var report = Diagnostics.RunChecks();

        report.Checks
            .Should().Contain(c => c.Name == "assembly.PocketLedger.Domain" && c.Ok);
    }
}
