using System.Text.Json;
using System.Text.Json.Serialization;
using CodeTeam.Core;
using CodeTeam.Crypto;
using CodeTeam.Packaging;

namespace CodeTeam.Cli;

/// <summary>
/// Implementation of the 'codeteam verify' command.
/// Orchestrates package loading, verification, and result output.
/// </summary>
public static class VerifyCommand
{
    private static readonly JsonSerializerOptions JsonOutputOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Execute the verify command
    /// </summary>
    /// <param name="packagePath">Path to package directory</param>
    /// <param name="outputJson">Whether to output JSON</param>
    /// <param name="verifySignatures">Whether to cryptographically verify signatures</param>
    /// <returns>Exit code per CONTRACT.md</returns>
    public static async Task<int> ExecuteAsync(string packagePath, bool outputJson, bool verifySignatures = false)
    {
        try
        {
            // Resolve to absolute path
            var absolutePath = Path.GetFullPath(packagePath);

            if (!Directory.Exists(absolutePath))
            {
                if (outputJson)
                {
                    OutputErrorJson(absolutePath, "Package directory not found");
                }
                else
                {
                    Console.Error.WriteLine($"Error: Package directory not found: {absolutePath}");
                }
                return (int)VerificationStatus.FAIL_SCHEMA;
            }

            // Load and verify package
            using var reader = new DirectoryPackageReader(absolutePath);
            var input = await BuildVerificationInputAsync(reader, absolutePath);

            // Configure signature verification based on flag
            VerifierOptions options;
            if (verifySignatures)
            {
                var signatureVerifier = new Ed25519SignatureVerifier();
                options = VerifierOptions.WithSignatureVerification(
                    (publicKey, message, signature) => signatureVerifier.Verify(publicKey, message, signature));
            }
            else
            {
                options = VerifierOptions.Default;
            }
            var result = Verifier.Verify(input, options);

            // Output result
            if (outputJson)
            {
                OutputResultJson(result);
            }
            else
            {
                OutputResultHuman(result);
            }

            return result.ExitCode;
        }
        catch (Exception ex)
        {
            if (outputJson)
            {
                OutputErrorJson(packagePath, ex.Message);
            }
            else
            {
                Console.Error.WriteLine($"Error: {ex.Message}");
            }
            return 99; // Unexpected error
        }
    }

    /// <summary>
    /// Build verification input by loading package contents
    /// </summary>
    private static async Task<VerificationInput> BuildVerificationInputAsync(
        IPackageReader reader,
        string packagePath)
    {
        // Load manifest
        var loader = new PackageLoaderImpl(reader);
        var manifest = await loader.LoadManifestAsync(packagePath);

        string? manifestJson = null;
        ManifestData? manifestData = null;

        if (reader.FileExists(PackageConstants.ManifestPath))
        {
            manifestJson = reader.ReadAllText(PackageConstants.ManifestPath);

            if (manifest is not null)
            {
                manifestData = MapToManifestData(manifest);
            }
        }

        // Load artifacts info
        var artifactFiles = new Dictionary<string, ArtifactFileInfo>();
        var evidenceFiles = new Dictionary<string, ArtifactFileInfo>();
        var digestComputer = new Sha256DigestComputer();

        if (manifestData is not null)
        {
            // Compute actual hashes for declared artifacts
            foreach (var artifact in manifestData.Artifacts)
            {
                var fileInfo = await GetArtifactFileInfoAsync(reader, artifact.Path, digestComputer);
                artifactFiles[artifact.Path] = fileInfo;
            }

            // Compute actual hashes for declared evidence
            foreach (var evidence in manifestData.Evidence)
            {
                var fileInfo = await GetArtifactFileInfoAsync(reader, evidence.Path, digestComputer);
                evidenceFiles[evidence.Path] = fileInfo;
            }
        }

        // Load approvals and signatures
        var approvals = await loader.LoadApprovalsAsync(packagePath);
        var signatures = await loader.LoadSignaturesAsync(packagePath);

        return new VerificationInput
        {
            PackagePath = packagePath,
            Manifest = manifestData,
            ManifestJson = manifestJson,
            ArtifactFiles = artifactFiles,
            EvidenceFiles = evidenceFiles,
            Approvals = approvals.Select(MapToApprovalData).ToList(),
            Signatures = signatures.Select(MapToSignatureData).ToList()
        };
    }

    private static async Task<ArtifactFileInfo> GetArtifactFileInfoAsync(
        IPackageReader reader,
        string path,
        Sha256DigestComputer digestComputer)
    {
        if (!reader.FileExists(path))
        {
            return new ArtifactFileInfo
            {
                Path = path,
                Exists = false,
                SizeBytes = -1,
                ActualDigest = ""
            };
        }

        var size = reader.GetFileSize(path);
        var bytes = reader.ReadAllBytes(path);
        var digest = digestComputer.ComputeDigest(bytes);

        return new ArtifactFileInfo
        {
            Path = path,
            Exists = true,
            SizeBytes = size,
            ActualDigest = digest
        };
    }

    private static ManifestData MapToManifestData(PackageManifest m)
    {
        return new ManifestData
        {
            SchemaVersion = m.SchemaVersion,
            PackageVersion = m.PackageVersion,
            CreatedAt = m.CreatedAt,
            Intent = m.Intent,
            WorkspaceName = m.Workspace.Name,
            Artifacts = m.Artifacts.Select(a => new ArtifactData
            {
                Path = a.Path,
                ExpectedDigest = a.Sha256,
                ExpectedSize = a.SizeBytes
            }).ToList(),
            Evidence = m.Evidence.Select(e => new EvidenceData
            {
                Path = e.Path,
                ExpectedDigest = e.Sha256,
                ExpectedSize = e.SizeBytes,
                Category = e.Category
            }).ToList(),
            Policy = new PolicyData
            {
                RequiredApprovals = m.Policy.RequiredApprovals,
                AuthorizedKeys = m.Policy.ApproverKeys.Select(k => new AuthorizedKey
                {
                    Id = k.Id,
                    Algorithm = k.Algorithm,
                    PublicKey = k.PublicKey,
                    Name = k.Name
                }).ToList()
            }
        };
    }

    private static ApprovalData MapToApprovalData(ApprovalRecord r)
    {
        return new ApprovalData
        {
            Type = r.Type,
            PackageDigest = r.PackageDigest,
            ApproverId = r.ApproverId,
            Timestamp = r.Ts,
            Comment = r.Comment,
            Signature = r.Signature
        };
    }

    private static SignatureData MapToSignatureData(SignatureRecord r)
    {
        return new SignatureData
        {
            Type = r.Type,
            PackageDigest = r.PackageDigest,
            SignerId = r.SignerId,
            Role = r.Role,
            Timestamp = r.Ts,
            Signature = r.Signature
        };
    }

    private static void OutputResultJson(VerificationResult result)
    {
        var output = new CliVerifyOutput
        {
            Status = result.Status.ToString(),
            ExitCode = result.ExitCode,
            PackagePath = result.PackagePath,
            PackageDigest = result.PackageDigest,
            ManifestDigest = result.ManifestDigest,
            Summary = new CliSummary
            {
                ArtifactsCount = result.Summary.ArtifactsCount,
                EvidenceCount = result.Summary.EvidenceCount,
                ApprovalsValid = result.Summary.ApprovalsValid,
                ApprovalsRequired = result.Summary.ApprovalsRequired,
                SignaturePresent = result.Summary.SignaturePresent,
                SignatureValid = result.Summary.SignatureValid,
                SignerId = result.Summary.SignerId
            },
            Checks = new CliChecks
            {
                SchemaValid = result.Checks.SchemaValid,
                ArtifactsValid = result.Checks.ArtifactsValid,
                EvidenceValid = result.Checks.EvidenceValid,
                PathsValid = result.Checks.PathsValid
            },
            Errors = result.Errors.Select(e => new CliError
            {
                Code = e.Code,
                Message = e.Message,
                Path = e.Path,
                Expected = e.Expected,
                Actual = e.Actual
            }).ToList(),
            Warnings = result.Warnings.ToList(),
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        var json = JsonSerializer.Serialize(output, JsonOutputOptions);
        Console.WriteLine(json);
    }

    private static void OutputErrorJson(string packagePath, string message)
    {
        var output = new CliVerifyOutput
        {
            Status = VerificationStatus.FAIL_SCHEMA.ToString(),
            ExitCode = (int)VerificationStatus.FAIL_SCHEMA,
            PackagePath = packagePath,
            PackageDigest = null,
            ManifestDigest = null,
            Summary = new CliSummary
            {
                ArtifactsCount = 0,
                EvidenceCount = 0,
                ApprovalsValid = 0,
                ApprovalsRequired = 0,
                SignaturePresent = false,
                SignatureValid = false,
                SignerId = null
            },
            Checks = new CliChecks
            {
                SchemaValid = false,
                ArtifactsValid = false,
                EvidenceValid = false,
                PathsValid = false
            },
            Errors = new List<CliError>
            {
                new()
                {
                    Code = ErrorCode.SCHEMA_INVALID,
                    Message = message
                }
            },
            Warnings = new List<string>(),
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        var json = JsonSerializer.Serialize(output, JsonOutputOptions);
        Console.WriteLine(json);
    }

    private static void OutputResultHuman(VerificationResult result)
    {
        var statusColor = result.Status switch
        {
            VerificationStatus.OK_VERIFIED => ConsoleColor.Green,
            VerificationStatus.OK_UNSIGNED => ConsoleColor.Yellow,
            _ => ConsoleColor.Red
        };

        WriteColored($"Status: {result.Status}", statusColor);
        Console.WriteLine($"Exit Code: {result.ExitCode}");
        Console.WriteLine($"Package: {result.PackagePath}");
        Console.WriteLine();

        Console.WriteLine("Summary:");
        Console.WriteLine($"  Artifacts: {result.Summary.ArtifactsCount}");
        Console.WriteLine($"  Evidence: {result.Summary.EvidenceCount}");
        Console.WriteLine($"  Approvals: {result.Summary.ApprovalsValid}/{result.Summary.ApprovalsRequired}");
        Console.WriteLine($"  Signature: {(result.Summary.SignaturePresent ? (result.Summary.SignatureValid ? "Valid" : "Invalid") : "None")}");

        if (result.Summary.SignerId is not null)
        {
            Console.WriteLine($"  Signer: {result.Summary.SignerId}");
        }

        if (result.Errors.Count > 0)
        {
            Console.WriteLine();
            Console.WriteLine("Errors:");
            foreach (var error in result.Errors)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.Write($"  [{error.Code}] ");
                Console.ResetColor();
                Console.WriteLine(error.Message);
                if (error.Path is not null)
                    Console.WriteLine($"    Path: {error.Path}");
                if (error.Expected is not null && error.Actual is not null)
                    Console.WriteLine($"    Expected: {error.Expected}, Actual: {error.Actual}");
            }
        }

        if (result.Warnings.Count > 0)
        {
            Console.WriteLine();
            Console.WriteLine("Warnings:");
            foreach (var warning in result.Warnings)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"  {warning}");
                Console.ResetColor();
            }
        }
    }

    private static void WriteColored(string text, ConsoleColor color)
    {
        Console.ForegroundColor = color;
        Console.WriteLine(text);
        Console.ResetColor();
    }

    // DTO classes for JSON output (matches CLI output schema)

    private sealed class CliVerifyOutput
    {
        public required string Status { get; init; }
        public required int ExitCode { get; init; }
        public required string PackagePath { get; init; }
        public string? PackageDigest { get; init; }
        public string? ManifestDigest { get; init; }
        public required CliSummary Summary { get; init; }
        public CliChecks? Checks { get; init; }
        public List<CliError>? Errors { get; init; }
        public List<string>? Warnings { get; init; }
        public string? Timestamp { get; init; }
    }

    private sealed class CliSummary
    {
        public int ArtifactsCount { get; init; }
        public int EvidenceCount { get; init; }
        public int ApprovalsValid { get; init; }
        public int ApprovalsRequired { get; init; }
        public bool SignaturePresent { get; init; }
        public bool SignatureValid { get; init; }
        public string? SignerId { get; init; }
    }

    private sealed class CliChecks
    {
        public bool SchemaValid { get; init; }
        public bool ArtifactsValid { get; init; }
        public bool EvidenceValid { get; init; }
        public bool PathsValid { get; init; }
    }

    private sealed class CliError
    {
        public required string Code { get; init; }
        public required string Message { get; init; }
        public string? Path { get; init; }
        public string? Expected { get; init; }
        public string? Actual { get; init; }
    }
}
