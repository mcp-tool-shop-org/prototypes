using FluentAssertions;
using PocketLedger.Application.DTOs;
using PocketLedger.Application.Validation;
using PocketLedger.Domain.Enums;
using Xunit;

namespace PocketLedger.Application.Tests.Validation;

public class CreateTransactionValidatorTests
{
    private readonly CreateTransactionValidator _validator = new();

    [Fact]
    public void Validate_WithValidExpense_ShouldSucceed()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 50.00m,
            Type: TransactionType.Expense,
            Description: "Grocery shopping",
            AccountId: Guid.NewGuid(),
            CategoryId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public void Validate_WithValidTransfer_ShouldSucceed()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 100.00m,
            Type: TransactionType.Transfer,
            Description: "Transfer to savings",
            AccountId: Guid.NewGuid(),
            TransferToAccountId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public void Validate_WithZeroAmount_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 0,
            Type: TransactionType.Expense,
            Description: "Test",
            AccountId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("zero");
    }

    [Fact]
    public void Validate_WithEmptyDescription_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 50.00m,
            Type: TransactionType.Expense,
            Description: "",
            AccountId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Description");
    }

    [Fact]
    public void Validate_TransferWithoutDestination_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 100.00m,
            Type: TransactionType.Transfer,
            Description: "Transfer",
            AccountId: Guid.NewGuid(),
            TransferToAccountId: null);

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("destination");
    }

    [Fact]
    public void Validate_TransferToSameAccount_ShouldFail()
    {
        var accountId = Guid.NewGuid();
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 100.00m,
            Type: TransactionType.Transfer,
            Description: "Transfer",
            AccountId: accountId,
            TransferToAccountId: accountId);

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("same account");
    }

    [Fact]
    public void Validate_TransferWithCategory_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 100.00m,
            Type: TransactionType.Transfer,
            Description: "Transfer",
            AccountId: Guid.NewGuid(),
            TransferToAccountId: Guid.NewGuid(),
            CategoryId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("category");
    }

    [Fact]
    public void Validate_ExpenseWithDestinationAccount_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 50.00m,
            Type: TransactionType.Expense,
            Description: "Test",
            AccountId: Guid.NewGuid(),
            TransferToAccountId: Guid.NewGuid());

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("destination");
    }

    [Fact]
    public void Validate_WithInvalidCurrencyCode_ShouldFail()
    {
        var dto = new CreateTransactionDto(
            Date: DateOnly.FromDateTime(DateTime.Today),
            Amount: 50.00m,
            Type: TransactionType.Expense,
            Description: "Test",
            AccountId: Guid.NewGuid(),
            CurrencyCode: "US");

        var result = _validator.Validate(dto);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("3 characters");
    }
}
