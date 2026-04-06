using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.Interfaces;

public interface IAccountRepository : IRepository<Account>
{
    Task<IReadOnlyList<Account>> GetActiveAccountsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Account>> GetByTypeAsync(AccountType type, CancellationToken cancellationToken = default);
    Task<Account?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Account>> GetOrderedByDisplayAsync(CancellationToken cancellationToken = default);
}
