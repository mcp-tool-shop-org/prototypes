namespace PocketLedger.Application.DTOs;

public record EnvelopeDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string? CategoryName,
    decimal Allocated,
    decimal Spent,
    decimal Remaining,
    decimal PercentUsed,
    bool IsOverBudget,
    int Year,
    int Month,
    string? Notes,
    string CurrencyCode,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateEnvelopeDto(
    string Name,
    Guid CategoryId,
    int Year,
    int Month,
    decimal Allocated = 0,
    string? Notes = null,
    string CurrencyCode = "USD");

public record UpdateEnvelopeDto(
    string? Name = null,
    decimal? Allocated = null,
    string? Notes = null);
