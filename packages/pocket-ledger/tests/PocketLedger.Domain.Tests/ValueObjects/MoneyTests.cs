using FluentAssertions;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Create_WithValidAmount_ShouldCreateMoney()
    {
        var money = Money.Create(100.50m, "USD");

        money.Amount.Should().Be(100.50m);
        money.CurrencyCode.Should().Be("USD");
    }

    [Fact]
    public void Create_ShouldRoundToTwoDecimals()
    {
        var money = Money.Create(100.555m, "USD");

        money.Amount.Should().Be(100.56m);
    }

    [Fact]
    public void Create_WithInvalidCurrencyCode_ShouldThrow()
    {
        var act = () => Money.Create(100, "US");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*3 characters*");
    }

    [Fact]
    public void Add_WithSameCurrency_ShouldReturnSum()
    {
        var money1 = Money.Create(100, "USD");
        var money2 = Money.Create(50.25m, "USD");

        var result = money1.Add(money2);

        result.Amount.Should().Be(150.25m);
    }

    [Fact]
    public void Add_WithDifferentCurrency_ShouldThrow()
    {
        var money1 = Money.Create(100, "USD");
        var money2 = Money.Create(50, "EUR");

        var act = () => money1.Add(money2);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*different currencies*");
    }

    [Fact]
    public void Subtract_WithSameCurrency_ShouldReturnDifference()
    {
        var money1 = Money.Create(100, "USD");
        var money2 = Money.Create(30.50m, "USD");

        var result = money1.Subtract(money2);

        result.Amount.Should().Be(69.50m);
    }

    [Fact]
    public void Negate_ShouldReturnNegativeAmount()
    {
        var money = Money.Create(100, "USD");

        var result = money.Negate();

        result.Amount.Should().Be(-100);
    }

    [Fact]
    public void Abs_ShouldReturnPositiveAmount()
    {
        var money = Money.Create(-100, "USD");

        var result = money.Abs();

        result.Amount.Should().Be(100);
    }

    [Fact]
    public void IsZero_WithZeroAmount_ShouldReturnTrue()
    {
        var money = Money.Zero("USD");

        money.IsZero.Should().BeTrue();
    }

    [Fact]
    public void IsPositive_WithPositiveAmount_ShouldReturnTrue()
    {
        var money = Money.Create(100, "USD");

        money.IsPositive.Should().BeTrue();
        money.IsNegative.Should().BeFalse();
    }

    [Fact]
    public void IsNegative_WithNegativeAmount_ShouldReturnTrue()
    {
        var money = Money.Create(-100, "USD");

        money.IsNegative.Should().BeTrue();
        money.IsPositive.Should().BeFalse();
    }

    [Fact]
    public void Equality_WithSameValues_ShouldBeEqual()
    {
        var money1 = Money.Create(100, "USD");
        var money2 = Money.Create(100, "USD");

        money1.Should().Be(money2);
        (money1 == money2).Should().BeTrue();
    }

    [Fact]
    public void Comparison_ShouldWorkCorrectly()
    {
        var money1 = Money.Create(100, "USD");
        var money2 = Money.Create(50, "USD");

        (money1 > money2).Should().BeTrue();
        (money2 < money1).Should().BeTrue();
        (money1 >= money2).Should().BeTrue();
        (money2 <= money1).Should().BeTrue();
    }

    [Fact]
    public void ToString_ShouldFormatCorrectly()
    {
        var money = Money.Create(1234.56m, "USD");

        money.ToString().Should().Contain("USD").And.Contain("1,234.56");
    }
}
