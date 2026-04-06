using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.Validation;

public class CreateTransactionValidator : IValidator<CreateTransactionDto>
{
    public Result Validate(CreateTransactionDto dto)
    {
        var result = new ValidationResult();

        if (dto.Amount == 0)
        {
            result.AddError(nameof(dto.Amount), "Transaction amount cannot be zero");
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            result.AddError(nameof(dto.Description), "Description is required");
        }
        else if (dto.Description.Length > 200)
        {
            result.AddError(nameof(dto.Description), "Description cannot exceed 200 characters");
        }

        if (dto.AccountId == Guid.Empty)
        {
            result.AddError(nameof(dto.AccountId), "Account is required");
        }

        if (dto.Type == TransactionType.Transfer)
        {
            if (!dto.TransferToAccountId.HasValue || dto.TransferToAccountId == Guid.Empty)
            {
                result.AddError(nameof(dto.TransferToAccountId), "Transfer destination account is required");
            }
            else if (dto.TransferToAccountId == dto.AccountId)
            {
                result.AddError(nameof(dto.TransferToAccountId), "Cannot transfer to the same account");
            }

            if (dto.CategoryId.HasValue)
            {
                result.AddError(nameof(dto.CategoryId), "Transfers cannot have a category");
            }
        }
        else
        {
            if (dto.TransferToAccountId.HasValue)
            {
                result.AddError(nameof(dto.TransferToAccountId), "Only transfers can have a destination account");
            }
        }

        if (string.IsNullOrWhiteSpace(dto.CurrencyCode))
        {
            result.AddError(nameof(dto.CurrencyCode), "Currency code is required");
        }
        else if (dto.CurrencyCode.Length != 3)
        {
            result.AddError(nameof(dto.CurrencyCode), "Currency code must be 3 characters");
        }

        return result.IsValid
            ? Result.Success()
            : Result.Failure(result.GetErrorMessage());
    }
}
