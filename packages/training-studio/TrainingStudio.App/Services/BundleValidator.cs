using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;

namespace TrainingStudio.App.Services;

/// <summary>
/// Validates Training Studio export bundles against the v0.1 contract.
/// Enforces two invariants:
///   A: Every artifact listed must exist and hash-match
///   B: Every file in bundle should be listed in artifacts (warning)
/// </summary>
public class BundleValidator
{
    private const string BUNDLE_VERSION = "0.1";

    private static readonly string[] RequiredPaths = new[]
    {
        "bundle.json",
        "model/model.json",
        "model/weights.bin",
        "metrics/summary.json",
        "config/run_config.json",
        "data/schema.json"
    };

    public record ValidationResult(
        bool Valid,
        string? Version,
        List<ValidationError> Errors,
        List<ValidationWarning> Warnings,
        string Summary
    );

    public record ValidationError(string Code, string Message, string? Path = null);
    public record ValidationWarning(string Code, string Message, string? Path = null);

    /// <summary>
    /// Validate a bundle from a ZIP file
    /// </summary>
    public async Task<ValidationResult> ValidateZip(string zipPath)
    {
        if (!File.Exists(zipPath))
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("FILE_NOT_FOUND", $"ZIP file not found: {zipPath}") },
                new List<ValidationWarning>(),
                "INVALID: File not found"
            );
        }

        using var archive = ZipFile.OpenRead(zipPath);
        return await ValidateArchive(archive);
    }

    /// <summary>
    /// Validate a bundle from an extracted directory
    /// </summary>
    public async Task<ValidationResult> ValidateDirectory(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("DIR_NOT_FOUND", $"Directory not found: {directoryPath}") },
                new List<ValidationWarning>(),
                "INVALID: Directory not found"
            );
        }

        var errors = new List<ValidationError>();
        var warnings = new List<ValidationWarning>();

        // Read manifest
        var manifestPath = Path.Combine(directoryPath, "bundle.json");
        if (!File.Exists(manifestPath))
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("NO_MANIFEST", "bundle.json not found") },
                new List<ValidationWarning>(),
                "INVALID: No manifest"
            );
        }

        JsonDocument manifest;
        try
        {
            var manifestText = await File.ReadAllTextAsync(manifestPath);
            manifest = JsonDocument.Parse(manifestText);
        }
        catch (Exception ex)
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("PARSE_ERROR", $"Failed to parse bundle.json: {ex.Message}") },
                new List<ValidationWarning>(),
                "INVALID: Manifest parse error"
            );
        }

        // Check version
        var version = manifest.RootElement.TryGetProperty("bundle_version", out var v) ? v.GetString() : null;
        if (version != BUNDLE_VERSION)
        {
            errors.Add(new ValidationError("VERSION_MISMATCH", $"Expected version {BUNDLE_VERSION}, got {version}"));
        }

        // Check artifacts
        if (!manifest.RootElement.TryGetProperty("artifacts", out var artifacts) ||
            artifacts.ValueKind != JsonValueKind.Array)
        {
            errors.Add(new ValidationError("INVALID_ARTIFACTS", "artifacts must be an array"));
            return new ValidationResult(false, version, errors, warnings, $"INVALID: {errors.Count} error(s)");
        }

        var artifactPaths = new HashSet<string>();

        foreach (var artifact in artifacts.EnumerateArray())
        {
            var path = artifact.GetProperty("path").GetString()!;
            var expectedHash = artifact.GetProperty("sha256").GetString()!;
            var expectedSize = artifact.GetProperty("size_bytes").GetInt64();

            artifactPaths.Add(path);

            var filePath = Path.Combine(directoryPath, path.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(filePath))
            {
                errors.Add(new ValidationError("ARTIFACT_MISSING", $"Artifact file not found: {path}", path));
                continue;
            }

            var fileBytes = await File.ReadAllBytesAsync(filePath);

            // Check size
            if (fileBytes.Length != expectedSize)
            {
                errors.Add(new ValidationError("SIZE_MISMATCH",
                    $"Size mismatch for {path}: expected {expectedSize}, got {fileBytes.Length}", path));
            }

            // Check hash
            var computedHash = ComputeSha256(fileBytes);
            if (computedHash != expectedHash)
            {
                errors.Add(new ValidationError("HASH_MISMATCH", $"Hash mismatch for {path}", path));
            }
        }

        // Check required paths
        foreach (var required in RequiredPaths)
        {
            if (required == "bundle.json") continue;
            if (!artifactPaths.Contains(required))
            {
                errors.Add(new ValidationError("MISSING_REQUIRED", $"Required file not in artifacts: {required}", required));
            }
        }

        // Check for unlisted files (warning)
        var allFiles = Directory.GetFiles(directoryPath, "*", SearchOption.AllDirectories)
            .Select(f => Path.GetRelativePath(directoryPath, f).Replace(Path.DirectorySeparatorChar, '/'))
            .Where(f => f != "bundle.json");

        foreach (var file in allFiles)
        {
            if (!artifactPaths.Contains(file))
            {
                warnings.Add(new ValidationWarning("UNLISTED_FILE", $"File exists but not in artifacts: {file}", file));
            }
        }

        var valid = errors.Count == 0;
        var summary = valid
            ? $"VALID: v{version} bundle with {artifactPaths.Count} artifacts"
            : $"INVALID: {errors.Count} error(s), {warnings.Count} warning(s)";

        return new ValidationResult(valid, version, errors, warnings, summary);
    }

    private async Task<ValidationResult> ValidateArchive(ZipArchive archive)
    {
        var errors = new List<ValidationError>();
        var warnings = new List<ValidationWarning>();

        // Read manifest
        var manifestEntry = archive.GetEntry("bundle.json");
        if (manifestEntry == null)
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("NO_MANIFEST", "bundle.json not found in ZIP") },
                new List<ValidationWarning>(),
                "INVALID: No manifest"
            );
        }

        JsonDocument manifest;
        try
        {
            using var stream = manifestEntry.Open();
            manifest = await JsonDocument.ParseAsync(stream);
        }
        catch (Exception ex)
        {
            return new ValidationResult(
                false,
                null,
                new List<ValidationError> { new("PARSE_ERROR", $"Failed to parse bundle.json: {ex.Message}") },
                new List<ValidationWarning>(),
                "INVALID: Manifest parse error"
            );
        }

        // Check version
        var version = manifest.RootElement.TryGetProperty("bundle_version", out var v) ? v.GetString() : null;
        if (version != BUNDLE_VERSION)
        {
            errors.Add(new ValidationError("VERSION_MISMATCH", $"Expected version {BUNDLE_VERSION}, got {version}"));
        }

        // Check artifacts
        if (!manifest.RootElement.TryGetProperty("artifacts", out var artifacts) ||
            artifacts.ValueKind != JsonValueKind.Array)
        {
            errors.Add(new ValidationError("INVALID_ARTIFACTS", "artifacts must be an array"));
            return new ValidationResult(false, version, errors, warnings, $"INVALID: {errors.Count} error(s)");
        }

        var artifactPaths = new HashSet<string>();

        foreach (var artifact in artifacts.EnumerateArray())
        {
            var path = artifact.GetProperty("path").GetString()!;
            var expectedHash = artifact.GetProperty("sha256").GetString()!;
            var expectedSize = artifact.GetProperty("size_bytes").GetInt64();

            artifactPaths.Add(path);

            var entry = archive.GetEntry(path) ?? archive.GetEntry(path.Replace('/', '\\'));
            if (entry == null)
            {
                errors.Add(new ValidationError("ARTIFACT_MISSING", $"Artifact not found in ZIP: {path}", path));
                continue;
            }

            using var stream = entry.Open();
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            var fileBytes = ms.ToArray();

            // Check size
            if (fileBytes.Length != expectedSize)
            {
                errors.Add(new ValidationError("SIZE_MISMATCH",
                    $"Size mismatch for {path}: expected {expectedSize}, got {fileBytes.Length}", path));
            }

            // Check hash
            var computedHash = ComputeSha256(fileBytes);
            if (computedHash != expectedHash)
            {
                errors.Add(new ValidationError("HASH_MISMATCH", $"Hash mismatch for {path}", path));
            }
        }

        // Check required paths
        foreach (var required in RequiredPaths)
        {
            if (required == "bundle.json") continue;
            if (!artifactPaths.Contains(required))
            {
                errors.Add(new ValidationError("MISSING_REQUIRED", $"Required file not in artifacts: {required}", required));
            }
        }

        // Check for unlisted files in ZIP (warning)
        foreach (var entry in archive.Entries)
        {
            var normalizedPath = entry.FullName.Replace('\\', '/');
            if (normalizedPath == "bundle.json") continue;
            if (string.IsNullOrEmpty(entry.Name)) continue; // Skip directories

            if (!artifactPaths.Contains(normalizedPath))
            {
                warnings.Add(new ValidationWarning("UNLISTED_FILE",
                    $"File in ZIP but not in artifacts: {normalizedPath}", normalizedPath));
            }
        }

        var valid = errors.Count == 0;
        var summary = valid
            ? $"VALID: v{version} bundle with {artifactPaths.Count} artifacts"
            : $"INVALID: {errors.Count} error(s), {warnings.Count} warning(s)";

        return new ValidationResult(valid, version, errors, warnings, summary);
    }

    private static string ComputeSha256(byte[] data)
    {
        var hash = SHA256.HashData(data);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>
    /// Format validation result for display
    /// </summary>
    public static string FormatResult(ValidationResult result)
    {
        var lines = new List<string> { result.Summary };

        if (result.Errors.Count > 0)
        {
            lines.Add("");
            lines.Add("Errors:");
            foreach (var err in result.Errors)
            {
                lines.Add($"  [{err.Code}] {err.Message}");
            }
        }

        if (result.Warnings.Count > 0)
        {
            lines.Add("");
            lines.Add("Warnings:");
            foreach (var warn in result.Warnings)
            {
                lines.Add($"  [{warn.Code}] {warn.Message}");
            }
        }

        return string.Join(Environment.NewLine, lines);
    }
}
