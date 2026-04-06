using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Validation;

public class CreateAccountValidator : IValidator<CreateAccountDto>
{
    public Result Validate(CreateAccountDto dto)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            result.AddError(nameof(dto.Name), "Account name is required");
        }
        else if (dto.Name.Length > 100)
        {
            result.AddError(nameof(dto.Name), "Account name cannot exceed 100 characters");
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
