using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter<SiblingDirection>))]
public enum SiblingDirection
{
    [JsonStringEnumMemberName("left")] Left,
    [JsonStringEnumMemberName("right")] Right,
}

public sealed record MerkleProofStep
{
    [JsonPropertyName("hash")]
    public required string Hash { get; init; }

    [JsonPropertyName("direction")]
    public required SiblingDirection Direction { get; init; }
}

public sealed record MerkleProof
{
    [JsonPropertyName("leafHash")]
    public required string LeafHash { get; init; }

    [JsonPropertyName("leafIndex")]
    public required int LeafIndex { get; init; }

    [JsonPropertyName("siblings")]
    public required IReadOnlyList<MerkleProofStep> Siblings { get; init; }

    [JsonPropertyName("root")]
    public required string Root { get; init; }
}

public sealed record MerkleRootInfo
{
    [JsonPropertyName("root")]
    public required string Root { get; init; }

    [JsonPropertyName("leafCount")]
    public required int LeafCount { get; init; }
}

public sealed record AttestationProofPackage
{
    [JsonPropertyName("version")]
    public required int Version { get; init; }

    [JsonPropertyName("attestation")]
    public required object Attestation { get; init; }

    [JsonPropertyName("attestationHash")]
    public required string AttestationHash { get; init; }

    [JsonPropertyName("merkleRoot")]
    public required string MerkleRoot { get; init; }

    [JsonPropertyName("inclusionProof")]
    public required MerkleProof InclusionProof { get; init; }

    [JsonPropertyName("packagedAt")]
    public required string PackagedAt { get; init; }

    [JsonPropertyName("packageHash")]
    public required string PackageHash { get; init; }
}

public sealed record ProofVerificationResult
{
    [JsonPropertyName("valid")]
    public required bool Valid { get; init; }

    [JsonPropertyName("merkleRoot")]
    public required string MerkleRoot { get; init; }

    [JsonPropertyName("leafHash")]
    public required string LeafHash { get; init; }
}
