using PocketLedger.Domain.Common;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Entities;

public sealed class Transaction : Entity
{
    public DateOnly Date { get; private set; }
    public Money Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public string Description { get; private set; }
    public string? Notes { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid? CategoryId { get; private set; }
    public Guid? TransferToAccountId { get; private set; }
    public Guid? RecurringTransactionId { get; private set; }
    public bool IsCleared { get; private set; }

    private Transaction() : base()
    {
        Description = string.Empty;
        Amount = Money.Zero();
    }

    public static Transaction CreateExpense(
        DateOnly date,
        Money amount,
        string description,
        Guid accountId,
        Guid? categoryId = null,
        string? notes = null)
    {
        ValidateAmount(amount);
        ValidateDescription(description);

        return new Transaction
        {
            Date = date,
            Amount = amount.IsNegative ? amount : -amount,
            Type = TransactionType.Expense,
            Description = description.Trim(),
            AccountId = accountId,
            CategoryId = categoryId,
            Notes = notes?.Trim(),
            IsCleared = false
        };
    }

    public static Transaction CreateIncome(
        DateOnly date,
        Money amount,
        string description,
        Guid accountId,
        Guid? categoryId = null,
        string? notes = null)
    {
        ValidateAmount(amount);
        ValidateDescription(description);

        return new Transaction
        {
            Date = date,
            Amount = amount.Abs(),
            Type = TransactionType.Income,
            Description = description.Trim(),
            AccountId = accountId,
            CategoryId = categoryId,
            Notes = notes?.Trim(),
            IsCleared = false
        };
    }

    public static Transaction CreateTransfer(
        DateOnly date,
        Money amount,
        string description,
        Guid fromAccountId,
        Guid toAccountId,
        string? notes = null)
    {
        ValidateAmount(amount);
        ValidateDescription(description);

        if (fromAccountId == toAccountId)
            throw new ArgumentException("Cannot transfer to the same account");

        return new Transaction
        {
            Date = date,
            Amount = -amount.Abs(),
            Type = TransactionType.Transfer,
            Description = description.Trim(),
            AccountId = fromAccountId,
            TransferToAccountId = toAccountId,
            Notes = notes?.Trim(),
            IsCleared = false
        };
    }

    public void UpdateDescription(string description)
    {
        ValidateDescription(description);
        Description = description.Trim();
        MarkUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void UpdateDate(DateOnly date)
    {
        Date = date;
        MarkUpdated();
    }

    public void UpdateAmount(Money amount)
    {
        ValidateAmount(amount);

        Amount = Type switch
        {
            TransactionType.Income => amount.Abs(),
            TransactionType.Expense => amount.IsNegative ? amount : -amount,
            TransactionType.Transfer => -amount.Abs(),
            _ => amount
        };

        MarkUpdated();
    }

    public void UpdateCategory(Guid? categoryId)
    {
        if (Type == TransactionType.Transfer && categoryId.HasValue)
            throw new InvalidOperationException("Transfer transactions cannot have a category");

        CategoryId = categoryId;
        MarkUpdated();
    }

    public void MarkCleared()
    {
        IsCleared = true;
        MarkUpdated();
    }

    public void MarkUncleared()
    {
        IsCleared = false;
        MarkUpdated();
    }

    public void LinkToRecurring(Guid recurringTransactionId)
    {
        RecurringTransactionId = recurringTransactionId;
        MarkUpdated();
    }

    private static void ValidateAmount(Money amount)
    {
        if (amount.IsZero)
            throw new ArgumentException("Transaction amount cannot be zero", nameof(amount));
    }

    private static void ValidateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Transaction description cannot be empty", nameof(description));
    }
}
