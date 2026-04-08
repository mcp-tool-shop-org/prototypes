using System.Text;

namespace CodeTeam.Core;

/// <summary>
/// Core verification engine per VERIFICATION.md v0.1.
///
/// This is a pure function: takes loaded package data, returns verification result.
/// No I/O operations - all file reading done before calling this.
/// </summary>
public static class Verifier
{
    /// <summary>
    /// Supported schema version
    /// </summary>
    public const string SupportedSchemaVersion = "0.1";

    /// <summary>
    /// Verify a loaded package according to VERIFICATION.md rules.
    /// Uses default options (no cryptographic signature verification).
    /// </summary>
    public static VerificationResult Verify(VerificationInput input)
    {
        return Verify(input, VerifierOptions.Default);
    }

    /// <summary>
    /// Verify a loaded package with specified options.
    /// </summary>
    public static VerificationResult Verify(VerificationInput input, VerifierOptions options)
    {
        // Use quorum-based verification if enabled
        if (options.UseQuorumPolicy)
        {
            return VerifyWithQuorum(input, options);
        }

        return VerifyLegacy(input, options);
    }

    /// <summary>
    /// Legacy verification path (single signer, threshold-based).
    /// </summary>
    private static VerificationResult VerifyLegacy(VerificationInput input, VerifierOptions options)
    {
        var errors = new List<VerificationError>();
        var warnings = new List<string>();

        // Phase 1: Schema Validation
        if (input.Manifest is null)
        {
            errors.Add(new VerificationError
            {
                Code = ErrorCode.SCHEMA_INVALID,
                Message = "Manifest could not be parsed or is missing required fields",
                Path = "codeteam.manifest.json"
            });

            return BuildResult(
                VerificationStatus.FAIL_SCHEMA,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: EmptySummary(),
                checks: FailedSchemaChecks(),
                errors,
                warnings);
        }

        // Validate schema version
        if (input.Manifest.SchemaVersion != SupportedSchemaVersion)
        {
            errors.Add(new VerificationError
            {
                Code = ErrorCode.SCHEMA_INVALID,
                Message = $"Unsupported schema version: {input.Manifest.SchemaVersion}",
                Path = "codeteam.manifest.json",
                Expected = SupportedSchemaVersion,
                Actual = input.Manifest.SchemaVersion
            });

            return BuildResult(
                VerificationStatus.FAIL_SCHEMA,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: EmptySummary(),
                checks: FailedSchemaChecks(),
                errors,
                warnings);
        }

        // Phase 2: Integrity Verification
        var integrityResult = VerifyIntegrity(input, errors);
        if (!integrityResult.Success)
        {
            return BuildResult(
                VerificationStatus.FAIL_INTEGRITY,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: BuildSummary(input, validApprovals: 0, signaturePresent: false, signatureValid: false, signerId: null),
                checks: FailedIntegrityChecks(integrityResult),
                errors,
                warnings);
        }

        // Compute package digest (for approval/signature verification)
        var manifestDigest = ComputeManifestDigest(input.ManifestJson);
        var packageDigest = manifestDigest;

        // Build authorized keys lookup
        var authorizedKeys = input.Manifest.Policy.AuthorizedKeys
            .ToDictionary(k => k.Id, k => k, StringComparer.OrdinalIgnoreCase);
        var authorizedKeyIds = authorizedKeys.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Phase 3: Approval Verification
        var validApprovals = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var approval in input.Approvals)
        {
            // Skip if type is not "approval"
            if (!string.Equals(approval.Type, "approval", StringComparison.OrdinalIgnoreCase))
                continue;

            // Check if approver is authorized
            if (!authorizedKeyIds.Contains(approval.ApproverId))
            {
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.ACTOR_NOT_AUTHORIZED,
                    Message = $"Approver '{approval.ApproverId}' is not in authorized keys",
                    Path = "signatures/approvals.jsonl"
                });

                return BuildResult(
                    VerificationStatus.FAIL_UNAUTHORIZED,
                    input.PackagePath,
                    packageDigest,
                    manifestDigest,
                    summary: BuildSummary(input, validApprovals.Count, signaturePresent: false, signatureValid: false, signerId: null),
                    checks: PassingChecks(),
                    errors,
                    warnings);
            }

            // Verify approval signature cryptographically if enabled
            // Legacy path uses legacy signable format: "codeteam:approval:v0.1:{digest}:{approver_id}"
            if (options.VerifySignatures && options.SignatureVerifier is not null)
            {
                var signable = SignableBytesResolver.GetLegacyApprovalBytes(approval.PackageDigest, approval.ApproverId);
                var key = authorizedKeys[approval.ApproverId];

                if (!options.SignatureVerifier(key.PublicKey, signable, approval.Signature))
                {
                    errors.Add(new VerificationError
                    {
                        Code = ErrorCode.SIGNATURE_INVALID,
                        Message = $"Approval signature cryptographically invalid for approver '{approval.ApproverId}'",
                        Path = "signatures/approvals.jsonl"
                    });

                    return BuildResult(
                        VerificationStatus.FAIL_SIGNATURE,
                        input.PackagePath,
                        packageDigest,
                        manifestDigest,
                        summary: BuildSummary(input, validApprovals.Count, signaturePresent: false, signatureValid: false, signerId: null),
                        checks: PassingChecks(),
                        errors,
                        warnings);
                }
            }

            // Add to valid approvals (deduplicate by approver ID)
            validApprovals.Add(approval.ApproverId);
        }

        // Phase 4: Signature Verification
        if (input.Signatures.Count == 0)
        {
            return BuildResult(
                VerificationStatus.OK_UNSIGNED,
                input.PackagePath,
                packageDigest,
                manifestDigest,
                summary: BuildSummary(input, validApprovals.Count, signaturePresent: false, signatureValid: false, signerId: null),
                checks: PassingChecks(),
                errors,
                warnings);
        }

        // Check threshold before accepting signature
        if (validApprovals.Count < input.Manifest.Policy.RequiredApprovals)
        {
            errors.Add(new VerificationError
            {
                Code = ErrorCode.THRESHOLD_NOT_MET,
                Message = $"Approval threshold not met: {validApprovals.Count}/{input.Manifest.Policy.RequiredApprovals}",
                Expected = input.Manifest.Policy.RequiredApprovals.ToString(),
                Actual = validApprovals.Count.ToString()
            });

            return BuildResult(
                VerificationStatus.FAIL_THRESHOLD,
                input.PackagePath,
                packageDigest,
                manifestDigest,
                summary: BuildSummary(input, validApprovals.Count, signaturePresent: true, signatureValid: false, signerId: null),
                checks: PassingChecks(),
                errors,
                warnings);
        }

        // Verify signature(s)
        foreach (var sig in input.Signatures)
        {
            // Skip if type is not "signature"
            if (!string.Equals(sig.Type, "signature", StringComparison.OrdinalIgnoreCase))
                continue;

            // Check if signer is authorized
            if (!authorizedKeyIds.Contains(sig.SignerId))
            {
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.ACTOR_NOT_AUTHORIZED,
                    Message = $"Signer '{sig.SignerId}' is not in authorized keys",
                    Path = "signatures/signatures.jsonl"
                });

                return BuildResult(
                    VerificationStatus.FAIL_UNAUTHORIZED,
                    input.PackagePath,
                    packageDigest,
                    manifestDigest,
                    summary: BuildSummary(input, validApprovals.Count, signaturePresent: true, signatureValid: false, signerId: sig.SignerId),
                    checks: PassingChecks(),
                    errors,
                    warnings);
            }

            // Verify final signature cryptographically if enabled
            // Legacy path uses legacy signable format: "codeteam:signature:v0.1:{digest}:{signer_id}"
            if (options.VerifySignatures && options.SignatureVerifier is not null)
            {
                var signable = SignableBytesResolver.GetLegacySignatureBytes(sig.PackageDigest, sig.SignerId);
                var key = authorizedKeys[sig.SignerId];

                if (!options.SignatureVerifier(key.PublicKey, signable, sig.Signature))
                {
                    errors.Add(new VerificationError
                    {
                        Code = ErrorCode.SIGNATURE_INVALID,
                        Message = "Final signature cryptographically invalid",
                        Path = "signatures/signatures.jsonl"
                    });

                    return BuildResult(
                        VerificationStatus.FAIL_SIGNATURE,
                        input.PackagePath,
                        packageDigest,
                        manifestDigest,
                        summary: BuildSummary(input, validApprovals.Count, signaturePresent: true, signatureValid: false, signerId: sig.SignerId),
                        checks: PassingChecks(),
                        errors,
                        warnings);
                }
            }

            // Valid signature found
            return BuildResult(
                VerificationStatus.OK_VERIFIED,
                input.PackagePath,
                packageDigest,
                manifestDigest,
                summary: BuildSummary(input, validApprovals.Count, signaturePresent: true, signatureValid: true, signerId: sig.SignerId),
                checks: PassingChecks(),
                errors,
                warnings);
        }

        // No valid signature found
        return BuildResult(
            VerificationStatus.OK_UNSIGNED,
            input.PackagePath,
            packageDigest,
            manifestDigest,
            summary: BuildSummary(input, validApprovals.Count, signaturePresent: false, signatureValid: false, signerId: null),
            checks: PassingChecks(),
            errors,
            warnings);
    }

    /// <summary>
    /// Quorum-based verification using PolicyEvaluator.
    /// Supports multi-signer policies with purpose separation.
    /// </summary>
    private static VerificationResult VerifyWithQuorum(VerificationInput input, VerifierOptions options)
    {
        var errors = new List<VerificationError>();
        var warnings = new List<string>();

        // Phase 1: Schema Validation
        if (input.Manifest is null)
        {
            errors.Add(new VerificationError
            {
                Code = ErrorCode.SCHEMA_INVALID,
                Message = "Manifest could not be parsed or is missing required fields",
                Path = "codeteam.manifest.json"
            });

            return BuildResult(
                VerificationStatus.FAIL_SCHEMA,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: EmptySummary(),
                checks: FailedSchemaChecks(),
                errors,
                warnings);
        }

        // Validate schema version
        if (input.Manifest.SchemaVersion != SupportedSchemaVersion)
        {
            errors.Add(new VerificationError
            {
                Code = ErrorCode.SCHEMA_INVALID,
                Message = $"Unsupported schema version: {input.Manifest.SchemaVersion}",
                Path = "codeteam.manifest.json",
                Expected = SupportedSchemaVersion,
                Actual = input.Manifest.SchemaVersion
            });

            return BuildResult(
                VerificationStatus.FAIL_SCHEMA,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: EmptySummary(),
                checks: FailedSchemaChecks(),
                errors,
                warnings);
        }

        // Phase 2: Integrity Verification
        var integrityResult = VerifyIntegrity(input, errors);
        if (!integrityResult.Success)
        {
            return BuildResult(
                VerificationStatus.FAIL_INTEGRITY,
                input.PackagePath,
                packageDigest: null,
                manifestDigest: null,
                summary: BuildSummary(input, validApprovals: 0, signaturePresent: false, signatureValid: false, signerId: null),
                checks: FailedIntegrityChecks(integrityResult),
                errors,
                warnings);
        }

        // Compute package digest
        var manifestDigest = ComputeManifestDigest(input.ManifestJson);
        var packageDigest = manifestDigest;

        // Get or derive policy
        var policy = options.Policy ?? VerificationPolicy.FromLegacy(
            input.Manifest.Policy.RequiredApprovals,
            input.Manifest.Policy.AuthorizedKeys);

        // Build authorized keys lookup
        var authorizedKeys = input.Manifest.Policy.AuthorizedKeys.ToList();

        // Convert input data to policy candidates
        var signatureCandidates = input.Signatures
            .Where(s => string.Equals(s.Type, "signature", StringComparison.OrdinalIgnoreCase))
            .Select(s => new SignatureCandidate
            {
                KeyId = s.SignerId,
                PackageDigest = s.PackageDigest,
                Purpose = "codeteam.package_attestation",
                Role = s.Role,
                Signature = s.Signature
            })
            .ToList();

        var approvalCandidates = input.Approvals
            .Where(a => string.Equals(a.Type, "approval", StringComparison.OrdinalIgnoreCase))
            .Select(a => new ApprovalCandidate
            {
                KeyId = a.ApproverId,
                PackageDigest = a.PackageDigest,
                Purpose = "codeteam.approval",
                Role = "reviewer", // Default role for approvals
                Signature = a.Signature
            })
            .ToList();

        // Create policy evaluator
        var evaluator = new PolicyEvaluator(options, authorizedKeys);

        // Evaluate policy
        var policyResult = evaluator.Evaluate(
            policy,
            packageDigest ?? "",
            signatureCandidates,
            approvalCandidates);

        // Collect quorum stats from attestation requirements
        var attestationRequirement = policyResult.RequirementResults
            .FirstOrDefault(r => r.Requirement.Purpose == "codeteam.package_attestation");

        var signersMatched = attestationRequirement?.MatchCount ?? 0;
        var signersRequired = attestationRequirement?.Threshold ?? 1;
        var matchedSignerIds = attestationRequirement?.MatchedKeyIds ?? Array.Empty<string>();

        // Determine result status
        if (signatureCandidates.Count == 0)
        {
            // No signatures present
            return BuildResult(
                VerificationStatus.OK_UNSIGNED,
                input.PackagePath,
                packageDigest,
                manifestDigest,
                summary: BuildSummary(
                    input,
                    validApprovals: approvalCandidates.Count,
                    signaturePresent: false,
                    signatureValid: false,
                    signerId: null,
                    signersMatched: signersMatched,
                    signersRequired: signersRequired,
                    matchedSignerIds: matchedSignerIds.ToList()),
                checks: PassingChecks(),
                errors,
                warnings);
        }

        if (policyResult.Satisfied)
        {
            // Policy fully satisfied
            return BuildResult(
                VerificationStatus.OK_VERIFIED,
                input.PackagePath,
                packageDigest,
                manifestDigest,
                summary: BuildSummary(
                    input,
                    validApprovals: approvalCandidates.Count,
                    signaturePresent: true,
                    signatureValid: true,
                    signerId: matchedSignerIds.FirstOrDefault(),
                    signersMatched: signersMatched,
                    signersRequired: signersRequired,
                    matchedSignerIds: matchedSignerIds.ToList()),
                checks: PassingChecks(),
                errors,
                warnings);
        }

        // Policy not satisfied - determine why
        foreach (var errorCode in policyResult.ErrorCodes)
        {
            errors.Add(new VerificationError
            {
                Code = errorCode,
                Message = GetQuorumErrorMessage(errorCode, policyResult),
            });
        }

        // Return OK_UNSIGNED (policy not met is not a failure per spec)
        return BuildResult(
            VerificationStatus.OK_UNSIGNED,
            input.PackagePath,
            packageDigest,
            manifestDigest,
            summary: BuildSummary(
                input,
                validApprovals: approvalCandidates.Count,
                signaturePresent: signatureCandidates.Count > 0,
                signatureValid: false,
                signerId: null,
                signersMatched: signersMatched,
                signersRequired: signersRequired,
                matchedSignerIds: matchedSignerIds.ToList()),
            checks: PassingChecks(),
            errors,
            warnings);
    }

    private static string GetQuorumErrorMessage(string errorCode, PolicyResult result)
    {
        return errorCode switch
        {
            ErrorCode.SIGNATURE_QUORUM_NOT_MET => $"Signature quorum not met: {GetQuorumStats(result, "codeteam.package_attestation")}",
            ErrorCode.APPROVAL_QUORUM_NOT_MET => $"Approval quorum not met: {GetQuorumStats(result, "codeteam.approval")}",
            _ => $"Policy requirement not satisfied: {errorCode}"
        };
    }

    private static string GetQuorumStats(PolicyResult result, string purpose)
    {
        var req = result.RequirementResults.FirstOrDefault(r => r.Requirement.Purpose == purpose);
        if (req == null) return "N/A";
        return $"{req.MatchCount}/{req.Threshold} signers";
    }

    /// <summary>
    /// Create signable bytes for an approval using the SignableBytesResolver.
    /// Delegates to the resolver to support both legacy and envelope formats.
    /// </summary>
    public static byte[] CreateApprovalSignableBytes(string packageDigest, string approverId, string role = "reviewer")
    {
        // Use envelope format for new approvals (canonical JSON)
        return SignableBytesResolver.GetEnvelopeApprovalBytes(packageDigest, role);
    }

    /// <summary>
    /// Create signable bytes for a signature using the SignableBytesResolver.
    /// Delegates to the resolver to support both legacy and envelope formats.
    /// </summary>
    public static byte[] CreateSignatureSignableBytes(string packageDigest, string signerId, string role = "release-signer")
    {
        // Use envelope format for new signatures (canonical JSON)
        return SignableBytesResolver.GetEnvelopeSignatureBytes(packageDigest, role);
    }

    /// <summary>
    /// Create legacy format signable bytes for an approval.
    /// Format: "codeteam:approval:v0.1:{package_digest}:{approver_id}"
    /// </summary>
    public static byte[] CreateLegacyApprovalSignableBytes(string packageDigest, string approverId)
    {
        return SignableBytesResolver.GetLegacyApprovalBytes(packageDigest, approverId);
    }

    /// <summary>
    /// Create legacy format signable bytes for a signature.
    /// Format: "codeteam:signature:v0.1:{package_digest}:{signer_id}"
    /// </summary>
    public static byte[] CreateLegacySignatureSignableBytes(string packageDigest, string signerId)
    {
        return SignableBytesResolver.GetLegacySignatureBytes(packageDigest, signerId);
    }

    private record IntegrityResult(bool Success, bool ArtifactsValid, bool EvidenceValid, bool PathsValid);

    private static IntegrityResult VerifyIntegrity(VerificationInput input, List<VerificationError> errors)
    {
        var manifest = input.Manifest!;
        var artifactsValid = true;
        var evidenceValid = true;
        var pathsValid = true;

        foreach (var artifact in manifest.Artifacts)
        {
            if (!IsValidPath(artifact.Path))
            {
                pathsValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.SCHEMA_INVALID,
                    Message = $"Invalid artifact path: {artifact.Path}",
                    Path = artifact.Path
                });
                continue;
            }

            if (!input.ArtifactFiles.TryGetValue(artifact.Path, out var fileInfo) || !fileInfo.Exists)
            {
                artifactsValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.MISSING_FILE,
                    Message = $"Artifact file not found: {artifact.Path}",
                    Path = artifact.Path
                });
                continue;
            }

            if (fileInfo.SizeBytes != artifact.ExpectedSize)
            {
                artifactsValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.SIZE_MISMATCH,
                    Message = $"Artifact size mismatch: {artifact.Path}",
                    Path = artifact.Path,
                    Expected = artifact.ExpectedSize.ToString(),
                    Actual = fileInfo.SizeBytes.ToString()
                });
                continue;
            }

            if (!DigestsEqual(artifact.ExpectedDigest, fileInfo.ActualDigest))
            {
                artifactsValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.DIGEST_MISMATCH,
                    Message = $"Artifact digest mismatch: {artifact.Path}",
                    Path = artifact.Path,
                    Expected = artifact.ExpectedDigest,
                    Actual = fileInfo.ActualDigest
                });
                continue;
            }
        }

        foreach (var evidence in manifest.Evidence)
        {
            if (!IsValidPath(evidence.Path))
            {
                pathsValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.SCHEMA_INVALID,
                    Message = $"Invalid evidence path: {evidence.Path}",
                    Path = evidence.Path
                });
                continue;
            }

            if (!input.EvidenceFiles.TryGetValue(evidence.Path, out var fileInfo) || !fileInfo.Exists)
            {
                evidenceValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.MISSING_FILE,
                    Message = $"Evidence file not found: {evidence.Path}",
                    Path = evidence.Path
                });
                continue;
            }

            if (fileInfo.SizeBytes != evidence.ExpectedSize)
            {
                evidenceValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.SIZE_MISMATCH,
                    Message = $"Evidence size mismatch: {evidence.Path}",
                    Path = evidence.Path,
                    Expected = evidence.ExpectedSize.ToString(),
                    Actual = fileInfo.SizeBytes.ToString()
                });
                continue;
            }

            if (!DigestsEqual(evidence.ExpectedDigest, fileInfo.ActualDigest))
            {
                evidenceValid = false;
                errors.Add(new VerificationError
                {
                    Code = ErrorCode.DIGEST_MISMATCH,
                    Message = $"Evidence digest mismatch: {evidence.Path}",
                    Path = evidence.Path,
                    Expected = evidence.ExpectedDigest,
                    Actual = fileInfo.ActualDigest
                });
                continue;
            }
        }

        return new IntegrityResult(
            Success: artifactsValid && evidenceValid && pathsValid && errors.Count == 0,
            ArtifactsValid: artifactsValid,
            EvidenceValid: evidenceValid,
            PathsValid: pathsValid);
    }

    private static bool IsValidPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;

        if (path.StartsWith('/') || (path.Length >= 2 && path[1] == ':'))
            return false;

        if (path.Contains(".."))
            return false;

        return true;
    }

    private static bool DigestsEqual(string expected, string actual)
    {
        return string.Equals(expected, actual, StringComparison.OrdinalIgnoreCase);
    }

    private static string? ComputeManifestDigest(string? manifestJson)
    {
        if (string.IsNullOrEmpty(manifestJson))
            return null;

        var bytes = Encoding.UTF8.GetBytes(manifestJson);
        var hash = System.Security.Cryptography.SHA256.HashData(bytes);
        return "sha256:" + Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static VerificationSummary EmptySummary() => new()
    {
        ArtifactsCount = 0,
        EvidenceCount = 0,
        ApprovalsValid = 0,
        ApprovalsRequired = 0,
        SignaturePresent = false,
        SignatureValid = false,
        SignerId = null
    };

    private static VerificationSummary BuildSummary(
        VerificationInput input,
        int validApprovals,
        bool signaturePresent,
        bool signatureValid,
        string? signerId,
        int signersMatched = 0,
        int signersRequired = 0,
        IReadOnlyList<string>? matchedSignerIds = null) => new()
    {
        ArtifactsCount = input.Manifest?.Artifacts.Count ?? 0,
        EvidenceCount = input.Manifest?.Evidence.Count ?? 0,
        ApprovalsValid = validApprovals,
        ApprovalsRequired = input.Manifest?.Policy.RequiredApprovals ?? 0,
        SignaturePresent = signaturePresent,
        SignatureValid = signatureValid,
        SignerId = signerId,
        SignersMatched = signersMatched,
        SignersRequired = signersRequired,
        MatchedSignerIds = matchedSignerIds
    };

    private static VerificationChecks FailedSchemaChecks() => new()
    {
        SchemaValid = false,
        ArtifactsValid = false,
        EvidenceValid = false,
        PathsValid = false
    };

    private static VerificationChecks FailedIntegrityChecks(IntegrityResult result) => new()
    {
        SchemaValid = true,
        ArtifactsValid = result.ArtifactsValid,
        EvidenceValid = result.EvidenceValid,
        PathsValid = result.PathsValid
    };

    private static VerificationChecks PassingChecks() => new()
    {
        SchemaValid = true,
        ArtifactsValid = true,
        EvidenceValid = true,
        PathsValid = true
    };

    private static VerificationResult BuildResult(
        VerificationStatus status,
        string packagePath,
        string? packageDigest,
        string? manifestDigest,
        VerificationSummary summary,
        VerificationChecks checks,
        List<VerificationError> errors,
        List<string> warnings) => new()
    {
        Status = status,
        PackagePath = packagePath,
        PackageDigest = packageDigest,
        ManifestDigest = manifestDigest,
        Summary = summary,
        Checks = checks,
        Errors = errors,
        Warnings = warnings
    };
}
