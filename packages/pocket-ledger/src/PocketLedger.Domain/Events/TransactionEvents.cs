using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Events;

public record TransactionCreated(
    Guid TransactionId,
    Guid AccountId,
    Money Amount,
    TransactionType Type,
    Guid? CategoryId,
    Guid? TransferToAccountId) : DomainEvent;

public record TransactionUpdated(
    Guid TransactionId,
    Guid AccountId,
    Money OldAmount,
    Money NewAmount,
    Guid? OldCategoryId,
    Guid? NewCategoryId) : DomainEvent;

public record TransactionDeleted(
    Guid TransactionId,
    Guid AccountId,
    Money Amount,
    TransactionType Type,
    Guid? CategoryId) : DomainEvent;

public record TransactionCleared(
    Guid TransactionId,
    Guid AccountId) : DomainEvent;

public record TransactionUncleared(
    Guid TransactionId,
    Guid AccountId) : DomainEvent;
