using PocketLedger.Domain.Common;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Entities;

public sealed class Envelope : Entity
{
    public string Name { get; private set; }
    public Guid CategoryId { get; private set; }
    public Money Allocated { get; private set; }
    public Money Spent { get; private set; }
    public int Year { get; private set; }
    public int Month { get; private set; }
    public string? Notes { get; private set; }

    private Envelope() : base()
    {
        Name = string.Empty;
        Allocated = Money.Zero();
        Spent = Money.Zero();
    }

    public static Envelope Create(
        string name,
        Guid categoryId,
        int year,
        int month,
        Money? allocated = null,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Envelope name cannot be empty", nameof(name));

        if (month < 1 || month > 12)
            throw new ArgumentOutOfRangeException(nameof(month), "Month must be between 1 and 12");

        if (year < 2000 || year > 2100)
            throw new ArgumentOutOfRangeException(nameof(year), "Year must be between 2000 and 2100");

        var currencyCode = allocated?.CurrencyCode ?? "USD";

        return new Envelope
        {
            Name = name.Trim(),
            CategoryId = categoryId,
            Year = year,
            Month = month,
            Allocated = allocated ?? Money.Zero(currencyCode),
            Spent = Money.Zero(currencyCode),
            Notes = notes?.Trim()
        };
    }

    public Money Remaining => Allocated - Spent;

    public decimal PercentUsed => Allocated.IsZero
        ? 0
        : Math.Round((Spent.Amount / Allocated.Amount) * 100, 2);

    public bool IsOverBudget => Spent > Allocated;

    public DateRange Period => DateRange.ForMonth(Year, Month);

    public void SetAllocation(Money amount)
    {
        if (amount.IsNegative)
            throw new ArgumentException("Allocation cannot be negative", nameof(amount));

        if (amount.CurrencyCode != Allocated.CurrencyCode)
            throw new InvalidOperationException("Currency mismatch with envelope");

        Allocated = amount;
        MarkUpdated();
    }

    public void AddSpending(Money amount)
    {
        if (amount.IsNegative)
            throw new ArgumentException("Spending amount cannot be negative", nameof(amount));

        if (amount.CurrencyCode != Spent.CurrencyCode)
            throw new InvalidOperationException("Currency mismatch with envelope");

        Spent = Spent + amount;
        MarkUpdated();
    }

    public void RemoveSpending(Money amount)
    {
        if (amount.IsNegative)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));

        if (amount.CurrencyCode != Spent.CurrencyCode)
            throw new InvalidOperationException("Currency mismatch with envelope");

        var newSpent = Spent - amount;
        Spent = newSpent.IsNegative ? Money.Zero(Spent.CurrencyCode) : newSpent;
        MarkUpdated();
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Envelope name cannot be empty", nameof(name));

        Name = name.Trim();
        MarkUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void ResetSpending()
    {
        Spent = Money.Zero(Spent.CurrencyCode);
        MarkUpdated();
    }
}
