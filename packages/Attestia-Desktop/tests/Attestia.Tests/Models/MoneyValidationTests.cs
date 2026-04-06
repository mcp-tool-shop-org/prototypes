using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class MoneyValidationTests
{
    private static Money CreateValidMoney() => new()
    {
        Amount = "100.50",
        Currency = "USDC",
        Decimals = 6,
    };

    [Fact]
    public void Validate_ValidMoney_ReturnsNoErrors()
    {
        var money = CreateValidMoney();
        money.Validate().Should().BeEmpty();
    }

    [Theory]
    [InlineData("100")]
    [InlineData("0")]
    [InlineData("99999999999999999999")]
    [InlineData("100.123456")]
    [InlineData("-50.00")]
    public void Validate_ValidAmountFormats_ReturnsNoErrors(string amount)
    {
        var money = CreateValidMoney() with { Amount = amount };
        money.Validate().Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyAmount_ReturnsError(string amount)
    {
        var money = CreateValidMoney() with { Amount = amount };
        money.Validate().Should().Contain(e => e.Contains("Amount"));
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("12.34.56")]
    [InlineData("$100")]
    [InlineData("100,000")]
    [InlineData("1e10")]
    public void Validate_InvalidAmountFormat_ReturnsError(string amount)
    {
        var money = CreateValidMoney() with { Amount = amount };
        money.Validate().Should().Contain(e => e.Contains("Amount") && e.Contains("valid numeric"));
    }

    [Fact]
    public void Validate_AmountExceedsMaxLength_ReturnsError()
    {
        var money = CreateValidMoney() with { Amount = new string('9', Money.MaxAmountLength + 1) };
        money.Validate().Should().Contain(e => e.Contains("Amount") && e.Contains($"{Money.MaxAmountLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyCurrency_ReturnsError(string currency)
    {
        var money = CreateValidMoney() with { Currency = currency };
        money.Validate().Should().Contain(e => e.Contains("Currency"));
    }

    [Fact]
    public void Validate_CurrencyExceedsMaxLength_ReturnsError()
    {
        var money = CreateValidMoney() with { Currency = new string('C', Money.MaxCurrencyLength + 1) };
        money.Validate().Should().Contain(e => e.Contains("Currency") && e.Contains($"{Money.MaxCurrencyLength}"));
    }

    [Fact]
    public void Validate_NegativeDecimals_ReturnsError()
    {
        var money = CreateValidMoney() with { Decimals = -1 };
        money.Validate().Should().Contain(e => e.Contains("Decimals"));
    }

    [Fact]
    public void Validate_DecimalsExceedsMax_ReturnsError()
    {
        var money = CreateValidMoney() with { Decimals = Money.MaxDecimals + 1 };
        money.Validate().Should().Contain(e => e.Contains("Decimals"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(18)]
    public void Validate_ValidDecimals_ReturnsNoError(int decimals)
    {
        var money = CreateValidMoney() with { Decimals = decimals };
        money.Validate().Should().BeEmpty();
    }

    [Fact]
    public void Validate_MultipleErrors_ReturnsAll()
    {
        var money = CreateValidMoney() with
        {
            Amount = "invalid",
            Currency = "",
            Decimals = -1,
        };
        money.Validate().Should().HaveCountGreaterThanOrEqualTo(3);
    }
}
