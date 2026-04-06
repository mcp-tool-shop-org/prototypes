using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Attestia.Core.Models;

public sealed record Money
{
    /// <summary>Maximum length for the amount string representation.</summary>
    public const int MaxAmountLength = 78;

    /// <summary>Maximum length for currency codes (ISO 4217 or token symbols).</summary>
    public const int MaxCurrencyLength = 12;

    /// <summary>Maximum decimal places supported.</summary>
    public const int MaxDecimals = 18;

    /// <summary>Regex for valid amount strings: optional sign, digits, optional decimal.</summary>
    public static readonly Regex AmountPattern = new(@"^-?\d+(\.\d+)?$", RegexOptions.Compiled);

    [JsonPropertyName("amount")]
    [StringLength(MaxAmountLength, MinimumLength = 1)]
    public required string Amount { get; init; }

    [JsonPropertyName("currency")]
    [StringLength(MaxCurrencyLength, MinimumLength = 1)]
    public required string Currency { get; init; }

    [JsonPropertyName("decimals")]
    [Range(0, MaxDecimals)]
    public required int Decimals { get; init; }

    /// <summary>
    /// Validates this Money instance and returns a list of validation errors.
    /// Returns an empty list when valid.
    /// </summary>
    public IReadOnlyList<string> Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Amount))
            errors.Add("Amount is required.");
        else if (Amount.Length > MaxAmountLength)
            errors.Add($"Amount must not exceed {MaxAmountLength} characters.");
        else if (!AmountPattern.IsMatch(Amount))
            errors.Add("Amount must be a valid numeric string (e.g. '100', '99.95', '-50.00').");

        if (string.IsNullOrWhiteSpace(Currency))
            errors.Add("Currency is required.");
        else if (Currency.Length > MaxCurrencyLength)
            errors.Add($"Currency must not exceed {MaxCurrencyLength} characters.");

        if (Decimals < 0 || Decimals > MaxDecimals)
            errors.Add($"Decimals must be between 0 and {MaxDecimals}.");

        return errors;
    }
}

public sealed record AccountRef
{
    /// <summary>Maximum length for account identifiers.</summary>
    public const int MaxIdLength = 128;

    /// <summary>Maximum length for account names.</summary>
    public const int MaxNameLength = 256;

    [JsonPropertyName("id")]
    [StringLength(MaxIdLength, MinimumLength = 1)]
    public required string Id { get; init; }

    [JsonPropertyName("type")]
    public required AccountType Type { get; init; }

    [JsonPropertyName("name")]
    [StringLength(MaxNameLength, MinimumLength = 1)]
    public required string Name { get; init; }

    /// <summary>
    /// Validates this AccountRef instance and returns a list of validation errors.
    /// Returns an empty list when valid.
    /// </summary>
    public IReadOnlyList<string> Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Id))
            errors.Add("Id is required.");
        else if (Id.Length > MaxIdLength)
            errors.Add($"Id must not exceed {MaxIdLength} characters.");

        if (string.IsNullOrWhiteSpace(Name))
            errors.Add("Name is required.");
        else if (Name.Length > MaxNameLength)
            errors.Add($"Name must not exceed {MaxNameLength} characters.");

        if (!Enum.IsDefined(Type))
            errors.Add($"Type '{Type}' is not a valid AccountType.");

        return errors;
    }
}

[JsonConverter(typeof(JsonStringEnumConverter<AccountType>))]
public enum AccountType
{
    [JsonStringEnumMemberName("asset")] Asset,
    [JsonStringEnumMemberName("liability")] Liability,
    [JsonStringEnumMemberName("income")] Income,
    [JsonStringEnumMemberName("expense")] Expense,
    [JsonStringEnumMemberName("equity")] Equity,
}

[JsonConverter(typeof(JsonStringEnumConverter<LedgerEntryType>))]
public enum LedgerEntryType
{
    [JsonStringEnumMemberName("debit")] Debit,
    [JsonStringEnumMemberName("credit")] Credit,
}

public sealed record LedgerEntry
{
    /// <summary>Maximum length for ledger entry identifiers.</summary>
    public const int MaxIdLength = 128;

    [JsonPropertyName("id")]
    [StringLength(MaxIdLength, MinimumLength = 1)]
    public required string Id { get; init; }

    [JsonPropertyName("accountId")]
    [StringLength(MaxIdLength, MinimumLength = 1)]
    public required string AccountId { get; init; }

    [JsonPropertyName("type")]
    public required LedgerEntryType Type { get; init; }

    [JsonPropertyName("money")]
    public required Money Money { get; init; }

    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }

    [JsonPropertyName("intentId")]
    public string? IntentId { get; init; }

    [JsonPropertyName("txHash")]
    public string? TxHash { get; init; }

    [JsonPropertyName("correlationId")]
    [StringLength(MaxIdLength, MinimumLength = 1)]
    public required string CorrelationId { get; init; }

    /// <summary>
    /// Validates this LedgerEntry instance and returns a list of validation errors.
    /// Returns an empty list when valid.
    /// </summary>
    public IReadOnlyList<string> Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Id))
            errors.Add("Id is required.");
        else if (Id.Length > MaxIdLength)
            errors.Add($"Id must not exceed {MaxIdLength} characters.");

        if (string.IsNullOrWhiteSpace(AccountId))
            errors.Add("AccountId is required.");
        else if (AccountId.Length > MaxIdLength)
            errors.Add($"AccountId must not exceed {MaxIdLength} characters.");

        if (!Enum.IsDefined(Type))
            errors.Add($"Type '{Type}' is not a valid LedgerEntryType.");

        errors.AddRange(Money.Validate());

        if (string.IsNullOrWhiteSpace(Timestamp))
            errors.Add("Timestamp is required.");

        if (string.IsNullOrWhiteSpace(CorrelationId))
            errors.Add("CorrelationId is required.");
        else if (CorrelationId.Length > MaxIdLength)
            errors.Add($"CorrelationId must not exceed {MaxIdLength} characters.");

        return errors;
    }
}
