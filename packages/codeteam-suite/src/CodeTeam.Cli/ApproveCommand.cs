using System.Text.Json;
using System.Text.Json.Serialization;
using CodeTeam.Core;
using CodeTeam.Crypto;
using CodeTeam.Packaging;

namespace CodeTeam.Cli;

/// <summary>
/// Implementation of the 'codeteam approve' command.
/// Creates an approval record bound to the computed package digest.
/// </summary>
public static class ApproveCommand
{
    private static readonly JsonSerializerOptions JsonOutputOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Execute the approve command.
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <param name="keyPath">Path to key file</param>
    /// <param name="role">Role of the approver</param>
    /// <param name="outputPath">Output file path (null for stdout)</param>
    /// <param name="comment">Optional comment</param>
    /// <param name="outputJson">Whether to output JSON (for CLI feedback)</param>
    /// <returns>Exit code (0 = success)</returns>
    public static async Task<int> ExecuteAsync(
        string packagePath,
        string keyPath,
        string role,
        string? outputPath,
        string? comment,
        bool outputJson)
    {
        try
        {
            // Resolve paths
            var absolutePackagePath = Path.GetFullPath(packagePath);
            var absoluteKeyPath = Path.GetFullPath(keyPath);

            // Validate package exists
            if (!Directory.Exists(absolutePackagePath))
            {
                return OutputError(outputJson, $"Package directory not found: {absolutePackagePath}");
            }

            // Load key file
            if (!File.Exists(absoluteKeyPath))
            {
                return OutputError(outputJson, $"Key file not found: {absoluteKeyPath}");
            }

            KeyFileData keyData;
            try
            {
                keyData = KeyFile.Load(absoluteKeyPath);
            }
            catch (Exception ex)
            {
                return OutputError(outputJson, $"Failed to load key file: {ex.Message}");
            }

            // Load package and compute digest
            using var reader = new DirectoryPackageReader(absolutePackagePath);
            var loader = new PackageLoaderImpl(reader);
            var digestComputer = new Sha256DigestComputer();

            var manifest = await loader.LoadManifestAsync(absolutePackagePath);
            if (manifest is null)
            {
                return OutputError(outputJson, "Package has no valid manifest");
            }

            // Compute manifest digest
            var manifestJson = reader.ReadAllText(PackageConstants.ManifestPath);
            var manifestDigest = digestComputer.ComputeDigest(System.Text.Encoding.UTF8.GetBytes(manifestJson));

            // Compute artifact digests
            var artifactInfos = new List<ArtifactDigestInfo>();
            foreach (var artifact in manifest.Artifacts)
            {
                var artifactBytes = reader.ReadAllBytes(artifact.Path);
                var artifactDigest = digestComputer.ComputeDigest(artifactBytes);
                artifactInfos.Add(new ArtifactDigestInfo
                {
                    Path = artifact.Path,
                    Sha256 = artifactDigest,
                    SizeBytes = artifact.SizeBytes
                });
            }

            // Compute package digest
            var packageDigest = PackageDigest.Compute(manifestDigest, artifactInfos);

            // Build signable payload for approval
            var signable = SignablePayloadBuilder.ForApproval(packageDigest, role);
            var signableBytes = SignablePayloadBuilder.GetSignableBytes(signable);

            // Sign the approval
            var signatureBase64 = KeyFile.SignToBase64(keyData, signableBytes);
            var publicKeyBase64 = KeyFile.GetPublicKeyBase64(keyData);

            // Build approval envelope
            var approval = new ApprovalEnvelope
            {
                SchemaVersion = "0.1",
                Algorithm = "ed25519",
                KeyId = keyData.Kid,
                PublicKey = publicKeyBase64,
                Signature = signatureBase64,
                Signable = signable,
                CreatedAt = DateTime.UtcNow.ToString("o"),
                Comment = comment
            };

            // Output the approval
            var approvalJson = JsonSerializer.Serialize(approval, JsonOutputOptions);

            if (outputPath is not null)
            {
                var absoluteOutputPath = Path.GetFullPath(outputPath);
                var outputDir = Path.GetDirectoryName(absoluteOutputPath);
                if (!string.IsNullOrEmpty(outputDir) && !Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                await File.WriteAllTextAsync(absoluteOutputPath, approvalJson);

                if (outputJson)
                {
                    OutputSuccess(keyData.Kid, packageDigest, absoluteOutputPath);
                }
                else
                {
                    Console.WriteLine($"Approval created: {absoluteOutputPath}");
                    Console.WriteLine($"  Package digest: {packageDigest}");
                    Console.WriteLine($"  Approver: {keyData.Kid}");
                    Console.WriteLine($"  Role: {role}");
                }
            }
            else
            {
                // Output to stdout
                Console.WriteLine(approvalJson);
            }

            return 0;
        }
        catch (Exception ex)
        {
            return OutputError(outputJson, $"Unexpected error: {ex.Message}");
        }
    }

    private static int OutputError(bool outputJson, string message)
    {
        if (outputJson)
        {
            var error = new { error = message };
            Console.Error.WriteLine(JsonSerializer.Serialize(error, JsonOutputOptions));
        }
        else
        {
            Console.Error.WriteLine($"Error: {message}");
        }
        return 1;
    }

    private static void OutputSuccess(string keyId, string packageDigest, string outputPath)
    {
        var result = new
        {
            status = "success",
            key_id = keyId,
            package_digest = packageDigest,
            output_path = outputPath
        };
        Console.WriteLine(JsonSerializer.Serialize(result, JsonOutputOptions));
    }
}
