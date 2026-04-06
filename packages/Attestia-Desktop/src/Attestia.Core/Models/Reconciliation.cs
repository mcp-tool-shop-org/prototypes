using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter<MatchStatus>))]
public enum MatchStatus
{
    [JsonStringEnumMemberName("matched")] Matched,
    [JsonStringEnumMemberName("amount-mismatch")] AmountMismatch,
    [JsonStringEnumMemberName("missing-ledger")] MissingLedger,
    [JsonStringEnumMemberName("missing-intent")] MissingIntent,
    [JsonStringEnumMemberName("missing-chain")] MissingChain,
    [JsonStringEnumMemberName("unmatched")] Unmatched,
}

public sealed record IntentLedgerMatch
{
    [JsonPropertyName("intentId")]
    public required string IntentId { get; init; }

    [JsonPropertyName("correlationId")]
    public required string CorrelationId { get; init; }

    [JsonPropertyName("status")]
    public required MatchStatus Status { get; init; }

    [JsonPropertyName("intentAmount")]
    public Money? IntentAmount { get; init; }

    [JsonPropertyName("ledgerAmount")]
    public Money? LedgerAmount { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<string> Discrepancies { get; init; }
}

public sealed record LedgerChainMatch
{
    [JsonPropertyName("correlationId")]
    public required string CorrelationId { get; init; }

    [JsonPropertyName("txHash")]
    public string? TxHash { get; init; }

    [JsonPropertyName("chainId")]
    public string? ChainId { get; init; }

    [JsonPropertyName("status")]
    public required MatchStatus Status { get; init; }

    [JsonPropertyName("ledgerAmount")]
    public Money? LedgerAmount { get; init; }

    [JsonPropertyName("chainAmount")]
    public string? ChainAmount { get; init; }

    [JsonPropertyName("chainDecimals")]
    public int? ChainDecimals { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<string> Discrepancies { get; init; }
}

public sealed record IntentChainMatch
{
    [JsonPropertyName("intentId")]
    public required string IntentId { get; init; }

    [JsonPropertyName("txHash")]
    public string? TxHash { get; init; }

    [JsonPropertyName("chainId")]
    public string? ChainId { get; init; }

    [JsonPropertyName("status")]
    public required MatchStatus Status { get; init; }

    [JsonPropertyName("intentAmount")]
    public Money? IntentAmount { get; init; }

    [JsonPropertyName("chainAmount")]
    public string? ChainAmount { get; init; }

    [JsonPropertyName("chainDecimals")]
    public int? ChainDecimals { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<string> Discrepancies { get; init; }
}

public sealed record ReconciliationScope
{
    [JsonPropertyName("from")]
    public string? From { get; init; }

    [JsonPropertyName("to")]
    public string? To { get; init; }

    [JsonPropertyName("intentId")]
    public string? IntentId { get; init; }

    [JsonPropertyName("chainId")]
    public string? ChainId { get; init; }

    [JsonPropertyName("correlationId")]
    public string? CorrelationId { get; init; }
}

public sealed record ReconciliationSummary
{
    [JsonPropertyName("totalIntents")]
    public required int TotalIntents { get; init; }

    [JsonPropertyName("totalLedgerEntries")]
    public required int TotalLedgerEntries { get; init; }

    [JsonPropertyName("totalChainEvents")]
    public required int TotalChainEvents { get; init; }

    [JsonPropertyName("matchedCount")]
    public required int MatchedCount { get; init; }

    [JsonPropertyName("mismatchCount")]
    public required int MismatchCount { get; init; }

    [JsonPropertyName("missingCount")]
    public required int MissingCount { get; init; }

    [JsonPropertyName("allReconciled")]
    public required bool AllReconciled { get; init; }

    [JsonPropertyName("discrepancies")]
    public required IReadOnlyList<string> Discrepancies { get; init; }
}

public sealed record ReconciliationReport
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("scope")]
    public required ReconciliationScope Scope { get; init; }

    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }

    [JsonPropertyName("intentLedgerMatches")]
    public required IReadOnlyList<IntentLedgerMatch> IntentLedgerMatches { get; init; }

    [JsonPropertyName("ledgerChainMatches")]
    public required IReadOnlyList<LedgerChainMatch> LedgerChainMatches { get; init; }

    [JsonPropertyName("intentChainMatches")]
    public required IReadOnlyList<IntentChainMatch> IntentChainMatches { get; init; }

    [JsonPropertyName("summary")]
    public required ReconciliationSummary Summary { get; init; }
}

public sealed record AttestationRecord
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("reconciliationId")]
    public required string ReconciliationId { get; init; }

    [JsonPropertyName("allReconciled")]
    public required bool AllReconciled { get; init; }

    [JsonPropertyName("summary")]
    public required ReconciliationSummary Summary { get; init; }

    [JsonPropertyName("attestedBy")]
    public required string AttestedBy { get; init; }

    [JsonPropertyName("attestedAt")]
    public required string AttestedAt { get; init; }

    [JsonPropertyName("reportHash")]
    public required string ReportHash { get; init; }
}
