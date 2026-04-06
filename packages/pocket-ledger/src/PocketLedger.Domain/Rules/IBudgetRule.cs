using PocketLedger.Domain.Entities;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Rules;

public interface IBudgetRule
{
    BudgetRuleResult Evaluate(Envelope envelope, Money proposedExpense);
}

public record BudgetRuleResult(
    bool IsAllowed,
    bool IsWarning,
    string? Message);

public class EnvelopeBudgetLimitRule : IBudgetRule
{
    public BudgetRuleResult Evaluate(Envelope envelope, Money proposedExpense)
    {
        var projectedSpent = envelope.Spent + proposedExpense;

        if (projectedSpent > envelope.Allocated)
        {
            var overAmount = projectedSpent - envelope.Allocated;
            return new BudgetRuleResult(
                IsAllowed: true,
                IsWarning: true,
                Message: $"This expense will exceed the {envelope.Name} budget by {overAmount}");
        }

        var percentAfter = envelope.Allocated.IsZero
            ? 100
            : (projectedSpent.Amount / envelope.Allocated.Amount) * 100;

        if (percentAfter >= 90)
        {
            return new BudgetRuleResult(
                IsAllowed: true,
                IsWarning: true,
                Message: $"This expense will use {percentAfter:F0}% of the {envelope.Name} budget");
        }

        return new BudgetRuleResult(IsAllowed: true, IsWarning: false, Message: null);
    }
}

public class ZeroBasedBudgetRule : IBudgetRule
{
    public BudgetRuleResult Evaluate(Envelope envelope, Money proposedExpense)
    {
        if (envelope.Remaining.IsZero)
        {
            return new BudgetRuleResult(
                IsAllowed: true,
                IsWarning: true,
                Message: $"No budget remaining in {envelope.Name}. Consider reallocating funds.");
        }

        if (proposedExpense > envelope.Remaining)
        {
            var shortfall = proposedExpense - envelope.Remaining;
            return new BudgetRuleResult(
                IsAllowed: true,
                IsWarning: true,
                Message: $"This expense exceeds remaining budget by {shortfall}");
        }

        return new BudgetRuleResult(IsAllowed: true, IsWarning: false, Message: null);
    }
}
