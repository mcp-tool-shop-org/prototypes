using PocketLedger.Domain.Common;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Entities;

public sealed class RecurringTransaction : Entity
{
    public string Description { get; private set; }
    public Money Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid? CategoryId { get; private set; }
    public Guid? TransferToAccountId { get; private set; }
    public RecurrencePattern Pattern { get; private set; }
    public int DayOfMonth { get; private set; }
    public DayOfWeek? DayOfWeek { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }
    public DateOnly? LastGeneratedDate { get; private set; }
    public DateOnly NextDueDate { get; private set; }
    public bool IsActive { get; private set; }
    public string? Notes { get; private set; }

    private RecurringTransaction() : base()
    {
        Description = string.Empty;
        Amount = Money.Zero();
        IsActive = true;
    }

    public static RecurringTransaction Create(
        string description,
        Money amount,
        TransactionType type,
        Guid accountId,
        RecurrencePattern pattern,
        DateOnly startDate,
        int dayOfMonth = 1,
        DayOfWeek? dayOfWeek = null,
        Guid? categoryId = null,
        Guid? transferToAccountId = null,
        DateOnly? endDate = null,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description cannot be empty", nameof(description));

        if (amount.IsZero)
            throw new ArgumentException("Amount cannot be zero", nameof(amount));

        if (pattern == RecurrencePattern.None)
            throw new ArgumentException("Recurrence pattern is required", nameof(pattern));

        if (type == TransactionType.Transfer && !transferToAccountId.HasValue)
            throw new ArgumentException("Transfer requires a destination account", nameof(transferToAccountId));

        if (endDate.HasValue && endDate.Value < startDate)
            throw new ArgumentException("End date cannot be before start date", nameof(endDate));

        ValidateDayOfMonth(dayOfMonth);

        var recurring = new RecurringTransaction
        {
            Description = description.Trim(),
            Amount = type == TransactionType.Expense ? -amount.Abs() : amount.Abs(),
            Type = type,
            AccountId = accountId,
            CategoryId = type == TransactionType.Transfer ? null : categoryId,
            TransferToAccountId = transferToAccountId,
            Pattern = pattern,
            DayOfMonth = dayOfMonth,
            DayOfWeek = dayOfWeek,
            StartDate = startDate,
            EndDate = endDate,
            IsActive = true,
            Notes = notes?.Trim()
        };

        recurring.NextDueDate = recurring.CalculateNextDueDate(startDate.AddDays(-1));

        return recurring;
    }

    public void MarkGenerated(DateOnly generatedDate)
    {
        LastGeneratedDate = generatedDate;
        NextDueDate = CalculateNextDueDate(generatedDate);

        if (EndDate.HasValue && NextDueDate > EndDate.Value)
        {
            IsActive = false;
        }

        MarkUpdated();
    }

    public void UpdateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description cannot be empty", nameof(description));

        Description = description.Trim();
        MarkUpdated();
    }

    public void UpdateAmount(Money amount)
    {
        if (amount.IsZero)
            throw new ArgumentException("Amount cannot be zero", nameof(amount));

        Amount = Type == TransactionType.Expense ? -amount.Abs() : amount.Abs();
        MarkUpdated();
    }

    public void UpdateCategory(Guid? categoryId)
    {
        if (Type == TransactionType.Transfer && categoryId.HasValue)
            throw new InvalidOperationException("Transfers cannot have categories");

        CategoryId = categoryId;
        MarkUpdated();
    }

    public void UpdateEndDate(DateOnly? endDate)
    {
        if (endDate.HasValue && endDate.Value < StartDate)
            throw new ArgumentException("End date cannot be before start date", nameof(endDate));

        EndDate = endDate;

        if (EndDate.HasValue && NextDueDate > EndDate.Value)
        {
            IsActive = false;
        }
        else if (!EndDate.HasValue && !IsActive)
        {
            IsActive = true;
        }

        MarkUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void Pause()
    {
        IsActive = false;
        MarkUpdated();
    }

    public void Resume()
    {
        if (EndDate.HasValue && NextDueDate > EndDate.Value)
            throw new InvalidOperationException("Cannot resume: past end date");

        IsActive = true;
        MarkUpdated();
    }

    public bool IsDue(DateOnly asOfDate)
    {
        return IsActive && NextDueDate <= asOfDate;
    }

    private DateOnly CalculateNextDueDate(DateOnly afterDate)
    {
        var candidate = afterDate.AddDays(1);

        return Pattern switch
        {
            RecurrencePattern.Daily => candidate,
            RecurrencePattern.Weekly => CalculateNextWeekly(candidate),
            RecurrencePattern.BiWeekly => CalculateNextBiWeekly(candidate),
            RecurrencePattern.Monthly => CalculateNextMonthly(candidate),
            RecurrencePattern.Quarterly => CalculateNextQuarterly(candidate),
            RecurrencePattern.Yearly => CalculateNextYearly(candidate),
            _ => throw new InvalidOperationException($"Unknown pattern: {Pattern}")
        };
    }

    private DateOnly CalculateNextWeekly(DateOnly afterDate)
    {
        var targetDay = DayOfWeek ?? afterDate.DayOfWeek;
        var daysUntil = ((int)targetDay - (int)afterDate.DayOfWeek + 7) % 7;
        if (daysUntil == 0) daysUntil = 7;
        return afterDate.AddDays(daysUntil);
    }

    private DateOnly CalculateNextBiWeekly(DateOnly afterDate)
    {
        var nextWeekly = CalculateNextWeekly(afterDate);
        var weeksSinceStart = (nextWeekly.DayNumber - StartDate.DayNumber) / 7;
        return weeksSinceStart % 2 == 0 ? nextWeekly : nextWeekly.AddDays(7);
    }

    private DateOnly CalculateNextMonthly(DateOnly afterDate)
    {
        var year = afterDate.Year;
        var month = afterDate.Month;
        var day = Math.Min(DayOfMonth, DateTime.DaysInMonth(year, month));

        var candidate = new DateOnly(year, month, day);
        if (candidate <= afterDate)
        {
            month++;
            if (month > 12)
            {
                month = 1;
                year++;
            }
            day = Math.Min(DayOfMonth, DateTime.DaysInMonth(year, month));
            candidate = new DateOnly(year, month, day);
        }

        return candidate;
    }

    private DateOnly CalculateNextQuarterly(DateOnly afterDate)
    {
        var next = CalculateNextMonthly(afterDate);
        var monthsSinceStart = ((next.Year - StartDate.Year) * 12) + (next.Month - StartDate.Month);
        var remainder = monthsSinceStart % 3;
        if (remainder != 0)
        {
            next = next.AddMonths(3 - remainder);
        }
        return next;
    }

    private DateOnly CalculateNextYearly(DateOnly afterDate)
    {
        var year = afterDate.Year;
        var month = StartDate.Month;
        var day = Math.Min(DayOfMonth, DateTime.DaysInMonth(year, month));

        var candidate = new DateOnly(year, month, day);
        if (candidate <= afterDate)
        {
            year++;
            day = Math.Min(DayOfMonth, DateTime.DaysInMonth(year, month));
            candidate = new DateOnly(year, month, day);
        }

        return candidate;
    }

    private static void ValidateDayOfMonth(int dayOfMonth)
    {
        if (dayOfMonth < 1 || dayOfMonth > 31)
            throw new ArgumentOutOfRangeException(nameof(dayOfMonth), "Day of month must be between 1 and 31");
    }
}
