using System.Text.Json;
using System.Text.Json.Serialization;
using CodeTeam.Crypto;

namespace CodeTeam.Cli;

/// <summary>
/// Implementation of the 'codeteam keygen' command.
/// Generates a new Ed25519 key pair.
/// </summary>
public static class KeygenCommand
{
    private static readonly JsonSerializerOptions JsonOutputOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Execute the keygen command.
    /// </summary>
    /// <param name="outputPath">Output file path (null for stdout)</param>
    /// <param name="outputJson">Whether to output JSON (for CLI feedback)</param>
    /// <returns>Exit code (0 = success)</returns>
    public static int Execute(string? outputPath, bool outputJson)
    {
        try
        {
            // Generate new key
            var keyData = KeyFile.Generate();

            // Serialize the key file
            var keyJson = KeyFile.Serialize(keyData);

            if (outputPath is not null)
            {
                var absoluteOutputPath = Path.GetFullPath(outputPath);
                var outputDir = Path.GetDirectoryName(absoluteOutputPath);
                if (!string.IsNullOrEmpty(outputDir) && !Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                File.WriteAllText(absoluteOutputPath, keyJson);

                if (outputJson)
                {
                    var result = new
                    {
                        status = "success",
                        key_id = keyData.Kid,
                        output_path = absoluteOutputPath
                    };
                    Console.WriteLine(JsonSerializer.Serialize(result, JsonOutputOptions));
                }
                else
                {
                    Console.WriteLine($"Key generated: {absoluteOutputPath}");
                    Console.WriteLine($"  Key ID: {keyData.Kid}");
                    Console.WriteLine();
                    Console.WriteLine("IMPORTANT: Keep this key file secure. Anyone with access can sign packages.");
                }
            }
            else
            {
                // Output to stdout
                Console.WriteLine(keyJson);
            }

            return 0;
        }
        catch (Exception ex)
        {
            if (outputJson)
            {
                var error = new { error = ex.Message };
                Console.Error.WriteLine(JsonSerializer.Serialize(error, JsonOutputOptions));
            }
            else
            {
                Console.Error.WriteLine($"Error: {ex.Message}");
            }
            return 1;
        }
    }
}
