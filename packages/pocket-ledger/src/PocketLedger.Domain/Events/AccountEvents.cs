using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Events;

public record AccountCreated(
    Guid AccountId,
    string Name,
    AccountType Type,
    Money InitialBalance) : DomainEvent;

public record AccountBalanceChanged(
    Guid AccountId,
    Money OldBalance,
    Money NewBalance,
    string Reason) : DomainEvent;

public record AccountDeactivated(
    Guid AccountId,
    string Name) : DomainEvent;

public record AccountActivated(
    Guid AccountId,
    string Name) : DomainEvent;
