using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Validation;

public class CreateCategoryValidator : IValidator<CreateCategoryDto>
{
    public Result Validate(CreateCategoryDto dto)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            result.AddError(nameof(dto.Name), "Category name is required");
        }
        else if (dto.Name.Length > 100)
        {
            result.AddError(nameof(dto.Name), "Category name cannot exceed 100 characters");
        }

        if (dto.ColorHex is not null && !IsValidHexColor(dto.ColorHex))
        {
            result.AddError(nameof(dto.ColorHex), "Invalid color format. Use hex format (e.g., #FF5733)");
        }

        return result.IsValid
            ? Result.Success()
            : Result.Failure(result.GetErrorMessage());
    }

    private static bool IsValidHexColor(string color)
    {
        var normalized = color.TrimStart('#');
        if (normalized.Length != 6 && normalized.Length != 3)
            return false;

        return normalized.All(c => char.IsDigit(c) ||
                                   (c >= 'A' && c <= 'F') ||
                                   (c >= 'a' && c <= 'f'));
    }
}
