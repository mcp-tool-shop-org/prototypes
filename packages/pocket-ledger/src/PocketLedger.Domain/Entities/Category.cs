using PocketLedger.Domain.Common;
using PocketLedger.Domain.Enums;

namespace PocketLedger.Domain.Entities;

public sealed class Category : Entity
{
    public string Name { get; private set; }
    public string? Icon { get; private set; }
    public string? ColorHex { get; private set; }
    public TransactionType Type { get; private set; }
    public Guid? ParentCategoryId { get; private set; }
    public bool IsSystem { get; private set; }
    public bool IsActive { get; private set; }
    public int DisplayOrder { get; private set; }

    private Category() : base()
    {
        Name = string.Empty;
        IsActive = true;
    }

    public static Category Create(
        string name,
        TransactionType type,
        string? icon = null,
        string? colorHex = null,
        Guid? parentCategoryId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty", nameof(name));

        return new Category
        {
            Name = name.Trim(),
            Type = type,
            Icon = icon,
            ColorHex = NormalizeColorHex(colorHex),
            ParentCategoryId = parentCategoryId,
            IsSystem = false,
            IsActive = true,
            DisplayOrder = 0
        };
    }

    public static Category CreateSystem(
        string name,
        TransactionType type,
        string? icon = null,
        string? colorHex = null)
    {
        var category = Create(name, type, icon, colorHex);
        category.IsSystem = true;
        return category;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty", nameof(name));

        if (IsSystem)
            throw new InvalidOperationException("Cannot modify system category name");

        Name = name.Trim();
        MarkUpdated();
    }

    public void UpdateIcon(string? icon)
    {
        Icon = icon;
        MarkUpdated();
    }

    public void UpdateColor(string? colorHex)
    {
        ColorHex = NormalizeColorHex(colorHex);
        MarkUpdated();
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
        MarkUpdated();
    }

    public void Deactivate()
    {
        if (IsSystem)
            throw new InvalidOperationException("Cannot deactivate system category");

        IsActive = false;
        MarkUpdated();
    }

    public void Activate()
    {
        IsActive = true;
        MarkUpdated();
    }

    private static string? NormalizeColorHex(string? colorHex)
    {
        if (string.IsNullOrWhiteSpace(colorHex))
            return null;

        var normalized = colorHex.Trim().ToUpperInvariant();
        if (!normalized.StartsWith('#'))
            normalized = "#" + normalized;

        return normalized;
    }
}
