using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter<EventSource>))]
public enum EventSource
{
    [JsonStringEnumMemberName("vault")] Vault,
    [JsonStringEnumMemberName("treasury")] Treasury,
    [JsonStringEnumMemberName("registrum")] Registrum,
    [JsonStringEnumMemberName("observer")] Observer,
}

public sealed record EventMetadata
{
    [JsonPropertyName("eventId")]
    public required string EventId { get; init; }

    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }

    [JsonPropertyName("actor")]
    public required string Actor { get; init; }

    [JsonPropertyName("causationId")]
    public string? CausationId { get; init; }

    [JsonPropertyName("correlationId")]
    public required string CorrelationId { get; init; }

    [JsonPropertyName("source")]
    public required EventSource Source { get; init; }
}

public sealed record DomainEvent
{
    [JsonPropertyName("type")]
    public required string Type { get; init; }

    [JsonPropertyName("metadata")]
    public required EventMetadata Metadata { get; init; }

    [JsonPropertyName("payload")]
    public required Dictionary<string, object?> Payload { get; init; }
}

public sealed record StoredEvent
{
    [JsonPropertyName("event")]
    public required DomainEvent Event { get; init; }

    [JsonPropertyName("streamId")]
    public required string StreamId { get; init; }

    [JsonPropertyName("version")]
    public required int Version { get; init; }

    [JsonPropertyName("globalPosition")]
    public required int GlobalPosition { get; init; }

    [JsonPropertyName("appendedAt")]
    public required string AppendedAt { get; init; }

    [JsonPropertyName("hash")]
    public string? Hash { get; init; }

    [JsonPropertyName("previousHash")]
    public string? PreviousHash { get; init; }
}
