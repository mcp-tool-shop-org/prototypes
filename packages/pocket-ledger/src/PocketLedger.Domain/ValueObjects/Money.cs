using PocketLedger.Domain.Common;

namespace PocketLedger.Domain.ValueObjects;

public sealed class Money : ValueObject, IComparable<Money>
{
    public decimal Amount { get; }
    public string CurrencyCode { get; }

    private Money(decimal amount, string currencyCode)
    {
        Amount = Math.Round(amount, 2);
        CurrencyCode = currencyCode.ToUpperInvariant();
    }

    public static Money Create(decimal amount, string currencyCode = "USD")
    {
        if (string.IsNullOrWhiteSpace(currencyCode))
            throw new ArgumentException("Currency code cannot be empty", nameof(currencyCode));

        if (currencyCode.Length != 3)
            throw new ArgumentException("Currency code must be 3 characters", nameof(currencyCode));

        return new Money(amount, currencyCode);
    }

    public static Money Zero(string currencyCode = "USD") => Create(0, currencyCode);

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return Create(Amount + other.Amount, CurrencyCode);
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        return Create(Amount - other.Amount, CurrencyCode);
    }

    public Money Negate() => Create(-Amount, CurrencyCode);

    public Money Abs() => Create(Math.Abs(Amount), CurrencyCode);

    public bool IsZero => Amount == 0;
    public bool IsPositive => Amount > 0;
    public bool IsNegative => Amount < 0;

    private void EnsureSameCurrency(Money other)
    {
        if (CurrencyCode != other.CurrencyCode)
            throw new InvalidOperationException(
                $"Cannot perform operation on different currencies: {CurrencyCode} and {other.CurrencyCode}");
    }

    public int CompareTo(Money? other)
    {
        if (other is null) return 1;
        EnsureSameCurrency(other);
        return Amount.CompareTo(other.Amount);
    }

    public static Money operator +(Money left, Money right) => left.Add(right);
    public static Money operator -(Money left, Money right) => left.Subtract(right);
    public static Money operator -(Money money) => money.Negate();
    public static bool operator >(Money left, Money right) => left.CompareTo(right) > 0;
    public static bool operator <(Money left, Money right) => left.CompareTo(right) < 0;
    public static bool operator >=(Money left, Money right) => left.CompareTo(right) >= 0;
    public static bool operator <=(Money left, Money right) => left.CompareTo(right) <= 0;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return CurrencyCode;
    }

    public override string ToString() => $"{CurrencyCode} {Amount:N2}";
}
