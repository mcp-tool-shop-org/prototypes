using FluentAssertions;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.Entities;

public class EnvelopeTests
{
    private readonly Guid _categoryId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidData_ShouldCreateEnvelope()
    {
        var allocated = Money.Create(500, "USD");

        var envelope = Envelope.Create(
            name: "Groceries",
            categoryId: _categoryId,
            year: 2024,
            month: 1,
            allocated: allocated);

        envelope.Name.Should().Be("Groceries");
        envelope.Allocated.Amount.Should().Be(500);
        envelope.Spent.Amount.Should().Be(0);
        envelope.Remaining.Amount.Should().Be(500);
        envelope.PercentUsed.Should().Be(0);
    }

    [Fact]
    public void Create_WithInvalidMonth_ShouldThrow()
    {
        var act = () => Envelope.Create(
            name: "Test",
            categoryId: _categoryId,
            year: 2024,
            month: 13);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithMessage("*Month*");
    }

    [Fact]
    public void AddSpending_ShouldIncreaseSpent()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        var spending = Money.Create(100, "USD");

        envelope.AddSpending(spending);

        envelope.Spent.Amount.Should().Be(100);
        envelope.Remaining.Amount.Should().Be(400);
        envelope.PercentUsed.Should().Be(20);
    }

    [Fact]
    public void AddSpending_WithNegativeAmount_ShouldThrow()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        var spending = Money.Create(-50, "USD");

        var act = () => envelope.AddSpending(spending);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public void RemoveSpending_ShouldDecreaseSpent()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        envelope.AddSpending(Money.Create(200, "USD"));

        envelope.RemoveSpending(Money.Create(50, "USD"));

        envelope.Spent.Amount.Should().Be(150);
    }

    [Fact]
    public void RemoveSpending_BeyondZero_ShouldClampToZero()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        envelope.AddSpending(Money.Create(100, "USD"));

        envelope.RemoveSpending(Money.Create(200, "USD"));

        envelope.Spent.Amount.Should().Be(0);
    }

    [Fact]
    public void IsOverBudget_WhenSpentExceedsAllocated_ShouldBeTrue()
    {
        var envelope = CreateEnvelopeWithAllocation(100);

        envelope.AddSpending(Money.Create(150, "USD"));

        envelope.IsOverBudget.Should().BeTrue();
        envelope.PercentUsed.Should().Be(150);
    }

    [Fact]
    public void SetAllocation_ShouldUpdate()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        var newAllocation = Money.Create(750, "USD");

        envelope.SetAllocation(newAllocation);

        envelope.Allocated.Amount.Should().Be(750);
    }

    [Fact]
    public void SetAllocation_WithNegative_ShouldThrow()
    {
        var envelope = CreateEnvelopeWithAllocation(500);

        var act = () => envelope.SetAllocation(Money.Create(-100, "USD"));

        act.Should().Throw<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public void Period_ShouldReturnCorrectDateRange()
    {
        var envelope = Envelope.Create(
            name: "Test",
            categoryId: _categoryId,
            year: 2024,
            month: 2);

        var period = envelope.Period;

        period.StartDate.Should().Be(new DateOnly(2024, 2, 1));
        period.EndDate.Should().Be(new DateOnly(2024, 2, 29));
    }

    [Fact]
    public void ResetSpending_ShouldSetSpentToZero()
    {
        var envelope = CreateEnvelopeWithAllocation(500);
        envelope.AddSpending(Money.Create(200, "USD"));

        envelope.ResetSpending();

        envelope.Spent.Amount.Should().Be(0);
    }

    private Envelope CreateEnvelopeWithAllocation(decimal amount)
    {
        return Envelope.Create(
            name: "Test Envelope",
            categoryId: _categoryId,
            year: 2024,
            month: 1,
            allocated: Money.Create(amount, "USD"));
    }
}
