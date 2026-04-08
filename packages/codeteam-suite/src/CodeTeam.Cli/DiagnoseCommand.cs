using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using CodeTeam.Core;
using CodeTeam.Crypto;

namespace CodeTeam.Cli;

/// <summary>
/// Implementation of the 'codeteam diagnose' command.
/// Reports environment, runtime, and cryptographic capability status.
/// </summary>
public static class DiagnoseCommand
{
    private static readonly JsonSerializerOptions JsonOutputOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true
    };

    /// <summary>
    /// Execute the diagnose command
    /// </summary>
    /// <param name="outputJson">Whether to output JSON</param>
    /// <returns>Exit code: 0 if healthy, 1 if issues detected</returns>
    public static int Execute(bool outputJson)
    {
        var checks = new List<DiagnoseCheck>();
        var healthy = true;

        // 1. Runtime check
        var runtimeVersion = RuntimeInformation.FrameworkDescription;
        checks.Add(new DiagnoseCheck("runtime", "ok", runtimeVersion));

        // 2. OS check
        var os = RuntimeInformation.OSDescription;
        checks.Add(new DiagnoseCheck("os", "ok", os));

        // 3. Assembly version
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version;
        var versionStr = version is not null
            ? $"{version.Major}.{version.Minor}.{version.Build}"
            : "unknown";
        checks.Add(new DiagnoseCheck("cli_version", "ok", versionStr));

        // 4. Schema version
        var schemaVersion = Verifier.SupportedSchemaVersion;
        checks.Add(new DiagnoseCheck("schema_version", "ok", schemaVersion));

        // 5. Crypto availability (Ed25519 via NSec)
        try
        {
            var keyData = KeyFile.Generate();
            checks.Add(new DiagnoseCheck("crypto_ed25519", "ok", $"key generation works (kid: {keyData.Kid})"));
        }
        catch (Exception ex)
        {
            checks.Add(new DiagnoseCheck("crypto_ed25519", "fail", ex.Message));
            healthy = false;
        }

        // 6. SHA-256 availability
        try
        {
            using var sha = System.Security.Cryptography.SHA256.Create();
            var hash = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes("test"));
            checks.Add(new DiagnoseCheck("crypto_sha256", "ok", $"hash works ({hash.Length * 8}-bit)"));
        }
        catch (Exception ex)
        {
            checks.Add(new DiagnoseCheck("crypto_sha256", "fail", ex.Message));
            healthy = false;
        }

        if (outputJson)
        {
            var output = new DiagnoseOutput
            {
                Healthy = healthy,
                Checks = checks
            };
            Console.WriteLine(JsonSerializer.Serialize(output, JsonOutputOptions));
        }
        else
        {
            Console.WriteLine($"codeteam diagnose");
            Console.WriteLine();
            foreach (var check in checks)
            {
                var icon = check.Status == "ok" ? "✓" : "✗";
                Console.WriteLine($"  {icon} {check.Name}: {check.Detail}");
            }
            Console.WriteLine();
            Console.WriteLine(healthy ? "All checks passed." : "Some checks failed.");
        }

        return healthy ? 0 : 1;
    }

    private sealed class DiagnoseCheck
    {
        public string Name { get; }
        public string Status { get; }
        public string Detail { get; }

        public DiagnoseCheck(string name, string status, string detail)
        {
            Name = name;
            Status = status;
            Detail = detail;
        }
    }

    private sealed class DiagnoseOutput
    {
        public required bool Healthy { get; init; }
        public required List<DiagnoseCheck> Checks { get; init; }
    }
}
