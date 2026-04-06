using FluentAssertions;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.Entities;

public class GoalTests
{
    [Fact]
    public void Create_WithValidData_ShouldCreateGoal()
    {
        var target = Money.Create(5000, "USD");

        var goal = Goal.Create(
            name: "Emergency Fund",
            targetAmount: target,
            targetDate: DateOnly.FromDateTime(DateTime.Today.AddMonths(6)));

        goal.Name.Should().Be("Emergency Fund");
        goal.TargetAmount.Amount.Should().Be(5000);
        goal.CurrentAmount.Amount.Should().Be(0);
        goal.RemainingAmount.Amount.Should().Be(5000);
        goal.PercentComplete.Should().Be(0);
        goal.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public void Create_WithZeroTarget_ShouldThrow()
    {
        var act = () => Goal.Create(
            name: "Test",
            targetAmount: Money.Zero());

        act.Should().Throw<ArgumentException>()
            .WithMessage("*positive*");
    }

    [Fact]
    public void AddContribution_ShouldIncreaseCurrent()
    {
        var goal = CreateSampleGoal(1000);
        var contribution = Money.Create(250, "USD");

        goal.AddContribution(contribution);

        goal.CurrentAmount.Amount.Should().Be(250);
        goal.RemainingAmount.Amount.Should().Be(750);
        goal.PercentComplete.Should().Be(25);
    }

    [Fact]
    public void AddContribution_ReachingTarget_ShouldMarkComplete()
    {
        var goal = CreateSampleGoal(1000);

        goal.AddContribution(Money.Create(1000, "USD"));

        goal.IsCompleted.Should().BeTrue();
        goal.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void AddContribution_ExceedingTarget_ShouldStillMarkComplete()
    {
        var goal = CreateSampleGoal(1000);

        goal.AddContribution(Money.Create(1500, "USD"));

        goal.IsCompleted.Should().BeTrue();
        goal.CurrentAmount.Amount.Should().Be(1500);
        goal.PercentComplete.Should().Be(100); // Capped at 100
    }

    [Fact]
    public void AddContribution_WhenCompleted_ShouldThrow()
    {
        var goal = CreateSampleGoal(1000);
        goal.AddContribution(Money.Create(1000, "USD"));

        var act = () => goal.AddContribution(Money.Create(100, "USD"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*completed*");
    }

    [Fact]
    public void RemoveContribution_ShouldDecreaseCurrent()
    {
        var goal = CreateSampleGoal(1000);
        goal.AddContribution(Money.Create(500, "USD"));

        goal.RemoveContribution(Money.Create(200, "USD"));

        goal.CurrentAmount.Amount.Should().Be(300);
    }

    [Fact]
    public void RemoveContribution_FromCompleted_ShouldUncomplete()
    {
        var goal = CreateSampleGoal(1000);
        goal.AddContribution(Money.Create(1000, "USD"));

        goal.RemoveContribution(Money.Create(200, "USD"));

        goal.IsCompleted.Should().BeFalse();
        goal.CompletedAt.Should().BeNull();
        goal.CurrentAmount.Amount.Should().Be(800);
    }

    [Fact]
    public void UpdateTargetAmount_Increasing_ShouldUncomplete()
    {
        var goal = CreateSampleGoal(1000);
        goal.AddContribution(Money.Create(1000, "USD"));

        goal.UpdateTargetAmount(Money.Create(1500, "USD"));

        goal.IsCompleted.Should().BeFalse();
        goal.TargetAmount.Amount.Should().Be(1500);
    }

    [Fact]
    public void UpdateTargetAmount_Decreasing_ShouldComplete()
    {
        var goal = CreateSampleGoal(1000);
        goal.AddContribution(Money.Create(600, "USD"));

        goal.UpdateTargetAmount(Money.Create(500, "USD"));

        goal.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public void Archive_ShouldSetIsArchived()
    {
        var goal = CreateSampleGoal(1000);

        goal.Archive();

        goal.IsArchived.Should().BeTrue();
    }

    [Fact]
    public void Unarchive_ShouldUnsetIsArchived()
    {
        var goal = CreateSampleGoal(1000);
        goal.Archive();

        goal.Unarchive();

        goal.IsArchived.Should().BeFalse();
    }

    [Fact]
    public void DaysRemaining_WithFutureDate_ShouldReturnPositive()
    {
        var goal = Goal.Create(
            name: "Test",
            targetAmount: Money.Create(1000, "USD"),
            targetDate: DateOnly.FromDateTime(DateTime.Today.AddDays(30)));

        goal.DaysRemaining.Should().Be(30);
    }

    [Fact]
    public void DaysRemaining_WithNoTargetDate_ShouldBeNull()
    {
        var goal = Goal.Create(
            name: "Test",
            targetAmount: Money.Create(1000, "USD"),
            targetDate: null);

        goal.DaysRemaining.Should().BeNull();
    }

    private Goal CreateSampleGoal(decimal targetAmount)
    {
        return Goal.Create(
            name: "Test Goal",
            targetAmount: Money.Create(targetAmount, "USD"));
    }
}
