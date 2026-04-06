using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Mappings;

public static class EnvelopeMapper
{
    public static EnvelopeDto ToDto(this Envelope envelope, string? categoryName = null)
    {
        return new EnvelopeDto(
            Id: envelope.Id,
            Name: envelope.Name,
            CategoryId: envelope.CategoryId,
            CategoryName: categoryName,
            Allocated: envelope.Allocated.Amount,
            Spent: envelope.Spent.Amount,
            Remaining: envelope.Remaining.Amount,
            PercentUsed: envelope.PercentUsed,
            IsOverBudget: envelope.IsOverBudget,
            Year: envelope.Year,
            Month: envelope.Month,
            Notes: envelope.Notes,
            CurrencyCode: envelope.Allocated.CurrencyCode,
            CreatedAt: envelope.CreatedAt,
            UpdatedAt: envelope.UpdatedAt);
    }
}
