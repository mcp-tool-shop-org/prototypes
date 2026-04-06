using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

public sealed record ChainRef
{
    [JsonPropertyName("chainId")]
    public required string ChainId { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("family")]
    public required string Family { get; init; }
}

public sealed record BlockRef
{
    [JsonPropertyName("chainId")]
    public required string ChainId { get; init; }

    [JsonPropertyName("blockNumber")]
    public required long BlockNumber { get; init; }

    [JsonPropertyName("blockHash")]
    public required string BlockHash { get; init; }

    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }
}

public sealed record TokenRef
{
    [JsonPropertyName("chainId")]
    public required string ChainId { get; init; }

    [JsonPropertyName("address")]
    public required string Address { get; init; }

    [JsonPropertyName("symbol")]
    public required string Symbol { get; init; }

    [JsonPropertyName("decimals")]
    public required int Decimals { get; init; }
}

public sealed record OnChainEvent
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("chainId")]
    public required string ChainId { get; init; }

    [JsonPropertyName("txHash")]
    public required string TxHash { get; init; }

    [JsonPropertyName("block")]
    public required BlockRef Block { get; init; }

    [JsonPropertyName("eventType")]
    public required string EventType { get; init; }

    [JsonPropertyName("data")]
    public required Dictionary<string, object?> Data { get; init; }

    [JsonPropertyName("observedAt")]
    public required string ObservedAt { get; init; }
}
