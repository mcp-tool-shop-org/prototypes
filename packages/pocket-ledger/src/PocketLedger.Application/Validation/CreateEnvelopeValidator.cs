using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Validation;

public class CreateEnvelopeValidator : IValidator<CreateEnvelopeDto>
{
    public Result Validate(CreateEnvelopeDto dto)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            result.AddError(nameof(dto.Name), "Envelope name is required");
        }
        else if (dto.Name.Length > 100)
        {
            result.AddError(nameof(dto.Name), "Envelope name cannot exceed 100 characters");
        }

        if (dto.CategoryId == Guid.Empty)
        {
            result.AddError(nameof(dto.CategoryId), "Category is required");
        }

        if (dto.Month < 1 || dto.Month > 12)
        {
            result.AddError(nameof(dto.Month), "Month must be between 1 and 12");
        }

        if (dto.Year < 2000 || dto.Year > 2100)
        {
            result.AddError(nameof(dto.Year), "Year must be between 2000 and 2100");
        }

        if (dto.Allocated < 0)
        {
            result.AddError(nameof(dto.Allocated), "Allocation cannot be negative");
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
