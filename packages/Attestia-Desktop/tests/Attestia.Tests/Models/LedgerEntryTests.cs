using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class LedgerEntryTests
{
    private static LedgerEntry CreateValid() => new()
    {
        Id = "le-001",
        AccountId = "acc-001",
        Type = LedgerEntryType.Debit,
        Money = new Money { Amount = "100.00", Currency = "USDC", Decimals = 6 },
        Timestamp = "2026-01-15T10:30:00Z",
        CorrelationId = "corr-001",
    };

    [Fact]
    public void Validate_ValidEntry_ReturnsNoErrors()
    {
        CreateValid().Validate().Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyId_ReturnsError(string id)
    {
        var entry = CreateValid() with { Id = id };
        entry.Validate().Should().Contain(e => e.Contains("Id"));
    }

    [Fact]
    public void Validate_IdExceedsMaxLength_ReturnsError()
    {
        var entry = CreateValid() with { Id = new string('x', LedgerEntry.MaxIdLength + 1) };
        entry.Validate().Should().Contain(e => e.Contains("Id") && e.Contains($"{LedgerEntry.MaxIdLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyAccountId_ReturnsError(string accountId)
    {
        var entry = CreateValid() with { AccountId = accountId };
        entry.Validate().Should().Contain(e => e.Contains("AccountId"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyTimestamp_ReturnsError(string timestamp)
    {
        var entry = CreateValid() with { Timestamp = timestamp };
        entry.Validate().Should().Contain(e => e.Contains("Timestamp"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyCorrelationId_ReturnsError(string correlationId)
    {
        var entry = CreateValid() with { CorrelationId = correlationId };
        entry.Validate().Should().Contain(e => e.Contains("CorrelationId"));
    }

    [Fact]
    public void Validate_InvalidMoney_PropagatesErrors()
    {
        var entry = CreateValid() with
        {
            Money = new Money { Amount = "invalid", Currency = "USDC", Decimals = 6 },
        };
        entry.Validate().Should().Contain(e => e.Contains("Amount"));
    }

    [Fact]
    public void Validate_WithOptionalFields_ReturnsNoErrors()
    {
        var entry = CreateValid() with
        {
            IntentId = "intent-001",
            TxHash = "0x" + new string('a', 64),
        };
        entry.Validate().Should().BeEmpty();
    }

    [Fact]
    public void Validate_MultipleErrors_ReturnsAll()
    {
        var entry = CreateValid() with
        {
            Id = "",
            AccountId = "",
            Timestamp = "",
            CorrelationId = "",
        };
        entry.Validate().Should().HaveCountGreaterThanOrEqualTo(4);
    }
}
