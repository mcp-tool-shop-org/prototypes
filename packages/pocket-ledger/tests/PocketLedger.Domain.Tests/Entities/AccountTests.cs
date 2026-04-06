using FluentAssertions;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.Entities;

public class AccountTests
{
    [Fact]
    public void Create_WithValidData_ShouldCreateAccount()
    {
        var account = Account.Create(
            name: "Checking Account",
            type: AccountType.Checking,
            currencyCode: "USD",
            initialBalance: 1000);

        account.Name.Should().Be("Checking Account");
        account.Type.Should().Be(AccountType.Checking);
        account.CurrencyCode.Should().Be("USD");
        account.Balance.Amount.Should().Be(1000);
        account.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Create_WithEmptyName_ShouldThrow()
    {
        var act = () => Account.Create(
            name: "",
            type: AccountType.Checking);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*name*");
    }

    [Fact]
    public void Create_ShouldTrimName()
    {
        var account = Account.Create(
            name: "  My Account  ",
            type: AccountType.Checking);

        account.Name.Should().Be("My Account");
    }

    [Fact]
    public void UpdateName_WithValidName_ShouldUpdate()
    {
        var account = Account.Create("Old Name", AccountType.Checking);

        account.UpdateName("New Name");

        account.Name.Should().Be("New Name");
        account.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void UpdateName_WithEmptyName_ShouldThrow()
    {
        var account = Account.Create("Test", AccountType.Checking);

        var act = () => account.UpdateName("");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveFalse()
    {
        var account = Account.Create("Test", AccountType.Checking);

        account.Deactivate();

        account.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_ShouldSetIsActiveTrue()
    {
        var account = Account.Create("Test", AccountType.Checking);
        account.Deactivate();

        account.Activate();

        account.IsActive.Should().BeTrue();
    }

    [Fact]
    public void AdjustBalance_ShouldAddToBalance()
    {
        var account = Account.Create("Test", AccountType.Checking, "USD", 100);
        var adjustment = Money.Create(50, "USD");

        account.AdjustBalance(adjustment);

        account.Balance.Amount.Should().Be(150);
    }

    [Fact]
    public void AdjustBalance_WithNegative_ShouldSubtract()
    {
        var account = Account.Create("Test", AccountType.Checking, "USD", 100);
        var adjustment = Money.Create(-30, "USD");

        account.AdjustBalance(adjustment);

        account.Balance.Amount.Should().Be(70);
    }

    [Fact]
    public void SetBalance_WithCorrectCurrency_ShouldUpdate()
    {
        var account = Account.Create("Test", AccountType.Checking, "USD", 100);
        var newBalance = Money.Create(500, "USD");

        account.SetBalance(newBalance);

        account.Balance.Should().Be(newBalance);
    }

    [Fact]
    public void SetBalance_WithDifferentCurrency_ShouldThrow()
    {
        var account = Account.Create("Test", AccountType.Checking, "USD", 100);
        var newBalance = Money.Create(500, "EUR");

        var act = () => account.SetBalance(newBalance);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*currency*");
    }

    [Fact]
    public void SetDisplayOrder_ShouldUpdate()
    {
        var account = Account.Create("Test", AccountType.Checking);

        account.SetDisplayOrder(5);

        account.DisplayOrder.Should().Be(5);
    }
}
