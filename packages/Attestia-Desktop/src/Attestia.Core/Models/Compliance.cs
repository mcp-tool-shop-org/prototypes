using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

public sealed record ComplianceFramework
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("version")]
    public required string Version { get; init; }

    [JsonPropertyName("description")]
    public required string Description { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<ControlStatus>))]
public enum ControlStatus
{
    [JsonStringEnumMemberName("implemented")] Implemented,
    [JsonStringEnumMemberName("partial")] Partial,
    [JsonStringEnumMemberName("planned")] Planned,
    [JsonStringEnumMemberName("not-applicable")] NotApplicable,
}

public sealed record ControlMapping
{
    [JsonPropertyName("controlId")]
    public required string ControlId { get; init; }

    [JsonPropertyName("controlName")]
    public required string ControlName { get; init; }

    [JsonPropertyName("controlDescription")]
    public required string ControlDescription { get; init; }

    [JsonPropertyName("attestiaControl")]
    public required string AttestiaControl { get; init; }

    [JsonPropertyName("attestiaPackage")]
    public required string AttestiaPackage { get; init; }

    [JsonPropertyName("evidenceTypes")]
    public required IReadOnlyList<string> EvidenceTypes { get; init; }

    [JsonPropertyName("status")]
    public required ControlStatus Status { get; init; }

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }
}

public sealed record EvaluatedControl
{
    [JsonPropertyName("mapping")]
    public required ControlMapping Mapping { get; init; }

    [JsonPropertyName("passed")]
    public required bool Passed { get; init; }

    [JsonPropertyName("evidenceDetail")]
    public required string EvidenceDetail { get; init; }
}

public sealed record ComplianceReport
{
    [JsonPropertyName("framework")]
    public required ComplianceFramework Framework { get; init; }

    [JsonPropertyName("evaluations")]
    public required IReadOnlyList<EvaluatedControl> Evaluations { get; init; }

    [JsonPropertyName("totalControls")]
    public required int TotalControls { get; init; }

    [JsonPropertyName("passedControls")]
    public required int PassedControls { get; init; }

    [JsonPropertyName("score")]
    public required double Score { get; init; }

    [JsonPropertyName("generatedAt")]
    public required string GeneratedAt { get; init; }
}
