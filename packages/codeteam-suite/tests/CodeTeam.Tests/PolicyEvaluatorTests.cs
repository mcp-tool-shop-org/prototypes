using System.Security.Cryptography;
using System.Text;
using CodeTeam.Core;
using CodeTeam.Crypto;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests for multi-signer quorum policy evaluation.
/// </summary>
public class PolicyEvaluatorTests
{
    private readonly KeyFileData _key1;
    private readonly KeyFileData _key2;
    private readonly KeyFileData _key3;
    private readonly List<AuthorizedKey> _authorizedKeys;
    private const string TestPackageDigest = "sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1";

    public PolicyEvaluatorTests()
    {
        // Generate deterministic test keys
        _key1 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("test-key-1")));
        _key2 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("test-key-2")));
        _key3 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("test-key-3")));

        _authorizedKeys = new List<AuthorizedKey>
        {
            new() { Id = _key1.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key1) },
            new() { Id = _key2.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key2) },
            new() { Id = _key3.Kid, Algorithm = "ed25519", PublicKey = KeyFile.GetPublicKeyBase64(_key3) }
        };
    }

    #region Basic Threshold Tests

    [Fact]
    public void Evaluate_SingleSignatureThreshold1_ShouldPass()
    {
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeTrue();
        result.RequirementResults.Should().HaveCount(1);
        result.RequirementResults[0].MatchCount.Should().Be(1);
    }

    [Fact]
    public void Evaluate_TwoSignaturesThreshold2_ShouldPass()
    {
        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest),
            CreateSignature(_key2, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeTrue();
        result.RequirementResults[0].MatchCount.Should().Be(2);
        result.RequirementResults[0].MatchedKeyIds.Should().Contain(_key1.Kid);
        result.RequirementResults[0].MatchedKeyIds.Should().Contain(_key2.Kid);
    }

    [Fact]
    public void Evaluate_OneSignatureThreshold2_ShouldFail()
    {
        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.ErrorCodes.Should().Contain("SIGNATURE_QUORUM_NOT_MET");
        result.RequirementResults[0].MatchCount.Should().Be(1);
        result.RequirementResults[0].Threshold.Should().Be(2);
    }

    [Fact]
    public void Evaluate_NoSignaturesThreshold1_ShouldFail()
    {
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var result = evaluator.Evaluate(policy, TestPackageDigest, Array.Empty<SignatureCandidate>(), Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.ErrorCodes.Should().Contain("SIGNATURE_QUORUM_NOT_MET");
    }

    #endregion

    #region Duplicate Signer Tests

    [Fact]
    public void Evaluate_SameKeyIdTwice_ShouldCountOnlyOnce()
    {
        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        // Same key signs twice - should only count once
        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest, "signer-1"),
            CreateSignature(_key1, TestPackageDigest, "signer-2") // Duplicate key_id
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse("duplicate signer should only count once");
        result.RequirementResults[0].MatchCount.Should().Be(1);
        result.RequirementResults[0].MatchedKeyIds.Should().HaveCount(1);
    }

    [Fact]
    public void Evaluate_TwoDistinctKeys_ShouldCountBoth()
    {
        var policy = VerificationPolicy.RequireSignatures(2, new[] { _key1.Kid, _key2.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest),
            CreateSignature(_key2, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeTrue();
        result.RequirementResults[0].MatchCount.Should().Be(2);
    }

    #endregion

    #region Allowlist Tests

    [Fact]
    public void Evaluate_KeyNotInAllowlist_ShouldBeRejected()
    {
        // Only key1 is allowed, but key2 signs
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key2, TestPackageDigest) // key2 not in allowlist
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.RequirementResults[0].RejectedKeyIds.Should().Contain(k => k.Contains("not_in_allowlist"));
    }

    [Fact]
    public void Evaluate_KeyInAllowlist_ShouldBeAccepted()
    {
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid, _key2.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key2, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_KeyNotAuthorized_ShouldBeRejected()
    {
        // Key4 is not in authorized keys at all
        var key4 = KeyFile.GenerateFromSeed(SHA256.HashData(Encoding.UTF8.GetBytes("test-key-4")));
        var policy = VerificationPolicy.RequireSignatures(1, new[] { key4.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(key4, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.RequirementResults[0].RejectedKeyIds.Should().Contain(k => k.Contains("not_authorized"));
    }

    #endregion

    #region Purpose Separation Tests

    [Fact]
    public void Evaluate_ApprovalPurpose_ShouldOnlyCountApprovals()
    {
        var policy = new VerificationPolicy
        {
            Requirements = new[]
            {
                new PolicyRequirement
                {
                    Purpose = "codeteam.approval",
                    Threshold = 1,
                    Allow = new AllowConstraints { KeyIds = new[] { _key1.Kid } }
                }
            }
        };
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        // Signature with package_attestation purpose should NOT count
        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse("attestation signature should not satisfy approval requirement");
    }

    [Fact]
    public void Evaluate_AttestationPurpose_ShouldOnlyCountSignatures()
    {
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        // Approval should NOT count toward attestation requirement
        var approvals = new[]
        {
            CreateApproval(_key1, TestPackageDigest)
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, Array.Empty<SignatureCandidate>(), approvals);

        result.Satisfied.Should().BeFalse("approval should not satisfy attestation requirement");
    }

    [Fact]
    public void Evaluate_MixedRequirements_ShouldRequireBoth()
    {
        var policy = new VerificationPolicy
        {
            Requirements = new[]
            {
                new PolicyRequirement
                {
                    Purpose = "codeteam.approval",
                    Threshold = 1,
                    Allow = new AllowConstraints { KeyIds = new[] { _key1.Kid } }
                },
                new PolicyRequirement
                {
                    Purpose = "codeteam.package_attestation",
                    Threshold = 1,
                    Allow = new AllowConstraints { KeyIds = new[] { _key2.Kid } }
                }
            }
        };
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        // Only approval present
        var approvals = new[] { CreateApproval(_key1, TestPackageDigest) };
        var result1 = evaluator.Evaluate(policy, TestPackageDigest, Array.Empty<SignatureCandidate>(), approvals);
        result1.Satisfied.Should().BeFalse("attestation requirement not met");

        // Only signature present
        var signatures = new[] { CreateSignature(_key2, TestPackageDigest) };
        var result2 = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());
        result2.Satisfied.Should().BeFalse("approval requirement not met");

        // Both present
        var result3 = evaluator.Evaluate(policy, TestPackageDigest, signatures, approvals);
        result3.Satisfied.Should().BeTrue("both requirements met");
    }

    #endregion

    #region Package Digest Mismatch Tests

    [Fact]
    public void Evaluate_WrongPackageDigest_ShouldBeRejected()
    {
        var policy = VerificationPolicy.RequireSignatures(1, new[] { _key1.Kid });
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var wrongDigest = "sha256:wrong123def456abc123def456abc123def456abc123def456abc123def456abc1";
        var signatures = new[]
        {
            CreateSignature(_key1, wrongDigest) // Signed wrong digest
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.RequirementResults[0].RejectedKeyIds.Should().Contain(k => k.Contains("digest_mismatch"));
    }

    #endregion

    #region Role Filter Tests

    [Fact]
    public void Evaluate_RoleFilter_ShouldOnlyCountMatchingRoles()
    {
        var policy = new VerificationPolicy
        {
            Requirements = new[]
            {
                new PolicyRequirement
                {
                    Purpose = "codeteam.package_attestation",
                    Threshold = 1,
                    Allow = new AllowConstraints { KeyIds = new[] { _key1.Kid, _key2.Kid } },
                    Roles = new[] { "release-signer" }
                }
            }
        };
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        // Signature with wrong role
        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest, "reviewer") // Wrong role
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeFalse();
        result.RequirementResults[0].RejectedKeyIds.Should().Contain(k => k.Contains("role_mismatch"));
    }

    [Fact]
    public void Evaluate_RoleFilter_ShouldAcceptMatchingRole()
    {
        var policy = new VerificationPolicy
        {
            Requirements = new[]
            {
                new PolicyRequirement
                {
                    Purpose = "codeteam.package_attestation",
                    Threshold = 1,
                    Allow = new AllowConstraints { KeyIds = new[] { _key1.Kid } },
                    Roles = new[] { "release-signer" }
                }
            }
        };
        var evaluator = new PolicyEvaluator(VerifierOptions.Default, _authorizedKeys);

        var signatures = new[]
        {
            CreateSignature(_key1, TestPackageDigest, "release-signer")
        };

        var result = evaluator.Evaluate(policy, TestPackageDigest, signatures, Array.Empty<ApprovalCandidate>());

        result.Satisfied.Should().BeTrue();
    }

    #endregion

    #region Legacy Policy Migration Tests

    [Fact]
    public void FromLegacy_ShouldCreateEquivalentPolicy()
    {
        var legacyPolicy = VerificationPolicy.FromLegacy(2, _authorizedKeys);

        legacyPolicy.Requirements.Should().HaveCount(2);

        // First requirement: approvals
        var approvalReq = legacyPolicy.Requirements.First(r => r.Purpose == "codeteam.approval");
        approvalReq.Threshold.Should().Be(2);
        approvalReq.Allow!.KeyIds.Should().HaveCount(3);

        // Second requirement: attestation
        var attestationReq = legacyPolicy.Requirements.First(r => r.Purpose == "codeteam.package_attestation");
        attestationReq.Threshold.Should().Be(1);
    }

    [Fact]
    public void FromLegacy_ZeroApprovals_ShouldOnlyRequireSignature()
    {
        var legacyPolicy = VerificationPolicy.FromLegacy(0, _authorizedKeys);

        legacyPolicy.Requirements.Should().HaveCount(1);
        legacyPolicy.Requirements[0].Purpose.Should().Be("codeteam.package_attestation");
    }

    #endregion

    #region Helpers

    private SignatureCandidate CreateSignature(KeyFileData key, string packageDigest, string role = "release-signer")
    {
        var signable = SignablePayloadBuilder.ForPackageAttestation(packageDigest, role);
        var signableBytes = SignablePayloadBuilder.GetSignableBytes(signable);
        var signature = KeyFile.SignToBase64(key, signableBytes);

        return new SignatureCandidate
        {
            KeyId = key.Kid,
            PackageDigest = packageDigest,
            Purpose = "codeteam.package_attestation",
            Role = role,
            Signature = signature
        };
    }

    private ApprovalCandidate CreateApproval(KeyFileData key, string packageDigest, string role = "reviewer")
    {
        var signable = SignablePayloadBuilder.ForApproval(packageDigest, role);
        var signableBytes = SignablePayloadBuilder.GetSignableBytes(signable);
        var signature = KeyFile.SignToBase64(key, signableBytes);

        return new ApprovalCandidate
        {
            KeyId = key.Kid,
            PackageDigest = packageDigest,
            Purpose = "codeteam.approval",
            Role = role,
            Signature = signature
        };
    }

    #endregion
}
