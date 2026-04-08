using System.Diagnostics;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests that CLI JSON output matches the frozen CLI output schema contract.
/// These tests lock the interop contract and prevent regressions.
/// </summary>
public class CliOutputSchemaTests
{
    private static readonly string FixturesPath = Path.Combine(
        AppContext.BaseDirectory, "fixtures");

    // Valid status values per schema
    private static readonly HashSet<string> ValidStatuses = new()
    {
        "OK_UNSIGNED", "OK_VERIFIED", "FAIL_INTEGRITY", "FAIL_SCHEMA",
        "FAIL_SIGNATURE", "FAIL_THRESHOLD", "FAIL_UNAUTHORIZED"
    };

    // Valid error codes per schema
    private static readonly HashSet<string> ValidErrorCodes = new()
    {
        "MISSING_FILE", "SIZE_MISMATCH", "DIGEST_MISMATCH", "SCHEMA_INVALID",
        "SIGNATURE_INVALID", "ACTOR_NOT_AUTHORIZED", "THRESHOLD_NOT_MET"
    };

    // Allowed top-level fields per schema (additionalProperties: false)
    private static readonly HashSet<string> AllowedTopLevelFields = new()
    {
        "status", "exit_code", "package_path", "package_digest", "manifest_digest",
        "summary", "checks", "errors", "warnings", "timestamp"
    };

    // Required summary fields per schema
    private static readonly HashSet<string> RequiredSummaryFields = new()
    {
        "artifacts_count", "evidence_count", "approvals_valid", "approvals_required",
        "signature_present", "signature_valid"
    };

    [Theory]
    [InlineData("minimal_unsigned", "OK_UNSIGNED", 1)]
    [InlineData("approved_threshold_met", "OK_UNSIGNED", 1)]
    [InlineData("signed_verified", "OK_VERIFIED", 0)]
    [InlineData("tampered_artifact", "FAIL_INTEGRITY", 2)]
    [InlineData("invalid_manifest", "FAIL_SCHEMA", 3)]
    public async Task CliOutput_ShouldHaveCorrectStatusAndExitCode(string fixtureName, string expectedStatus, int expectedExitCode)
    {
        // Arrange
        var fixturePath = Path.Combine(FixturesPath, fixtureName);

        // Act
        var (exitCode, stdout, stderr) = await RunCliAsync(fixturePath);

        // Assert
        var json = JsonDocument.Parse(stdout);
        var status = json.RootElement.GetProperty("status").GetString();
        var jsonExitCode = json.RootElement.GetProperty("exit_code").GetInt32();

        status.Should().Be(expectedStatus, $"Fixture '{fixtureName}' should have status {expectedStatus}");
        jsonExitCode.Should().Be(expectedExitCode, $"Fixture '{fixtureName}' should have exit_code {expectedExitCode}");
        exitCode.Should().Be(expectedExitCode, $"CLI process exit code should match JSON exit_code");
    }

    [Theory]
    [InlineData("minimal_unsigned")]
    [InlineData("approved_threshold_met")]
    [InlineData("signed_verified")]
    [InlineData("tampered_artifact")]
    [InlineData("invalid_manifest")]
    public async Task CliOutput_ShouldHaveValidStatus(string fixtureName)
    {
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);

        var status = json.RootElement.GetProperty("status").GetString();
        ValidStatuses.Should().Contain(status!, $"Status '{status}' should be valid per schema");
    }

    [Theory]
    [InlineData("minimal_unsigned")]
    [InlineData("approved_threshold_met")]
    [InlineData("signed_verified")]
    [InlineData("tampered_artifact")]
    [InlineData("invalid_manifest")]
    public async Task CliOutput_ShouldHaveRequiredFields(string fixtureName)
    {
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);
        var root = json.RootElement;

        // Required top-level fields per schema
        root.TryGetProperty("status", out _).Should().BeTrue("status is required");
        root.TryGetProperty("exit_code", out _).Should().BeTrue("exit_code is required");
        root.TryGetProperty("package_path", out _).Should().BeTrue("package_path is required");
        root.TryGetProperty("summary", out _).Should().BeTrue("summary is required");

        // Validate summary required fields
        var summary = root.GetProperty("summary");
        foreach (var field in RequiredSummaryFields)
        {
            summary.TryGetProperty(field, out _).Should().BeTrue($"summary.{field} is required");
        }
    }

    [Theory]
    [InlineData("minimal_unsigned")]
    [InlineData("approved_threshold_met")]
    [InlineData("signed_verified")]
    [InlineData("tampered_artifact")]
    [InlineData("invalid_manifest")]
    public async Task CliOutput_ShouldNotHaveUnexpectedTopLevelFields(string fixtureName)
    {
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);

        foreach (var prop in json.RootElement.EnumerateObject())
        {
            AllowedTopLevelFields.Should().Contain(prop.Name,
                $"Unexpected field '{prop.Name}' in CLI output - may break schema compliance");
        }
    }

    [Theory]
    [InlineData("minimal_unsigned")]
    [InlineData("approved_threshold_met")]
    [InlineData("signed_verified")]
    [InlineData("tampered_artifact")]
    [InlineData("invalid_manifest")]
    public async Task CliOutput_ExitCodeShouldBeInValidRange(string fixtureName)
    {
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);

        var exitCode = json.RootElement.GetProperty("exit_code").GetInt32();
        exitCode.Should().BeInRange(0, 6, "exit_code should be 0-6 per schema");
    }

    [Fact]
    public async Task CliOutput_TamperedArtifact_ShouldHaveValidErrorCodes()
    {
        var fixturePath = Path.Combine(FixturesPath, "tampered_artifact");
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);

        json.RootElement.TryGetProperty("errors", out var errors).Should().BeTrue();
        errors.GetArrayLength().Should().BeGreaterThan(0, "tampered_artifact should have errors");

        foreach (var error in errors.EnumerateArray())
        {
            var code = error.GetProperty("code").GetString();
            ValidErrorCodes.Should().Contain(code!, $"Error code '{code}' should be valid per schema");

            // Errors must have message
            error.TryGetProperty("message", out _).Should().BeTrue("errors must have message");
        }
    }

    [Fact]
    public async Task CliOutput_StdoutShouldBeOnlyJson()
    {
        // Critical for editor integration: stdout must be ONLY valid JSON
        var fixturePath = Path.Combine(FixturesPath, "minimal_unsigned");
        var (_, stdout, _) = await RunCliAsync(fixturePath);

        var trimmed = stdout.Trim();
        trimmed.Should().StartWith("{", "stdout should start with JSON object");
        trimmed.Should().EndWith("}", "stdout should end with JSON object");

        // Should parse as single JSON document without error
        var action = () => JsonDocument.Parse(trimmed);
        action.Should().NotThrow("stdout should be valid JSON");
    }

    [Fact]
    public async Task CliOutput_ShouldBeDeterministic()
    {
        // Run the same verification twice and ensure identical JSON (except timestamp)
        var fixturePath = Path.Combine(FixturesPath, "minimal_unsigned");

        var (_, stdout1, _) = await RunCliAsync(fixturePath);
        var (_, stdout2, _) = await RunCliAsync(fixturePath);

        var json1 = JsonDocument.Parse(stdout1);
        var json2 = JsonDocument.Parse(stdout2);

        // Compare all fields except timestamp
        json1.RootElement.GetProperty("status").GetString()
            .Should().Be(json2.RootElement.GetProperty("status").GetString());
        json1.RootElement.GetProperty("exit_code").GetInt32()
            .Should().Be(json2.RootElement.GetProperty("exit_code").GetInt32());
        json1.RootElement.GetProperty("package_path").GetString()
            .Should().Be(json2.RootElement.GetProperty("package_path").GetString());

        // Compare summaries
        var s1 = json1.RootElement.GetProperty("summary");
        var s2 = json2.RootElement.GetProperty("summary");
        s1.GetProperty("artifacts_count").GetInt32().Should().Be(s2.GetProperty("artifacts_count").GetInt32());
        s1.GetProperty("evidence_count").GetInt32().Should().Be(s2.GetProperty("evidence_count").GetInt32());
    }

    [Theory]
    [InlineData("minimal_unsigned")]
    [InlineData("approved_threshold_met")]
    [InlineData("signed_verified")]
    [InlineData("tampered_artifact")]
    [InlineData("invalid_manifest")]
    public async Task CliOutput_DigestFieldsShouldMatchPattern(string fixtureName)
    {
        var fixturePath = Path.Combine(FixturesPath, fixtureName);
        var (_, stdout, _) = await RunCliAsync(fixturePath);
        var json = JsonDocument.Parse(stdout);
        var root = json.RootElement;

        // Check package_digest if present
        if (root.TryGetProperty("package_digest", out var pd) && pd.ValueKind == JsonValueKind.String)
        {
            var digest = pd.GetString()!;
            digest.Should().MatchRegex(@"^sha256:[0-9a-f]{64}$",
                "package_digest should match pattern sha256:[hex64]");
        }

        // Check manifest_digest if present
        if (root.TryGetProperty("manifest_digest", out var md) && md.ValueKind == JsonValueKind.String)
        {
            var digest = md.GetString()!;
            digest.Should().MatchRegex(@"^sha256:[0-9a-f]{64}$",
                "manifest_digest should match pattern sha256:[hex64]");
        }
    }

    #region Version Command Tests

    [Fact]
    public async Task VersionCommand_ShouldReturnValidJson()
    {
        // Act
        var (exitCode, stdout, _) = await RunVersionCommandAsync();

        // Assert
        exitCode.Should().Be(0, "version command should return exit code 0");

        var action = () => JsonDocument.Parse(stdout.Trim());
        action.Should().NotThrow("version output should be valid JSON");
    }

    [Fact]
    public async Task VersionCommand_ShouldHaveRequiredFields()
    {
        // Act
        var (_, stdout, _) = await RunVersionCommandAsync();
        var json = JsonDocument.Parse(stdout);
        var root = json.RootElement;

        // Assert
        root.TryGetProperty("cli_version", out var cliVersion).Should().BeTrue("cli_version is required");
        root.TryGetProperty("schema_version", out var schemaVersion).Should().BeTrue("schema_version is required");

        cliVersion.GetString().Should().MatchRegex(@"^\d+\.\d+\.\d+$", "cli_version should be semver");
        schemaVersion.GetString().Should().MatchRegex(@"^\d+\.\d+$", "schema_version should be major.minor");
    }

    [Fact]
    public async Task VersionCommand_ShouldMatchSupportedSchemaVersion()
    {
        // Act
        var (_, stdout, _) = await RunVersionCommandAsync();
        var json = JsonDocument.Parse(stdout);

        var schemaVersion = json.RootElement.GetProperty("schema_version").GetString();

        // Should match the Verifier.SupportedSchemaVersion constant
        schemaVersion.Should().Be("0.1", "schema_version should match Verifier.SupportedSchemaVersion");
    }

    [Fact]
    public async Task VersionCommand_StdoutShouldBeOnlyJson()
    {
        // Act
        var (_, stdout, _) = await RunVersionCommandAsync();

        var trimmed = stdout.Trim();
        trimmed.Should().StartWith("{", "stdout should start with JSON object");
        trimmed.Should().EndWith("}", "stdout should end with JSON object");
    }

    private static async Task<(int exitCode, string stdout, string stderr)> RunVersionCommandAsync()
    {
        var cliPath = Path.Combine(AppContext.BaseDirectory, "codeteam.dll");

        var psi = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"\"{cliPath}\" version --json",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi)!;
        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return (process.ExitCode, stdout, stderr);
    }

    #endregion

    private static async Task<(int exitCode, string stdout, string stderr)> RunCliAsync(string fixturePath)
    {
        var cliPath = Path.Combine(AppContext.BaseDirectory, "codeteam.dll");

        var psi = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"\"{cliPath}\" verify \"{fixturePath}\" --json",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi)!;
        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return (process.ExitCode, stdout, stderr);
    }
}
