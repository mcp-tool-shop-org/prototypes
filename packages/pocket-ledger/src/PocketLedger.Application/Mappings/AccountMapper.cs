using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Mappings;

public static class AccountMapper
{
    public static AccountDto ToDto(this Account account)
    {
        return new AccountDto(
            Id: account.Id,
            Name: account.Name,
            Type: account.Type,
            CurrencyCode: account.CurrencyCode,
            Balance: account.Balance.Amount,
            IsActive: account.IsActive,
            Notes: account.Notes,
            DisplayOrder: account.DisplayOrder,
            CreatedAt: account.CreatedAt,
            UpdatedAt: account.UpdatedAt);
    }

    public static IReadOnlyList<AccountDto> ToDtos(this IEnumerable<Account> accounts)
    {
        return accounts.Select(a => a.ToDto()).ToList();
    }
}
