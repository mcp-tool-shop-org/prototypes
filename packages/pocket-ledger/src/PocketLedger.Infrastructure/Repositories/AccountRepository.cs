using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class AccountRepository : RepositoryBase<Account>, IAccountRepository
{
    public AccountRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Account>> GetActiveAccountsAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Account>> GetByTypeAsync(AccountType type, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(a => a.Type == type)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Account?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower(), cancellationToken);
    }

    public async Task<IReadOnlyList<Account>> GetOrderedByDisplayAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);
    }
}
