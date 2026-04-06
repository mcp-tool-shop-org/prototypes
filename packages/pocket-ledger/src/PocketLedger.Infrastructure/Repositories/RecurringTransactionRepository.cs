using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class RecurringTransactionRepository : RepositoryBase<RecurringTransaction>, IRecurringTransactionRepository
{
    public RecurringTransactionRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetActiveAsync(
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(r => r.IsActive)
            .OrderBy(r => r.NextDueDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetDueAsync(
        DateOnly asOfDate,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(r => r.IsActive && r.NextDueDate <= asOfDate)
            .OrderBy(r => r.NextDueDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetByAccountAsync(
        Guid accountId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(r => r.AccountId == accountId || r.TransferToAccountId == accountId)
            .OrderBy(r => r.NextDueDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RecurringTransaction>> GetUpcomingAsync(
        int days,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var endDate = today.AddDays(days);

        return await DbSet
            .Where(r => r.IsActive && r.NextDueDate >= today && r.NextDueDate <= endDate)
            .OrderBy(r => r.NextDueDate)
            .ToListAsync(cancellationToken);
    }
}
