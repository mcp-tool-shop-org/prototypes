using System.Text.Json.Serialization;

namespace Attestia.Core.Models;

public sealed record AttestiaResponse<T>
{
    [JsonPropertyName("data")]
    public required T Data { get; init; }
}

public sealed record PaginationMeta
{
    [JsonPropertyName("total")]
    public required int Total { get; init; }

    [JsonPropertyName("hasMore")]
    public required bool HasMore { get; init; }

    [JsonPropertyName("cursor")]
    public string? Cursor { get; init; }

    [JsonPropertyName("limit")]
    public required int Limit { get; init; }
}

public sealed record PaginatedList<T>
{
    [JsonPropertyName("data")]
    public required IReadOnlyList<T> Data { get; init; }

    [JsonPropertyName("pagination")]
    public required PaginationMeta Pagination { get; init; }
}

public sealed record ApiError
{
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    [JsonPropertyName("message")]
    public required string Message { get; init; }

    [JsonPropertyName("details")]
    public Dictionary<string, object?>? Details { get; init; }
}

public class AttestiaException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }
    public Dictionary<string, object?>? Details { get; }

    public AttestiaException(string code, string message, int statusCode, Dictionary<string, object?>? details = null)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details;
    }
}
