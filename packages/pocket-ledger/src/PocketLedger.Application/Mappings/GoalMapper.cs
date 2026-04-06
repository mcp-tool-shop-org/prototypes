using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Mappings;

public static class GoalMapper
{
    public static GoalDto ToDto(this Goal goal)
    {
        return new GoalDto(
            Id: goal.Id,
            Name: goal.Name,
            TargetAmount: goal.TargetAmount.Amount,
            CurrentAmount: goal.CurrentAmount.Amount,
            RemainingAmount: goal.RemainingAmount.Amount,
            PercentComplete: goal.PercentComplete,
            TargetDate: goal.TargetDate,
            DaysRemaining: goal.DaysRemaining,
            RequiredMonthlyContribution: goal.RequiredMonthlyContribution?.Amount,
            Notes: goal.Notes,
            Icon: goal.Icon,
            ColorHex: goal.ColorHex,
            IsCompleted: goal.IsCompleted,
            CompletedAt: goal.CompletedAt,
            IsArchived: goal.IsArchived,
            DisplayOrder: goal.DisplayOrder,
            CurrencyCode: goal.TargetAmount.CurrencyCode,
            CreatedAt: goal.CreatedAt,
            UpdatedAt: goal.UpdatedAt);
    }

    public static IReadOnlyList<GoalDto> ToDtos(this IEnumerable<Goal> goals)
    {
        return goals.Select(g => g.ToDto()).ToList();
    }
}
