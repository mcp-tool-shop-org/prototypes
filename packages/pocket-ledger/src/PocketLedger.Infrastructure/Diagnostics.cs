using System.Reflection;
using System.Runtime.InteropServices;

namespace PocketLedger.Infrastructure;

/// <summary>
/// Runtime diagnostics for PocketLedger — checks assembly health, runtime version,
/// and required dependency availability.
/// </summary>
public static class Diagnostics
{
    public sealed record DiagnosticCheck(string Name, string Value, bool Ok);

    public sealed record DiagnosticReport(IReadOnlyList<DiagnosticCheck> Checks, bool AllOk);

    public static DiagnosticReport RunChecks()
    {
        var checks = new List<DiagnosticCheck>();

        // Runtime info
        checks.Add(new DiagnosticCheck(
            "runtime",
            RuntimeInformation.FrameworkDescription,
            true));

        checks.Add(new DiagnosticCheck(
            "os",
            RuntimeInformation.OSDescription,
            true));

        // Product version from Directory.Build.props
        var asm = typeof(Diagnostics).Assembly;
        var version = asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
            ?? asm.GetName().Version?.ToString()
            ?? "unknown";
        checks.Add(new DiagnosticCheck(
            "product.version",
            version,
            version != "unknown"));

        // Check required assemblies
        string[] requiredAssemblies =
        [
            "PocketLedger.Domain",
            "PocketLedger.Application",
            "Microsoft.EntityFrameworkCore.Sqlite",
        ];

        foreach (var name in requiredAssemblies)
        {
            try
            {
                var loaded = Assembly.Load(name);
                checks.Add(new DiagnosticCheck(
                    $"assembly.{name}",
                    loaded.GetName().Version?.ToString() ?? "loaded",
                    true));
            }
            catch
            {
                checks.Add(new DiagnosticCheck(
                    $"assembly.{name}",
                    "not found",
                    false));
            }
        }

        return new DiagnosticReport(checks, checks.All(c => c.Ok));
    }
}
