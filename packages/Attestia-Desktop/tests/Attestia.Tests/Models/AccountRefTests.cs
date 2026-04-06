using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class AccountRefTests
{
    private static AccountRef CreateValid() => new()
    {
        Id = "acc-001",
        Type = AccountType.Asset,
        Name = "Treasury Account",
    };

    [Fact]
    public void Validate_ValidAccountRef_ReturnsNoErrors()
    {
        CreateValid().Validate().Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyId_ReturnsError(string id)
    {
        var acc = CreateValid() with { Id = id };
        acc.Validate().Should().Contain(e => e.Contains("Id"));
    }

    [Fact]
    public void Validate_IdExceedsMaxLength_ReturnsError()
    {
        var acc = CreateValid() with { Id = new string('x', AccountRef.MaxIdLength + 1) };
        acc.Validate().Should().Contain(e => e.Contains("Id") && e.Contains($"{AccountRef.MaxIdLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyName_ReturnsError(string name)
    {
        var acc = CreateValid() with { Name = name };
        acc.Validate().Should().Contain(e => e.Contains("Name"));
    }

    [Fact]
    public void Validate_NameExceedsMaxLength_ReturnsError()
    {
        var acc = CreateValid() with { Name = new string('n', AccountRef.MaxNameLength + 1) };
        acc.Validate().Should().Contain(e => e.Contains("Name") && e.Contains($"{AccountRef.MaxNameLength}"));
    }

    [Theory]
    [InlineData(AccountType.Asset)]
    [InlineData(AccountType.Liability)]
    [InlineData(AccountType.Income)]
    [InlineData(AccountType.Expense)]
    [InlineData(AccountType.Equity)]
    public void Validate_AllAccountTypes_ReturnsNoErrors(AccountType type)
    {
        var acc = CreateValid() with { Type = type };
        acc.Validate().Should().BeEmpty();
    }

    [Fact]
    public void Validate_MultipleErrors_ReturnsAll()
    {
        var acc = CreateValid() with { Id = "", Name = "" };
        acc.Validate().Should().HaveCountGreaterThanOrEqualTo(2);
    }
}
