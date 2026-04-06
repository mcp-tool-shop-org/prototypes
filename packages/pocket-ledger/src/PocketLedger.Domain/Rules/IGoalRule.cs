using PocketLedger.Domain.Entities;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Rules;

public interface IGoalRule
{
    GoalRuleResult Evaluate(Goal goal, Money? contribution = null);
}

public record GoalRuleResult(
    bool IsOnTrack,
    string? Message,
    Money? SuggestedContribution);

public class GoalProgressRule : IGoalRule
{
    public GoalRuleResult Evaluate(Goal goal, Money? contribution = null)
    {
        if (goal.IsCompleted)
        {
            return new GoalRuleResult(
                IsOnTrack: true,
                Message: "Goal completed!",
                SuggestedContribution: null);
        }

        if (!goal.TargetDate.HasValue)
        {
            return new GoalRuleResult(
                IsOnTrack: true,
                Message: null,
                SuggestedContribution: null);
        }

        var today = DateOnly.FromDateTime(DateTime.Today);

        if (goal.TargetDate.Value <= today)
        {
            return new GoalRuleResult(
                IsOnTrack: false,
                Message: $"Goal deadline has passed. Still need {goal.RemainingAmount}",
                SuggestedContribution: goal.RemainingAmount);
        }

        var monthsRemaining = ((goal.TargetDate.Value.Year - today.Year) * 12) +
                              (goal.TargetDate.Value.Month - today.Month);

        if (monthsRemaining <= 0)
        {
            return new GoalRuleResult(
                IsOnTrack: false,
                Message: $"Less than a month remaining. Need {goal.RemainingAmount}",
                SuggestedContribution: goal.RemainingAmount);
        }

        var requiredMonthly = goal.RequiredMonthlyContribution;

        if (requiredMonthly is null)
        {
            return new GoalRuleResult(
                IsOnTrack: true,
                Message: null,
                SuggestedContribution: null);
        }

        var expectedProgress = (decimal)((today.DayNumber - goal.CreatedAt.DayOfYear) /
                                         (double)(goal.TargetDate.Value.DayNumber - goal.CreatedAt.DayOfYear)) * 100;

        var actualProgress = goal.PercentComplete;

        if (actualProgress >= expectedProgress - 5)
        {
            return new GoalRuleResult(
                IsOnTrack: true,
                Message: $"On track! Contribute {requiredMonthly} monthly to reach your goal.",
                SuggestedContribution: requiredMonthly);
        }

        return new GoalRuleResult(
            IsOnTrack: false,
            Message: $"Behind schedule. Consider increasing monthly contributions to {requiredMonthly}",
            SuggestedContribution: requiredMonthly);
    }
}
