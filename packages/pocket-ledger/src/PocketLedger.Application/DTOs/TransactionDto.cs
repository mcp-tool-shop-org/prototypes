using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.DTOs;

public record TransactionDto(
    Guid Id,
    DateOnly Date,
    decimal Amount,
    string CurrencyCode,
    TransactionType Type,
    string Description,
    string? Notes,
    Guid AccountId,
    string? AccountName,
    Guid? CategoryId,
    string? CategoryName,
    Guid? TransferToAccountId,
    string? TransferToAccountName,
    Guid? RecurringTransactionId,
    bool IsCleared,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateTransactionDto(
    DateOnly Date,
    decimal Amount,
    TransactionType Type,
    string Description,
    Guid AccountId,
    Guid? CategoryId = null,
    Guid? TransferToAccountId = null,
    string? Notes = null,
    string CurrencyCode = "USD");

public record UpdateTransactionDto(
    DateOnly? Date = null,
    decimal? Amount = null,
    string? Description = null,
    Guid? CategoryId = null,
    string? Notes = null,
    bool? IsCleared = null);
