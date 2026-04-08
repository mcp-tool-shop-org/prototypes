using System.Text.Json.Serialization;

namespace CodeTeam.Core;

/// <summary>
/// Verification policy for multi-signer quorum semantics.
///
/// A package is verified when ALL requirements are satisfied.
/// Each requirement filters candidates by purpose/role/allowlist,
/// then counts distinct signers against a threshold.
/// </summary>
public sealed record VerificationPolicy
{
    /// <summary>
    /// Policy version
    /// </summary>
    [JsonPropertyName("version")]
    public string Version { get; init; } = "0.1";

    /// <summary>
    /// List of requirements that must ALL be satisfied
    /// </summary>
    [JsonPropertyName("requirements")]
    public IReadOnlyList<PolicyRequirement> Requirements { get; init; } = Array.Empty<PolicyRequirement>();

    /// <summary>
    /// Create a default policy from legacy required_approvals + approver_keys.
    /// This provides backward compatibility with Phase 1/2 manifests.
    /// </summary>
    public static VerificationPolicy FromLegacy(int requiredApprovals, IReadOnlyList<AuthorizedKey> authorizedKeys)
    {
        var requirements = new List<PolicyRequirement>();

        // If approvals are required, add an approval requirement
        if (requiredApprovals > 0)
        {
            requirements.Add(new PolicyRequirement
            {
                Purpose = "codeteam.approval",
                Threshold = requiredApprovals,
                Allow = new AllowConstraints
                {
                    KeyIds = authorizedKeys.Select(k => k.Id).ToList()
                },
                DistinctBy = new[] { "key_id" }
            });
        }

        // Always require at least one signature for OK_VERIFIED
        requirements.Add(new PolicyRequirement
        {
            Purpose = "codeteam.package_attestation",
            Threshold = 1,
            Allow = new AllowConstraints
            {
                KeyIds = authorizedKeys.Select(k => k.Id).ToList()
            },
            DistinctBy = new[] { "key_id" }
        });

        return new VerificationPolicy
        {
            Version = "0.1",
            Requirements = requirements
        };
    }

    /// <summary>
    /// Create a simple policy requiring N signatures from allowed keys.
    /// </summary>
    public static VerificationPolicy RequireSignatures(int threshold, IEnumerable<string> allowedKeyIds)
    {
        return new VerificationPolicy
        {
            Version = "0.1",
            Requirements = new[]
            {
                new PolicyRequirement
                {
                    Purpose = "codeteam.package_attestation",
                    Threshold = threshold,
                    Allow = new AllowConstraints
                    {
                        KeyIds = allowedKeyIds.ToList()
                    },
                    DistinctBy = new[] { "key_id" }
                }
            }
        };
    }
}

/// <summary>
/// A single requirement in a verification policy.
/// </summary>
public sealed record PolicyRequirement
{
    /// <summary>
    /// Purpose filter: only signatures/approvals with this purpose count.
    /// Values: "codeteam.package_attestation", "codeteam.approval"
    /// </summary>
    [JsonPropertyName("purpose")]
    public required string Purpose { get; init; }

    /// <summary>
    /// Minimum number of distinct signers required.
    /// </summary>
    [JsonPropertyName("threshold")]
    public required int Threshold { get; init; }

    /// <summary>
    /// Allowlist constraints. If specified, only matching keys count.
    /// </summary>
    [JsonPropertyName("allow")]
    public AllowConstraints? Allow { get; init; }

    /// <summary>
    /// Fields to use for deduplication. Default: ["key_id"]
    /// Only distinct values count toward threshold.
    /// </summary>
    [JsonPropertyName("distinct_by")]
    public IReadOnlyList<string> DistinctBy { get; init; } = new[] { "key_id" };

    /// <summary>
    /// Optional role filter. If specified, only signatures with matching role count.
    /// </summary>
    [JsonPropertyName("roles")]
    public IReadOnlyList<string>? Roles { get; init; }
}

/// <summary>
/// Allowlist constraints for a requirement.
/// </summary>
public sealed record AllowConstraints
{
    /// <summary>
    /// Allowed key IDs. Empty or null means all authorized keys are allowed.
    /// </summary>
    [JsonPropertyName("key_ids")]
    public IReadOnlyList<string>? KeyIds { get; init; }

    /// <summary>
    /// Allowed roles. Empty or null means all roles are allowed.
    /// </summary>
    [JsonPropertyName("roles")]
    public IReadOnlyList<string>? Roles { get; init; }
}

/// <summary>
/// Result of evaluating a single policy requirement.
/// </summary>
public sealed record RequirementResult
{
    /// <summary>
    /// Whether the requirement is satisfied
    /// </summary>
    public required bool Satisfied { get; init; }

    /// <summary>
    /// Number of distinct signers that matched
    /// </summary>
    public required int MatchCount { get; init; }

    /// <summary>
    /// Required threshold
    /// </summary>
    public required int Threshold { get; init; }

    /// <summary>
    /// The requirement that was evaluated
    /// </summary>
    public required PolicyRequirement Requirement { get; init; }

    /// <summary>
    /// Key IDs that matched and counted toward the threshold
    /// </summary>
    public required IReadOnlyList<string> MatchedKeyIds { get; init; }

    /// <summary>
    /// Key IDs that were rejected (not allowed, wrong purpose, etc.)
    /// </summary>
    public required IReadOnlyList<string> RejectedKeyIds { get; init; }
}

/// <summary>
/// Result of evaluating the complete verification policy.
/// </summary>
public sealed record PolicyResult
{
    /// <summary>
    /// Whether the entire policy is satisfied (all requirements met)
    /// </summary>
    public required bool Satisfied { get; init; }

    /// <summary>
    /// Results for each individual requirement
    /// </summary>
    public required IReadOnlyList<RequirementResult> RequirementResults { get; init; }

    /// <summary>
    /// Error codes for unsatisfied requirements
    /// </summary>
    public required IReadOnlyList<string> ErrorCodes { get; init; }
}
