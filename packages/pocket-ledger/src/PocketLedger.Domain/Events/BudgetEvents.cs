using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Events;

public record EnvelopeCreated(
    Guid EnvelopeId,
    string Name,
    Guid CategoryId,
    int Year,
    int Month,
    Money Allocated) : DomainEvent;

public record EnvelopeAllocationChanged(
    Guid EnvelopeId,
    Money OldAllocation,
    Money NewAllocation) : DomainEvent;

public record EnvelopeSpendingUpdated(
    Guid EnvelopeId,
    Money OldSpent,
    Money NewSpent) : DomainEvent;

public record BudgetExceeded(
    Guid EnvelopeId,
    string EnvelopeName,
    Money Allocated,
    Money Spent,
    Money OverAmount) : DomainEvent;

public record BudgetThresholdReached(
    Guid EnvelopeId,
    string EnvelopeName,
    decimal PercentUsed,
    Money Remaining) : DomainEvent;
