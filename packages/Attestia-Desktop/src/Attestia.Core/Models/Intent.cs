using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Attestia.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter<IntentStatus>))]
public enum IntentStatus
{
    [JsonStringEnumMemberName("declared")] Declared,
    [JsonStringEnumMemberName("approved")] Approved,
    [JsonStringEnumMemberName("rejected")] Rejected,
    [JsonStringEnumMemberName("executing")] Executing,
    [JsonStringEnumMemberName("executed")] Executed,
    [JsonStringEnumMemberName("verified")] Verified,
    [JsonStringEnumMemberName("failed")] Failed,
}

public sealed record Intent
{
    /// <summary>Maximum length for identifier fields (IDs, hashes).</summary>
    public const int MaxIdLength = 128;

    /// <summary>Maximum length for the kind field.</summary>
    public const int MaxKindLength = 64;

    /// <summary>Maximum length for the description field.</summary>
    public const int MaxDescriptionLength = 2000;

    /// <summary>Maximum length for the declaredBy field (address or identifier).</summary>
    public const int MaxDeclaredByLength = 256;

    /// <summary>Maximum number of parameters allowed.</summary>
    public const int MaxParamsCount = 50;

    [JsonPropertyName("id")]
    [StringLength(MaxIdLength, MinimumLength = 1)]
    public required string Id { get; init; }

    [JsonPropertyName("status")]
    public required IntentStatus Status { get; init; }

    [JsonPropertyName("kind")]
    [StringLength(MaxKindLength, MinimumLength = 1)]
    public required string Kind { get; init; }

    [JsonPropertyName("description")]
    [StringLength(MaxDescriptionLength, MinimumLength = 1)]
    public required string Description { get; init; }

    [JsonPropertyName("declaredBy")]
    [StringLength(MaxDeclaredByLength, MinimumLength = 1)]
    public required string DeclaredBy { get; init; }

    [JsonPropertyName("declaredAt")]
    public required string DeclaredAt { get; init; }

    [JsonPropertyName("params")]
    public required Dictionary<string, object?> Params { get; init; }

    /// <summary>
    /// Validates this Intent instance and returns a list of validation errors.
    /// Returns an empty list when the intent is valid.
    /// </summary>
    public IReadOnlyList<string> Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Id))
            errors.Add("Id is required.");
        else if (Id.Length > MaxIdLength)
            errors.Add($"Id must not exceed {MaxIdLength} characters.");

        if (string.IsNullOrWhiteSpace(Kind))
            errors.Add("Kind is required.");
        else if (Kind.Length > MaxKindLength)
            errors.Add($"Kind must not exceed {MaxKindLength} characters.");

        if (string.IsNullOrWhiteSpace(Description))
            errors.Add("Description is required.");
        else if (Description.Length > MaxDescriptionLength)
            errors.Add($"Description must not exceed {MaxDescriptionLength} characters.");

        if (string.IsNullOrWhiteSpace(DeclaredBy))
            errors.Add("DeclaredBy is required.");
        else if (DeclaredBy.Length > MaxDeclaredByLength)
            errors.Add($"DeclaredBy must not exceed {MaxDeclaredByLength} characters.");

        if (string.IsNullOrWhiteSpace(DeclaredAt))
            errors.Add("DeclaredAt is required.");

        if (Params.Count > MaxParamsCount)
            errors.Add($"Params must not contain more than {MaxParamsCount} entries.");

        return errors;
    }
}

public sealed record IntentDeclaration
{
    [JsonPropertyName("intentId")]
    [StringLength(Intent.MaxIdLength, MinimumLength = 1)]
    public required string IntentId { get; init; }

    [JsonPropertyName("declaredBy")]
    [StringLength(Intent.MaxDeclaredByLength, MinimumLength = 1)]
    public required string DeclaredBy { get; init; }

    [JsonPropertyName("declaredAt")]
    public required string DeclaredAt { get; init; }

    [JsonPropertyName("kind")]
    [StringLength(Intent.MaxKindLength, MinimumLength = 1)]
    public required string Kind { get; init; }

    [JsonPropertyName("params")]
    public required Dictionary<string, object?> Params { get; init; }
}

public sealed record IntentApproval
{
    [JsonPropertyName("intentId")]
    [StringLength(Intent.MaxIdLength, MinimumLength = 1)]
    public required string IntentId { get; init; }

    [JsonPropertyName("approvedBy")]
    [StringLength(Intent.MaxDeclaredByLength, MinimumLength = 1)]
    public required string ApprovedBy { get; init; }

    [JsonPropertyName("approvedAt")]
    public required string ApprovedAt { get; init; }

    [JsonPropertyName("approved")]
    public required bool Approved { get; init; }

    [JsonPropertyName("reason")]
    [StringLength(2000)]
    public string? Reason { get; init; }
}

public sealed record IntentExecution
{
    /// <summary>Regex pattern for blockchain transaction hashes (hex, 64-66 chars with optional 0x prefix).</summary>
    public static readonly Regex TxHashPattern = new(@"^(0x)?[0-9a-fA-F]{64}$", RegexOptions.Compiled);

    [JsonPropertyName("intentId")]
    [StringLength(Intent.MaxIdLength, MinimumLength = 1)]
    public required string IntentId { get; init; }

    [JsonPropertyName("executedAt")]
    public required string ExecutedAt { get; init; }

    [JsonPropertyName("chainId")]
    [StringLength(Intent.MaxIdLength, MinimumLength = 1)]
    public required string ChainId { get; init; }

    [JsonPropertyName("txHash")]
    [StringLength(Intent.MaxIdLength, MinimumLength = 1)]
    public required string TxHash { get; init; }

    /// <summary>
    /// Validates the transaction hash format.
    /// Returns true if the TxHash matches the expected blockchain hash pattern.
    /// </summary>
    public bool IsTxHashValid() => TxHashPattern.IsMatch(TxHash);
}

public sealed record IntentVerification
{
    [JsonPropertyName("intentId")]
    public required string IntentId { get; init; }

    [JsonPropertyName("verifiedAt")]
    public required string VerifiedAt { get; init; }

    [JsonPropertyName("matched")]
    public required bool Matched { get; init; }

    [JsonPropertyName("discrepancies")]
    public IReadOnlyList<string>? Discrepancies { get; init; }
}
