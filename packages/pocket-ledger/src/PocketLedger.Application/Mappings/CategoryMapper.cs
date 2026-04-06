using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Mappings;

public static class CategoryMapper
{
    public static CategoryDto ToDto(this Category category)
    {
        return new CategoryDto(
            Id: category.Id,
            Name: category.Name,
            Icon: category.Icon,
            ColorHex: category.ColorHex,
            Type: category.Type,
            ParentCategoryId: category.ParentCategoryId,
            IsSystem: category.IsSystem,
            IsActive: category.IsActive,
            DisplayOrder: category.DisplayOrder,
            CreatedAt: category.CreatedAt,
            UpdatedAt: category.UpdatedAt);
    }

    public static IReadOnlyList<CategoryDto> ToDtos(this IEnumerable<Category> categories)
    {
        return categories.Select(c => c.ToDto()).ToList();
    }
}
