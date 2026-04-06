using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class EnvelopeRepository : RepositoryBase<Envelope>, IEnvelopeRepository
{
    public EnvelopeRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Envelope>> GetByPeriodAsync(
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(e => e.Year == year && e.Month == month)
            .OrderBy(e => e.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Envelope?> GetByCategoryAndPeriodAsync(
        Guid categoryId,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .FirstOrDefaultAsync(e =>
                e.CategoryId == categoryId &&
                e.Year == year &&
                e.Month == month,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Envelope>> GetByCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(e => e.CategoryId == categoryId)
            .OrderByDescending(e => e.Year)
            .ThenByDescending(e => e.Month)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Envelope>> GetOverBudgetAsync(
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        var envelopes = await GetByPeriodAsync(year, month, cancellationToken);
        return envelopes.Where(e => e.IsOverBudget).ToList();
    }
}
