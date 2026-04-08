using System.Diagnostics;
using System.Text.Json;
using CodeTeam.Core;
using FluentAssertions;
using Xunit;

namespace CodeTeam.InteropSmokeTests;

/// <summary>
/// Interop smoke tests that guard the CLI → Editor extension contract.
///
/// These tests ensure:
/// 1. stdout is pure JSON (no banners, no progress, no warnings)
/// 2. JSON validates against expected structure
/// 3. Error codes match expectations
/// 4. Severity mapping matches EDITOR_INTEGRATION.md Section 8
/// 5. Extensions NEVER infer severity from status/exit_code
///
/// Run these in CI after build, before packaging.
/// </summary>
public class InteropSmokeTests
{
    private static readonly string TestRoot = Path.GetFullPath(
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));

    private static readonly string FixturesRoot = Path.Combine(TestRoot, "fixtures");
    private static readonly string InteropRoot = Path.Combine(
        TestRoot, "tests", "CodeTeam.InteropSmokeTests", "Interop");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly SeverityMap _severityMap;
    private readonly List<SmokeCase> _cases;

    public InteropSmokeTests()
    {
        _severityMap = LoadSeverityMap();
        _cases = LoadCases();
    }

    [Fact]
    public void AllCases_StdoutIsPureJson()
    {
        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);

            // Rule 1: stdout must be JSON only
            var trimmed = result.Stdout.Trim();
            var isJson = (trimmed.StartsWith("{") && trimmed.EndsWith("}")) ||
                         (trimmed.StartsWith("[") && trimmed.EndsWith("]"));

            isJson.Should().BeTrue(
                $"[{testCase.Name}] stdout must be pure JSON.\nSTDOUT:\n{Truncate(result.Stdout)}\nSTDERR:\n{Truncate(result.Stderr)}");
        }
    }

    [Fact]
    public void AllCases_JsonParsesSuccessfully()
    {
        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);

            // Rule 2: must parse as valid JSON
            FluentActions.Invoking(() => JsonDocument.Parse(result.Stdout))
                .Should().NotThrow($"[{testCase.Name}] stdout must parse as JSON");
        }
    }

    [Fact]
    public void AllCases_StatusMatchesExpected()
    {
        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);
            using var doc = JsonDocument.Parse(result.Stdout);

            var status = doc.RootElement.GetProperty("status").GetString();
            status.Should().Be(testCase.ExpectStatus,
                $"[{testCase.Name}] status should match expected");
        }
    }

    [Fact]
    public void AllCases_ExitCodeMatchesExpected()
    {
        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);
            using var doc = JsonDocument.Parse(result.Stdout);

            var exitCode = doc.RootElement.GetProperty("exit_code").GetInt32();
            exitCode.Should().Be(testCase.ExpectExitCode,
                $"[{testCase.Name}] exit_code should match expected");

            // Also verify process exit code matches JSON
            result.ExitCode.Should().Be(testCase.ExpectExitCode,
                $"[{testCase.Name}] process exit code should match JSON exit_code");
        }
    }

    [Fact]
    public void AllCases_ErrorCodesMatchExpected()
    {
        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);
            using var doc = JsonDocument.Parse(result.Stdout);

            var codes = ExtractErrorCodes(doc.RootElement);

            foreach (var expected in testCase.ExpectCodes)
            {
                codes.Should().Contain(expected,
                    $"[{testCase.Name}] should contain error code '{expected}'");
            }

            // If no errors expected, verify errors array is empty
            if (testCase.ExpectCodes.Length == 0)
            {
                codes.Should().BeEmpty(
                    $"[{testCase.Name}] should have no error codes");
            }
        }
    }

    [Fact]
    public void AllCases_SeverityMappingMatchesSpec()
    {
        foreach (var testCase in _cases)
        {
            foreach (var kvp in testCase.ExpectSeverities)
            {
                var code = kvp.Key;
                var expectedSeverity = kvp.Value;

                // Ensure code is in the severity map (prevents "new code, no mapping")
                _severityMap.Map.Should().ContainKey(code,
                    $"[{testCase.Name}] code '{code}' must be in severity-map.v0.1.json");

                // Verify the mapping matches
                var actualSeverity = _severityMap.Resolve(code);
                actualSeverity.Should().Be(expectedSeverity,
                    $"[{testCase.Name}] severity for '{code}' should be '{expectedSeverity}'");
            }
        }
    }

    [Fact]
    public void SeverityMap_NeverInferFromStatus()
    {
        // This test enforces the critical rule from EDITOR_INTEGRATION.md:
        // "Extensions MUST NOT infer severity from status or exit_code"
        //
        // We verify this by ensuring:
        // 1. OK_UNSIGNED can have warning diagnostics (not an error condition)
        // 2. Severity is determined solely by error code lookup

        // LEGACY_SIGNATURE_IGNORED should be "warning" not "error"
        // even though it might appear alongside OK_UNSIGNED status
        _severityMap.Resolve("LEGACY_SIGNATURE_IGNORED").Should().Be("warning",
            "LEGACY_SIGNATURE_IGNORED must be warning, not inferred from status");

        // DUPLICATE_SIGNER should be "info" not "error"
        _severityMap.Resolve("DUPLICATE_SIGNER").Should().Be("info",
            "DUPLICATE_SIGNER must be info, not inferred from status");

        // All FAIL_* related codes should be "error"
        _severityMap.Resolve("SIGNATURE_QUORUM_NOT_MET").Should().Be("error");
        _severityMap.Resolve("APPROVAL_QUORUM_NOT_MET").Should().Be("error");
        _severityMap.Resolve("SCHEMA_INVALID").Should().Be("error");
    }

    [Fact]
    public void SeverityMap_CoversAllKnownErrorCodes()
    {
        // Ensure every ErrorCode constant has an explicit mapping in severity-map.v0.1.json
        // This prevents "new code added, mapping forgotten" bugs
        var knownCodes = new[]
        {
            // Core integrity codes
            ErrorCode.MISSING_FILE,
            ErrorCode.SIZE_MISMATCH,
            ErrorCode.DIGEST_MISMATCH,
            ErrorCode.SCHEMA_INVALID,
            ErrorCode.SIGNATURE_INVALID,
            ErrorCode.ACTOR_NOT_AUTHORIZED,
            ErrorCode.THRESHOLD_NOT_MET,

            // Quorum codes
            ErrorCode.SIGNATURE_QUORUM_NOT_MET,
            ErrorCode.APPROVAL_QUORUM_NOT_MET,
            ErrorCode.SIGNATURE_NOT_ALLOWED,
            ErrorCode.PURPOSE_MISMATCH,
            ErrorCode.DUPLICATE_SIGNER,

            // Format compatibility codes
            ErrorCode.LEGACY_SIGNATURE_IGNORED,
            ErrorCode.SIGNATURE_FORMAT_UNSUPPORTED,
        };

        foreach (var code in knownCodes)
        {
            _severityMap.Map.Should().ContainKey(code,
                $"ErrorCode.{code} must have an explicit mapping in severity-map.v0.1.json");
        }
    }

    [Fact]
    public void SeverityMap_AllMappedCodesHaveValidSeverity()
    {
        var validSeverities = new[] { "error", "warning", "info" };

        foreach (var kvp in _severityMap.Map)
        {
            validSeverities.Should().Contain(kvp.Value,
                $"code '{kvp.Key}' has invalid severity '{kvp.Value}'");
        }

        validSeverities.Should().Contain(_severityMap.DefaultSeverity,
            $"default severity '{_severityMap.DefaultSeverity}' is invalid");
    }

    [Fact]
    public void AllCases_JsonHasRequiredFields()
    {
        var requiredFields = new[] { "status", "exit_code", "summary" };

        foreach (var testCase in _cases)
        {
            var result = RunVerifyCommand(testCase);
            using var doc = JsonDocument.Parse(result.Stdout);

            foreach (var field in requiredFields)
            {
                doc.RootElement.TryGetProperty(field, out _).Should().BeTrue(
                    $"[{testCase.Name}] JSON must have required field '{field}'");
            }
        }
    }

    #region Helper Methods

    private static (string Stdout, string Stderr, int ExitCode) RunVerifyCommand(SmokeCase testCase)
    {
        var fixturePath = Path.Combine(FixturesRoot, testCase.Fixture);

        // Resolve CLI path: prefer CODETEAM_CLI_PATH env var for CI reliability
        var cliPath = Environment.GetEnvironmentVariable("CODETEAM_CLI_PATH");
        string fileName;
        List<string> args;

        if (!string.IsNullOrEmpty(cliPath))
        {
            fileName = cliPath;
            args = new List<string> { "verify", fixturePath, "--json" };
        }
        else
        {
            // Fallback: use dotnet run from CLI project
            fileName = "dotnet";
            var cliProjectPath = Path.Combine(TestRoot, "src", "CodeTeam.Cli");
            args = new List<string>
            {
                "run",
                "--project", cliProjectPath,
                "--no-build",
                "--",
                "verify", fixturePath, "--json"
            };
        }

        if (testCase.VerifySignatures)
        {
            args.Add("--verify-signatures");
        }

        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        foreach (var arg in args)
        {
            psi.ArgumentList.Add(arg);
        }

        using var process = Process.Start(psi)!;
        var stdout = process.StandardOutput.ReadToEnd();
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(30000); // 30 second timeout

        return (stdout, stderr, process.ExitCode);
    }

    private static List<string> ExtractErrorCodes(JsonElement root)
    {
        var codes = new List<string>();

        if (root.TryGetProperty("errors", out var errors) &&
            errors.ValueKind == JsonValueKind.Array)
        {
            foreach (var error in errors.EnumerateArray())
            {
                if (error.TryGetProperty("code", out var code) &&
                    code.ValueKind == JsonValueKind.String)
                {
                    codes.Add(code.GetString()!);
                }
            }
        }

        return codes;
    }

    private SeverityMap LoadSeverityMap()
    {
        var path = Path.Combine(InteropRoot, "severity-map.v0.1.json");
        var json = File.ReadAllText(path);
        using var doc = JsonDocument.Parse(json);

        var version = doc.RootElement.GetProperty("version").GetString()!;
        var defaultSeverity = doc.RootElement.GetProperty("default").GetString()!;
        var map = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var prop in doc.RootElement.GetProperty("map").EnumerateObject())
        {
            map[prop.Name] = prop.Value.GetString()!;
        }

        return new SeverityMap(version, defaultSeverity, map);
    }

    private List<SmokeCase> LoadCases()
    {
        var path = Path.Combine(InteropRoot, "cases.v0.1.json");
        var json = File.ReadAllText(path);
        using var doc = JsonDocument.Parse(json);

        var cases = new List<SmokeCase>();

        foreach (var caseEl in doc.RootElement.GetProperty("cases").EnumerateArray())
        {
            var expectCodes = new List<string>();
            if (caseEl.TryGetProperty("expect_codes", out var codes))
            {
                foreach (var code in codes.EnumerateArray())
                {
                    expectCodes.Add(code.GetString()!);
                }
            }

            var expectSeverities = new Dictionary<string, string>();
            if (caseEl.TryGetProperty("expect_severities", out var severities))
            {
                foreach (var prop in severities.EnumerateObject())
                {
                    expectSeverities[prop.Name] = prop.Value.GetString()!;
                }
            }

            cases.Add(new SmokeCase(
                Name: caseEl.GetProperty("name").GetString()!,
                Description: caseEl.TryGetProperty("description", out var desc) ? desc.GetString()! : "",
                Fixture: caseEl.GetProperty("fixture").GetString()!,
                VerifySignatures: caseEl.TryGetProperty("verify_signatures", out var vs) && vs.GetBoolean(),
                ExpectStatus: caseEl.GetProperty("expect_status").GetString()!,
                ExpectExitCode: caseEl.GetProperty("expect_exit_code").GetInt32(),
                ExpectCodes: expectCodes.ToArray(),
                ExpectSeverities: expectSeverities
            ));
        }

        return cases;
    }

    private static string Truncate(string s, int maxLength = 500)
    {
        if (string.IsNullOrEmpty(s)) return "(empty)";
        return s.Length <= maxLength ? s : s[..maxLength] + "...";
    }

    #endregion
}

public sealed record SeverityMap(
    string Version,
    string DefaultSeverity,
    Dictionary<string, string> Map)
{
    public string Resolve(string code) =>
        Map.TryGetValue(code, out var severity) ? severity : DefaultSeverity;
}

public sealed record SmokeCase(
    string Name,
    string Description,
    string Fixture,
    bool VerifySignatures,
    string ExpectStatus,
    int ExpectExitCode,
    string[] ExpectCodes,
    Dictionary<string, string> ExpectSeverities);
