using FluentAssertions;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.Entities;

public class TransactionTests
{
    private readonly Guid _accountId = Guid.NewGuid();
    private readonly Guid _categoryId = Guid.NewGuid();

    [Fact]
    public void CreateExpense_ShouldCreateWithNegativeAmount()
    {
        var amount = Money.Create(50, "USD");

        var transaction = Transaction.CreateExpense(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "Grocery shopping",
            accountId: _accountId,
            categoryId: _categoryId);

        transaction.Type.Should().Be(TransactionType.Expense);
        transaction.Amount.Amount.Should().Be(-50);
        transaction.Description.Should().Be("Grocery shopping");
        transaction.IsCleared.Should().BeFalse();
    }

    [Fact]
    public void CreateIncome_ShouldCreateWithPositiveAmount()
    {
        var amount = Money.Create(1000, "USD");

        var transaction = Transaction.CreateIncome(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "Salary",
            accountId: _accountId,
            categoryId: _categoryId);

        transaction.Type.Should().Be(TransactionType.Income);
        transaction.Amount.Amount.Should().Be(1000);
    }

    [Fact]
    public void CreateTransfer_ShouldRequireDestinationAccount()
    {
        var amount = Money.Create(100, "USD");
        var toAccountId = Guid.NewGuid();

        var transaction = Transaction.CreateTransfer(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "Transfer to savings",
            fromAccountId: _accountId,
            toAccountId: toAccountId);

        transaction.Type.Should().Be(TransactionType.Transfer);
        transaction.AccountId.Should().Be(_accountId);
        transaction.TransferToAccountId.Should().Be(toAccountId);
        transaction.Amount.Amount.Should().Be(-100);
    }

    [Fact]
    public void CreateTransfer_ToSameAccount_ShouldThrow()
    {
        var amount = Money.Create(100, "USD");

        var act = () => Transaction.CreateTransfer(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "Invalid transfer",
            fromAccountId: _accountId,
            toAccountId: _accountId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*same account*");
    }

    [Fact]
    public void Create_WithZeroAmount_ShouldThrow()
    {
        var amount = Money.Zero("USD");

        var act = () => Transaction.CreateExpense(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "Test",
            accountId: _accountId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*zero*");
    }

    [Fact]
    public void Create_WithEmptyDescription_ShouldThrow()
    {
        var amount = Money.Create(50, "USD");

        var act = () => Transaction.CreateExpense(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: amount,
            description: "",
            accountId: _accountId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*description*");
    }

    [Fact]
    public void UpdateDescription_ShouldUpdate()
    {
        var transaction = CreateSampleExpense();

        transaction.UpdateDescription("Updated description");

        transaction.Description.Should().Be("Updated description");
        transaction.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void MarkCleared_ShouldSetIsCleared()
    {
        var transaction = CreateSampleExpense();

        transaction.MarkCleared();

        transaction.IsCleared.Should().BeTrue();
    }

    [Fact]
    public void MarkUncleared_ShouldUnsetIsCleared()
    {
        var transaction = CreateSampleExpense();
        transaction.MarkCleared();

        transaction.MarkUncleared();

        transaction.IsCleared.Should().BeFalse();
    }

    [Fact]
    public void UpdateCategory_ForTransfer_ShouldThrow()
    {
        var transaction = Transaction.CreateTransfer(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: Money.Create(100, "USD"),
            description: "Transfer",
            fromAccountId: _accountId,
            toAccountId: Guid.NewGuid());

        var act = () => transaction.UpdateCategory(Guid.NewGuid());

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Transfer*category*");
    }

    [Fact]
    public void UpdateAmount_ForExpense_ShouldKeepNegative()
    {
        var transaction = CreateSampleExpense();
        var newAmount = Money.Create(75, "USD");

        transaction.UpdateAmount(newAmount);

        transaction.Amount.Amount.Should().Be(-75);
    }

    private Transaction CreateSampleExpense()
    {
        return Transaction.CreateExpense(
            date: DateOnly.FromDateTime(DateTime.Today),
            amount: Money.Create(50, "USD"),
            description: "Test expense",
            accountId: _accountId);
    }
}
