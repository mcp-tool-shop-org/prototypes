using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class MerkleProofTests
{
    [Fact]
    public void MerkleProof_RequiredFieldsPresent_Constructs()
    {
        var proof = new MerkleProof
        {
            LeafHash = "abc123",
            LeafIndex = 0,
            Siblings = new List<MerkleProofStep>
            {
                new() { Hash = "sibling1", Direction = SiblingDirection.Left },
                new() { Hash = "sibling2", Direction = SiblingDirection.Right },
            },
            Root = "root-hash",
        };

        proof.LeafHash.Should().Be("abc123");
        proof.LeafIndex.Should().Be(0);
        proof.Siblings.Should().HaveCount(2);
        proof.Root.Should().Be("root-hash");
    }

    [Fact]
    public void MerkleProof_EmptySiblings_IsValid()
    {
        var proof = new MerkleProof
        {
            LeafHash = "single-leaf",
            LeafIndex = 0,
            Siblings = Array.Empty<MerkleProofStep>(),
            Root = "single-leaf",
        };

        proof.Siblings.Should().BeEmpty();
        proof.Root.Should().Be(proof.LeafHash);
    }

    [Theory]
    [InlineData(SiblingDirection.Left)]
    [InlineData(SiblingDirection.Right)]
    public void MerkleProofStep_Direction_RoundTrips(SiblingDirection direction)
    {
        var step = new MerkleProofStep
        {
            Hash = "hash-value",
            Direction = direction,
        };

        step.Direction.Should().Be(direction);
    }

    [Fact]
    public void MerkleProof_NegativeLeafIndex_IsRepresentable()
    {
        // LeafIndex is int; negative values shouldn't occur but are representable.
        // This documents the current behavior — no runtime guard exists.
        var proof = new MerkleProof
        {
            LeafHash = "leaf",
            LeafIndex = -1,
            Siblings = Array.Empty<MerkleProofStep>(),
            Root = "root",
        };

        proof.LeafIndex.Should().Be(-1);
    }

    [Fact]
    public void AttestationProofPackage_FullConstruction_Works()
    {
        var package = new AttestationProofPackage
        {
            Version = 1,
            Attestation = new { data = "test" },
            AttestationHash = "att-hash",
            MerkleRoot = "merkle-root",
            InclusionProof = new MerkleProof
            {
                LeafHash = "leaf",
                LeafIndex = 3,
                Siblings = new List<MerkleProofStep>
                {
                    new() { Hash = "s1", Direction = SiblingDirection.Left },
                },
                Root = "merkle-root",
            },
            PackagedAt = "2026-01-15T12:00:00Z",
            PackageHash = "pkg-hash",
        };

        package.Version.Should().Be(1);
        package.MerkleRoot.Should().Be("merkle-root");
        package.InclusionProof.Root.Should().Be("merkle-root");
    }

    [Fact]
    public void ProofVerificationResult_ValidTrue_Constructs()
    {
        var result = new ProofVerificationResult
        {
            Valid = true,
            MerkleRoot = "root",
            LeafHash = "leaf",
        };

        result.Valid.Should().BeTrue();
    }

    [Fact]
    public void ProofVerificationResult_ValidFalse_Constructs()
    {
        var result = new ProofVerificationResult
        {
            Valid = false,
            MerkleRoot = "root",
            LeafHash = "leaf",
        };

        result.Valid.Should().BeFalse();
    }
}
