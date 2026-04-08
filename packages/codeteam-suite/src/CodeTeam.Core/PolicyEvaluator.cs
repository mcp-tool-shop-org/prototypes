namespace CodeTeam.Core;

/// <summary>
/// Evaluates verification policies against signatures and approvals.
///
/// Algorithm per Quorum Semantics v0.1:
/// 1. For each requirement:
///    a. Filter candidates by purpose, role, allowlist
///    b. Verify cryptographic validity (if enabled)
///    c. Deduplicate by distinct_by keys (default: key_id)
///    d. Count distinct signers
///    e. Compare to threshold
/// 2. Policy is satisfied if ALL requirements are satisfied.
/// </summary>
public sealed class PolicyEvaluator
{
    private readonly VerifierOptions _options;
    private readonly Dictionary<string, AuthorizedKey> _authorizedKeys;

    public PolicyEvaluator(VerifierOptions options, IEnumerable<AuthorizedKey> authorizedKeys)
    {
        _options = options;
        _authorizedKeys = authorizedKeys.ToDictionary(k => k.Id, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Evaluate a policy against the provided signatures and approvals.
    /// </summary>
    public PolicyResult Evaluate(
        VerificationPolicy policy,
        string packageDigest,
        IReadOnlyList<SignatureCandidate> signatures,
        IReadOnlyList<ApprovalCandidate> approvals)
    {
        var requirementResults = new List<RequirementResult>();
        var errorCodes = new List<string>();
        var allSatisfied = true;

        foreach (var requirement in policy.Requirements)
        {
            var result = EvaluateRequirement(requirement, packageDigest, signatures, approvals);
            requirementResults.Add(result);

            if (!result.Satisfied)
            {
                allSatisfied = false;

                // Map to appropriate error code
                var errorCode = requirement.Purpose switch
                {
                    "codeteam.approval" => "APPROVAL_QUORUM_NOT_MET",
                    "codeteam.package_attestation" => "SIGNATURE_QUORUM_NOT_MET",
                    _ => "REQUIREMENT_NOT_MET"
                };
                errorCodes.Add(errorCode);
            }
        }

        return new PolicyResult
        {
            Satisfied = allSatisfied,
            RequirementResults = requirementResults,
            ErrorCodes = errorCodes
        };
    }

    private RequirementResult EvaluateRequirement(
        PolicyRequirement requirement,
        string packageDigest,
        IReadOnlyList<SignatureCandidate> signatures,
        IReadOnlyList<ApprovalCandidate> approvals)
    {
        var matchedKeyIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var rejectedKeyIds = new List<string>();

        // Choose candidates based on purpose
        if (requirement.Purpose == "codeteam.approval")
        {
            EvaluateApprovals(requirement, packageDigest, approvals, matchedKeyIds, rejectedKeyIds);
        }
        else if (requirement.Purpose == "codeteam.package_attestation")
        {
            EvaluateSignatures(requirement, packageDigest, signatures, matchedKeyIds, rejectedKeyIds);
        }

        return new RequirementResult
        {
            Satisfied = matchedKeyIds.Count >= requirement.Threshold,
            MatchCount = matchedKeyIds.Count,
            Threshold = requirement.Threshold,
            Requirement = requirement,
            MatchedKeyIds = matchedKeyIds.ToList(),
            RejectedKeyIds = rejectedKeyIds
        };
    }

    private void EvaluateApprovals(
        PolicyRequirement requirement,
        string packageDigest,
        IReadOnlyList<ApprovalCandidate> approvals,
        HashSet<string> matchedKeyIds,
        List<string> rejectedKeyIds)
    {
        foreach (var approval in approvals)
        {
            // Check package digest match
            if (!string.Equals(approval.PackageDigest, packageDigest, StringComparison.OrdinalIgnoreCase))
            {
                rejectedKeyIds.Add($"{approval.KeyId}:digest_mismatch");
                continue;
            }

            // Check purpose match
            if (!string.Equals(approval.Purpose, requirement.Purpose, StringComparison.OrdinalIgnoreCase))
            {
                rejectedKeyIds.Add($"{approval.KeyId}:purpose_mismatch");
                continue;
            }

            // Check allowlist
            if (requirement.Allow?.KeyIds is { Count: > 0 } allowedKeyIds)
            {
                if (!allowedKeyIds.Any(k => string.Equals(k, approval.KeyId, StringComparison.OrdinalIgnoreCase)))
                {
                    rejectedKeyIds.Add($"{approval.KeyId}:not_in_allowlist");
                    continue;
                }
            }

            // Check role constraint
            if (requirement.Roles is { Count: > 0 } allowedRoles)
            {
                if (!allowedRoles.Any(r => string.Equals(r, approval.Role, StringComparison.OrdinalIgnoreCase)))
                {
                    rejectedKeyIds.Add($"{approval.KeyId}:role_mismatch");
                    continue;
                }
            }

            // Check if key is authorized
            if (!_authorizedKeys.TryGetValue(approval.KeyId, out var key))
            {
                rejectedKeyIds.Add($"{approval.KeyId}:not_authorized");
                continue;
            }

            // Verify cryptographically if enabled
            if (_options.VerifySignatures && _options.SignatureVerifier is not null)
            {
                var signableBytes = SignablePayloadBuilder.GetSignableBytes(
                    SignablePayloadBuilder.ForApproval(approval.PackageDigest, approval.Role));

                if (!_options.SignatureVerifier(key.PublicKey, signableBytes, approval.Signature))
                {
                    rejectedKeyIds.Add($"{approval.KeyId}:signature_invalid");
                    continue;
                }
            }

            // Add to matched (deduplicate by key_id)
            matchedKeyIds.Add(approval.KeyId);
        }
    }

    private void EvaluateSignatures(
        PolicyRequirement requirement,
        string packageDigest,
        IReadOnlyList<SignatureCandidate> signatures,
        HashSet<string> matchedKeyIds,
        List<string> rejectedKeyIds)
    {
        foreach (var signature in signatures)
        {
            // Check package digest match
            if (!string.Equals(signature.PackageDigest, packageDigest, StringComparison.OrdinalIgnoreCase))
            {
                rejectedKeyIds.Add($"{signature.KeyId}:digest_mismatch");
                continue;
            }

            // Check purpose match
            if (!string.Equals(signature.Purpose, requirement.Purpose, StringComparison.OrdinalIgnoreCase))
            {
                rejectedKeyIds.Add($"{signature.KeyId}:purpose_mismatch");
                continue;
            }

            // Check allowlist
            if (requirement.Allow?.KeyIds is { Count: > 0 } allowedKeyIds)
            {
                if (!allowedKeyIds.Any(k => string.Equals(k, signature.KeyId, StringComparison.OrdinalIgnoreCase)))
                {
                    rejectedKeyIds.Add($"{signature.KeyId}:not_in_allowlist");
                    continue;
                }
            }

            // Check role constraint
            if (requirement.Roles is { Count: > 0 } allowedRoles)
            {
                if (!allowedRoles.Any(r => string.Equals(r, signature.Role, StringComparison.OrdinalIgnoreCase)))
                {
                    rejectedKeyIds.Add($"{signature.KeyId}:role_mismatch");
                    continue;
                }
            }

            // Check if key is authorized
            if (!_authorizedKeys.TryGetValue(signature.KeyId, out var key))
            {
                rejectedKeyIds.Add($"{signature.KeyId}:not_authorized");
                continue;
            }

            // Verify cryptographically if enabled
            if (_options.VerifySignatures && _options.SignatureVerifier is not null)
            {
                var signableBytes = SignablePayloadBuilder.GetSignableBytes(
                    SignablePayloadBuilder.ForPackageAttestation(signature.PackageDigest, signature.Role));

                if (!_options.SignatureVerifier(key.PublicKey, signableBytes, signature.Signature))
                {
                    rejectedKeyIds.Add($"{signature.KeyId}:signature_invalid");
                    continue;
                }
            }

            // Add to matched (deduplicate by key_id)
            matchedKeyIds.Add(signature.KeyId);
        }
    }
}

/// <summary>
/// Candidate signature for policy evaluation.
/// </summary>
public sealed record SignatureCandidate
{
    public required string KeyId { get; init; }
    public required string PackageDigest { get; init; }
    public required string Purpose { get; init; }
    public required string Role { get; init; }
    public required string Signature { get; init; }
}

/// <summary>
/// Candidate approval for policy evaluation.
/// </summary>
public sealed record ApprovalCandidate
{
    public required string KeyId { get; init; }
    public required string PackageDigest { get; init; }
    public required string Purpose { get; init; }
    public required string Role { get; init; }
    public required string Signature { get; init; }
}
