using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string? Icon,
    string? ColorHex,
    TransactionType Type,
    Guid? ParentCategoryId,
    bool IsSystem,
    bool IsActive,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateCategoryDto(
    string Name,
    TransactionType Type,
    string? Icon = null,
    string? ColorHex = null,
    Guid? ParentCategoryId = null);

public record UpdateCategoryDto(
    string? Name = null,
    string? Icon = null,
    string? ColorHex = null,
    int? DisplayOrder = null);
