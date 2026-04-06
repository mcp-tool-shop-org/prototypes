using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter<VerificationVerdict>))]
public enum VerificationVerdict
{
    [JsonStringEnumMemberName("PASS")] Pass,
    [JsonStringEnumMemberName("FAIL")] Fail,
}

public sealed record SubsystemHashes
{
    [JsonPropertyName("ledger")]
    public required string Ledger { get; init; }

    [JsonPropertyName("registrum")]
    public required string Registrum { get; init; }

    [JsonPropertyName("chains")]
    public Dictionary<string, string>? Chains { get; init; }
}

public sealed record GlobalStateHash
{
    [JsonPropertyName("hash")]
    public required string Hash { get; init; }

    [JsonPropertyName("computedAt")]
    public required string ComputedAt { get; init; }

    [JsonPropertyName("subsystems")]
    public required SubsystemHashes Subsystems { get; init; }
}

public sealed record VerificationDiscrepancy
{
    [JsonPropertyName("subsystem")]
    public required string Subsystem { get; init; }

    [JsonPropertyName("expected")]
    public required string Expected { get; init; }

    [JsonPropertyName("actual")]
    public required string Actual { get; init; }

    [JsonPropertyName("description")]
    public required string Description { get; init; }
}

public sealed record VerificationResult
{
    [JsonPropertyName("verdict")]
    public required VerificationVerdict Verdict { get; init; }

    [JsonPropertyName("globalHash")]
    public required GlobalStateHash GlobalHash { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<VerificationDiscrepancy> Discrepancies { get; init; }

    [JsonPropertyName("verifiedAt")]
    public required string VerifiedAt { get; init; }
}

public sealed record ReplayResult
{
    [JsonPropertyName("verdict")]
    public required VerificationVerdict Verdict { get; init; }

    [JsonPropertyName("replayedHash")]
    public required GlobalStateHash ReplayedHash { get; init; }

    [JsonPropertyName("originalHash")]
    public required GlobalStateHash OriginalHash { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<VerificationDiscrepancy> Discrepancies { get; init; }
}

public sealed record SubsystemCheck
{
    [JsonPropertyName("subsystem")]
    public required string Subsystem { get; init; }

    [JsonPropertyName("expected")]
    public required string Expected { get; init; }

    [JsonPropertyName("actual")]
    public required string Actual { get; init; }

    [JsonPropertyName("matches")]
    public required bool Matches { get; init; }
}

public sealed record VerifierReport
{
    [JsonPropertyName("reportId")]
    public required string ReportId { get; init; }

    [JsonPropertyName("verifierId")]
    public required string VerifierId { get; init; }

    [JsonPropertyName("verdict")]
    public required VerificationVerdict Verdict { get; init; }

    [JsonPropertyName("subsystemChecks")]
    public required IReadOnlyList<SubsystemCheck> SubsystemChecks { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<string> Discrepancies { get; init; }

    [JsonPropertyName("bundleHash")]
    public required string BundleHash { get; init; }

    [JsonPropertyName("verifiedAt")]
    public required string VerifiedAt { get; init; }
}

public sealed record ConsensusResult
{
    [JsonPropertyName("verdict")]
    public required VerificationVerdict Verdict { get; init; }

    [JsonPropertyName("totalVerifiers")]
    public required int TotalVerifiers { get; init; }

    [JsonPropertyName("passCount")]
    public required int PassCount { get; init; }

    [JsonPropertyName("failCount")]
    public required int FailCount { get; init; }

    [JsonPropertyName("agreementRatio")]
    public required double AgreementRatio { get; init; }

    [JsonPropertyName("quorumReached")]
    public required bool QuorumReached { get; init; }

    [JsonPropertyName("dissenters")]
    public required IReadOnlyList<string> Dissenters { get; init; }

    [JsonPropertyName("consensusAt")]
    public required string ConsensusAt { get; init; }
}
