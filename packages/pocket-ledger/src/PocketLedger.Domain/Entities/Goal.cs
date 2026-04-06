using PocketLedger.Domain.Common;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Entities;

public sealed class Goal : Entity
{
    public string Name { get; private set; }
    public Money TargetAmount { get; private set; }
    public Money CurrentAmount { get; private set; }
    public DateOnly? TargetDate { get; private set; }
    public string? Notes { get; private set; }
    public string? Icon { get; private set; }
    public string? ColorHex { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public bool IsArchived { get; private set; }
    public int DisplayOrder { get; private set; }

    private Goal() : base()
    {
        Name = string.Empty;
        TargetAmount = Money.Zero();
        CurrentAmount = Money.Zero();
    }

    public static Goal Create(
        string name,
        Money targetAmount,
        DateOnly? targetDate = null,
        string? notes = null,
        string? icon = null,
        string? colorHex = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Goal name cannot be empty", nameof(name));

        if (targetAmount.IsZero || targetAmount.IsNegative)
            throw new ArgumentException("Target amount must be positive", nameof(targetAmount));

        return new Goal
        {
            Name = name.Trim(),
            TargetAmount = targetAmount,
            CurrentAmount = Money.Zero(targetAmount.CurrencyCode),
            TargetDate = targetDate,
            Notes = notes?.Trim(),
            Icon = icon,
            ColorHex = NormalizeColorHex(colorHex),
            IsCompleted = false,
            IsArchived = false,
            DisplayOrder = 0
        };
    }

    public Money RemainingAmount => TargetAmount - CurrentAmount;

    public decimal PercentComplete => TargetAmount.IsZero
        ? 0
        : Math.Min(100, Math.Round((CurrentAmount.Amount / TargetAmount.Amount) * 100, 2));

    public int? DaysRemaining => TargetDate.HasValue
        ? Math.Max(0, TargetDate.Value.DayNumber - DateOnly.FromDateTime(DateTime.Today).DayNumber)
        : null;

    public Money? RequiredMonthlyContribution
    {
        get
        {
            if (!TargetDate.HasValue || IsCompleted)
                return null;

            var today = DateOnly.FromDateTime(DateTime.Today);
            if (TargetDate.Value <= today)
                return RemainingAmount;

            var monthsRemaining = ((TargetDate.Value.Year - today.Year) * 12) +
                                  (TargetDate.Value.Month - today.Month);

            if (monthsRemaining <= 0)
                return RemainingAmount;

            var monthlyAmount = RemainingAmount.Amount / monthsRemaining;
            return Money.Create(monthlyAmount, TargetAmount.CurrencyCode);
        }
    }

    public void AddContribution(Money amount)
    {
        if (amount.IsNegative)
            throw new ArgumentException("Contribution cannot be negative", nameof(amount));

        if (amount.CurrencyCode != CurrentAmount.CurrencyCode)
            throw new InvalidOperationException("Currency mismatch");

        if (IsCompleted)
            throw new InvalidOperationException("Cannot add contribution to completed goal");

        CurrentAmount = CurrentAmount + amount;

        if (CurrentAmount >= TargetAmount)
        {
            IsCompleted = true;
            CompletedAt = DateTime.UtcNow;
        }

        MarkUpdated();
    }

    public void RemoveContribution(Money amount)
    {
        if (amount.IsNegative)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));

        if (amount.CurrencyCode != CurrentAmount.CurrencyCode)
            throw new InvalidOperationException("Currency mismatch");

        var newAmount = CurrentAmount - amount;
        CurrentAmount = newAmount.IsNegative ? Money.Zero(CurrentAmount.CurrencyCode) : newAmount;

        if (IsCompleted && CurrentAmount < TargetAmount)
        {
            IsCompleted = false;
            CompletedAt = null;
        }

        MarkUpdated();
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Goal name cannot be empty", nameof(name));

        Name = name.Trim();
        MarkUpdated();
    }

    public void UpdateTargetAmount(Money amount)
    {
        if (amount.IsZero || amount.IsNegative)
            throw new ArgumentException("Target amount must be positive", nameof(amount));

        if (amount.CurrencyCode != TargetAmount.CurrencyCode)
            throw new InvalidOperationException("Cannot change goal currency");

        TargetAmount = amount;

        if (CurrentAmount >= TargetAmount && !IsCompleted)
        {
            IsCompleted = true;
            CompletedAt = DateTime.UtcNow;
        }
        else if (CurrentAmount < TargetAmount && IsCompleted)
        {
            IsCompleted = false;
            CompletedAt = null;
        }

        MarkUpdated();
    }

    public void UpdateTargetDate(DateOnly? targetDate)
    {
        TargetDate = targetDate;
        MarkUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
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

    public void Archive()
    {
        IsArchived = true;
        MarkUpdated();
    }

    public void Unarchive()
    {
        IsArchived = false;
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
