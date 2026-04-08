using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using CodeTeam.Core;

namespace CodeTeam.Cli;

/// <summary>
/// Implementation of the 'codeteam version' command.
/// Returns version information for CLI compatibility checks.
/// </summary>
public static class VersionCommand
{
    private static readonly JsonSerializerOptions JsonOutputOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true
    };

    /// <summary>
    /// Execute the version command
    /// </summary>
    /// <param name="outputJson">Whether to output JSON</param>
    /// <returns>Exit code (always 0 for version)</returns>
    public static int Execute(bool outputJson)
    {
        var cliVersion = GetCliVersion();
        var schemaVersion = Verifier.SupportedSchemaVersion;

        if (outputJson)
        {
            var output = new VersionOutput
            {
                CliVersion = cliVersion,
                SchemaVersion = schemaVersion
            };
            var json = JsonSerializer.Serialize(output, JsonOutputOptions);
            Console.WriteLine(json);
        }
        else
        {
            Console.WriteLine($"codeteam {cliVersion}");
            Console.WriteLine($"Schema version: {schemaVersion}");
        }

        return 0;
    }

    private static string GetCliVersion()
    {
        // Try to get version from assembly
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version;

        if (version is not null)
        {
            return $"{version.Major}.{version.Minor}.{version.Build}";
        }

        // Fallback to csproj version
        return "1.0.3";
    }

    private sealed class VersionOutput
    {
        public required string CliVersion { get; init; }
        public required string SchemaVersion { get; init; }
    }
}
