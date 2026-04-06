using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TrainingStudio.App.Services;

/// <summary>
/// Handles export of training bundles following the v0.1 bundle contract.
/// Bundle structure:
///   bundle.json           - Manifest with version, hashes, metadata
///   model/model.json      - TF.js model topology
///   model/weights.bin     - Model weights
///   metrics/metrics.jsonl - Per-epoch metrics
///   metrics/summary.json  - Training summary
///   config/run_config.json- Hyperparameters
///   data/schema.json      - Feature/label mapping
/// </summary>
public class ExportService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    /// <summary>
    /// Creates an export bundle from the new v0.1 format with pre-computed files
    /// </summary>
    public async Task<string> CreateExportBundleV1(string folderPath, JsonElement bundleData)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var bundleName = $"training_export_{timestamp}";
        var zipPath = Path.Combine(folderPath, $"{bundleName}.zip");
        var tempDir = Path.Combine(Path.GetTempPath(), bundleName);

        try
        {
            // Create directory structure
            Directory.CreateDirectory(tempDir);
            Directory.CreateDirectory(Path.Combine(tempDir, "model"));
            Directory.CreateDirectory(Path.Combine(tempDir, "metrics"));
            Directory.CreateDirectory(Path.Combine(tempDir, "config"));
            Directory.CreateDirectory(Path.Combine(tempDir, "data"));

            // Check if this is the new v0.1 format (has filesBase64)
            if (bundleData.TryGetProperty("filesBase64", out var filesBase64))
            {
                await WriteV1Bundle(tempDir, bundleData, filesBase64);
            }
            else
            {
                // Fall back to legacy format
                await WriteLegacyBundle(tempDir, bundleData);
            }

            // Create ZIP
            if (File.Exists(zipPath))
            {
                File.Delete(zipPath);
            }
            ZipFile.CreateFromDirectory(tempDir, zipPath);

            return zipPath;
        }
        finally
        {
            // Cleanup temp directory
            if (Directory.Exists(tempDir))
            {
                Directory.Delete(tempDir, true);
            }
        }
    }

    private async Task WriteV1Bundle(string tempDir, JsonElement bundleData, JsonElement filesBase64)
    {
        // Write manifest
        if (bundleData.TryGetProperty("manifest", out var manifest))
        {
            await File.WriteAllTextAsync(
                Path.Combine(tempDir, "bundle.json"),
                JsonSerializer.Serialize(manifest, JsonOptions)
            );
        }

        // Write all files from filesBase64
        foreach (var prop in filesBase64.EnumerateObject())
        {
            var relativePath = prop.Name;
            var base64Content = prop.Value.GetString() ?? "";

            // Decode from base64
            var bytes = Convert.FromBase64String(base64Content);

            // Ensure directory exists
            var fullPath = Path.Combine(tempDir, relativePath.Replace('/', Path.DirectorySeparatorChar));
            var dir = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            // Write file
            await File.WriteAllBytesAsync(fullPath, bytes);
        }
    }

    private async Task WriteLegacyBundle(string tempDir, JsonElement bundleData)
    {
        // Legacy format support for backwards compatibility
        if (bundleData.TryGetProperty("modelJson", out var modelJson))
        {
            await File.WriteAllTextAsync(
                Path.Combine(tempDir, "model", "model.json"),
                modelJson.GetString() ?? "{}"
            );
        }

        if (bundleData.TryGetProperty("weightsBase64", out var weightsBase64))
        {
            var weightsBytes = Convert.FromBase64String(weightsBase64.GetString() ?? "");
            await File.WriteAllBytesAsync(
                Path.Combine(tempDir, "model", "weights.bin"),
                weightsBytes
            );
        }

        if (bundleData.TryGetProperty("metrics", out var metrics))
        {
            await File.WriteAllTextAsync(
                Path.Combine(tempDir, "metrics", "summary.json"),
                JsonSerializer.Serialize(metrics, JsonOptions)
            );
        }

        if (bundleData.TryGetProperty("config", out var config))
        {
            await File.WriteAllTextAsync(
                Path.Combine(tempDir, "config", "run_config.json"),
                JsonSerializer.Serialize(config, JsonOptions)
            );
        }

        // Write bundle manifest for legacy exports
        var legacyManifest = new
        {
            bundle_version = "0.1",
            created_utc = DateTime.UtcNow.ToString("O"),
            app = new { name = "Training Studio", version = "0.1.0" },
            note = "Legacy export format"
        };
        await File.WriteAllTextAsync(
            Path.Combine(tempDir, "bundle.json"),
            JsonSerializer.Serialize(legacyManifest, JsonOptions)
        );
    }

    /// <summary>
    /// Original method for backwards compatibility
    /// </summary>
    public Task<string> CreateExportBundle(string folderPath, JsonElement bundleData)
    {
        return CreateExportBundleV1(folderPath, bundleData);
    }

    /// <summary>
    /// Compute SHA-256 hash of a byte array
    /// </summary>
    public static string ComputeSha256(byte[] data)
    {
        var hashBytes = SHA256.HashData(data);
        return Convert.ToHexStringLower(hashBytes);
    }

    /// <summary>
    /// Compute SHA-256 hash of a string (UTF-8 encoded)
    /// </summary>
    public static string ComputeSha256(string text)
    {
        return ComputeSha256(Encoding.UTF8.GetBytes(text));
    }

    /// <summary>
    /// Compute bundle digest from artifacts following the v0.1 spec.
    /// Format: "bundle_version:{version}\n{path}\n{sha256}\n{size_bytes}\n..."
    /// Artifacts are sorted alphabetically by path.
    /// </summary>
    public static string ComputeBundleDigest(string bundleVersion, IEnumerable<ArtifactInfo> artifacts)
    {
        var sorted = artifacts.OrderBy(a => a.Path, StringComparer.Ordinal).ToList();

        var canonical = new StringBuilder();
        canonical.Append($"bundle_version:{bundleVersion}\n");

        foreach (var artifact in sorted)
        {
            canonical.Append($"{artifact.Path}\n{artifact.Sha256}\n{artifact.SizeBytes}\n");
        }

        return ComputeSha256(canonical.ToString());
    }

    /// <summary>
    /// Create a complete bundle manifest with computed digest
    /// </summary>
    public static BundleManifest CreateManifest(
        string bundleVersion,
        string bundleId,
        string runId,
        IEnumerable<ArtifactInfo> artifacts,
        BundleMetadata metadata)
    {
        var artifactList = artifacts.ToList();
        var digest = ComputeBundleDigest(bundleVersion, artifactList);

        return new BundleManifest
        {
            BundleVersion = bundleVersion,
            BundleId = bundleId,
            RunId = runId,
            BundleDigest = digest,
            SchemaUri = "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
            SchemaVersion = "0.1",
            CreatedUtc = DateTime.UtcNow.ToString("O"),
            App = metadata.App,
            Backend = metadata.Backend,
            Dataset = metadata.Dataset,
            Model = metadata.Model,
            Training = metadata.Training,
            Artifacts = artifactList
        };
    }
}

/// <summary>
/// Information about a bundle artifact
/// </summary>
public record ArtifactInfo
{
    public required string Path { get; init; }
    public required string Sha256 { get; init; }
    public required long SizeBytes { get; init; }
}

/// <summary>
/// Bundle manifest structure matching v0.1 spec
/// </summary>
public class BundleManifest
{
    public required string BundleVersion { get; init; }
    public required string BundleId { get; init; }
    public required string RunId { get; init; }
    public required string BundleDigest { get; init; }
    public required string SchemaUri { get; init; }
    public required string SchemaVersion { get; init; }
    public required string CreatedUtc { get; init; }
    public object? App { get; init; }
    public object? Backend { get; init; }
    public object? Dataset { get; init; }
    public object? Model { get; init; }
    public object? Training { get; init; }
    public required List<ArtifactInfo> Artifacts { get; init; }
}

/// <summary>
/// Metadata sections for bundle manifest
/// </summary>
public class BundleMetadata
{
    public object? App { get; init; }
    public object? Backend { get; init; }
    public object? Dataset { get; init; }
    public object? Model { get; init; }
    public object? Training { get; init; }
}
