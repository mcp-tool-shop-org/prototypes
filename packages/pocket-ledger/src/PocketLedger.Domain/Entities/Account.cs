using PocketLedger.Domain.Common;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Domain.Entities;

public sealed class Account : Entity
{
    public string Name { get; private set; }
    public AccountType Type { get; private set; }
    public string CurrencyCode { get; private set; }
    public Money Balance { get; private set; }
    public bool IsActive { get; private set; }
    public string? Notes { get; private set; }
    public int DisplayOrder { get; private set; }

    private Account() : base()
    {
        Name = string.Empty;
        CurrencyCode = "USD";
        Balance = Money.Zero();
        IsActive = true;
    }

    public static Account Create(
        string name,
        AccountType type,
        string currencyCode = "USD",
        decimal initialBalance = 0,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Account name cannot be empty", nameof(name));

        var account = new Account
        {
            Name = name.Trim(),
            Type = type,
            CurrencyCode = currencyCode.ToUpperInvariant(),
            Balance = Money.Create(initialBalance, currencyCode),
            Notes = notes?.Trim(),
            IsActive = true,
            DisplayOrder = 0
        };

        return account;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Account name cannot be empty", nameof(name));

        Name = name.Trim();
        MarkUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }

    public void Activate()
    {
        IsActive = true;
        MarkUpdated();
    }

    public void AdjustBalance(Money amount)
    {
        Balance = Balance.Add(amount);
        MarkUpdated();
    }

    public void SetBalance(Money balance)
    {
        if (balance.CurrencyCode != CurrencyCode)
            throw new InvalidOperationException(
                $"Balance currency {balance.CurrencyCode} does not match account currency {CurrencyCode}");

        Balance = balance;
        MarkUpdated();
    }
}
