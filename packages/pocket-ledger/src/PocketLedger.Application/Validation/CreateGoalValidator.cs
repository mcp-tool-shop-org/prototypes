using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Validation;

public class CreateGoalValidator : IValidator<CreateGoalDto>
{
    public Result Validate(CreateGoalDto dto)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            result.AddError(nameof(dto.Name), "Goal name is required");
        }
        else if (dto.Name.Length > 100)
        {
            result.AddError(nameof(dto.Name), "Goal name cannot exceed 100 characters");
        }

        if (dto.TargetAmount <= 0)
        {
            result.AddError(nameof(dto.TargetAmount), "Target amount must be greater than zero");
        }

        if (dto.TargetDate.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            if (dto.TargetDate.Value < today)
            {
                result.AddError(nameof(dto.TargetDate), "Target date cannot be in the past");
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
