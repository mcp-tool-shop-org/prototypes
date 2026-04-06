using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.DTOs;

public record AccountDto(
    Guid Id,
    string Name,
    AccountType Type,
    string CurrencyCode,
    decimal Balance,
    bool IsActive,
    string? Notes,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateAccountDto(
    string Name,
    AccountType Type,
    string CurrencyCode = "USD",
    decimal InitialBalance = 0,
    string? Notes = null);

public record UpdateAccountDto(
    string? Name = null,
    string? Notes = null,
    int? DisplayOrder = null);
