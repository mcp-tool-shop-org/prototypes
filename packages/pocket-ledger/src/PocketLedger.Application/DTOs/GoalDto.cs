namespace PocketLedger.Application.DTOs;

public record GoalDto(
    Guid Id,
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal RemainingAmount,
    decimal PercentComplete,
    DateOnly? TargetDate,
    int? DaysRemaining,
    decimal? RequiredMonthlyContribution,
    string? Notes,
    string? Icon,
    string? ColorHex,
    bool IsCompleted,
    DateTime? CompletedAt,
    bool IsArchived,
    int DisplayOrder,
    string CurrencyCode,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateGoalDto(
    string Name,
    decimal TargetAmount,
    DateOnly? TargetDate = null,
    string? Notes = null,
    string? Icon = null,
    string? ColorHex = null,
    string CurrencyCode = "USD");

public record UpdateGoalDto(
    string? Name = null,
    decimal? TargetAmount = null,
    DateOnly? TargetDate = null,
    string? Notes = null,
    string? Icon = null,
    string? ColorHex = null,
    int? DisplayOrder = null);

public record GoalContributionDto(
    Guid GoalId,
    decimal Amount);
