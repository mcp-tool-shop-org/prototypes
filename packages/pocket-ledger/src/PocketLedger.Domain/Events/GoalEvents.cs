using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Events;

public record GoalCreated(
    Guid GoalId,
    string Name,
    Money TargetAmount,
    DateOnly? TargetDate) : DomainEvent;

public record GoalContributionAdded(
    Guid GoalId,
    Money ContributionAmount,
    Money NewCurrentAmount,
    decimal PercentComplete) : DomainEvent;

public record GoalContributionRemoved(
    Guid GoalId,
    Money RemovedAmount,
    Money NewCurrentAmount,
    decimal PercentComplete) : DomainEvent;

public record GoalCompleted(
    Guid GoalId,
    string Name,
    Money TargetAmount,
    DateTime CompletedAt) : DomainEvent;

public record GoalArchived(
    Guid GoalId,
    string Name,
    bool WasCompleted) : DomainEvent;

public record GoalMilestoneReached(
    Guid GoalId,
    string Name,
    int MilestonePercent,
    Money CurrentAmount) : DomainEvent;
