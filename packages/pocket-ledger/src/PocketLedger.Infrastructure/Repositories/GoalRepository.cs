using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class GoalRepository : RepositoryBase<Goal>, IGoalRepository
{
    public GoalRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Goal>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(g => !g.IsCompleted && !g.IsArchived)
            .OrderBy(g => g.DisplayOrder)
            .ThenBy(g => g.TargetDate)
            .ThenBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Goal>> GetCompletedAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(g => g.IsCompleted && !g.IsArchived)
            .OrderByDescending(g => g.CompletedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Goal>> GetArchivedAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(g => g.IsArchived)
            .OrderByDescending(g => g.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Goal>> GetByTargetDateRangeAsync(
        DateOnly start,
        DateOnly end,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(g => g.TargetDate.HasValue &&
                       g.TargetDate.Value >= start &&
                       g.TargetDate.Value <= end &&
                       !g.IsArchived)
            .OrderBy(g => g.TargetDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Goal>> GetOrderedByDisplayAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(g => !g.IsArchived)
            .OrderBy(g => g.DisplayOrder)
            .ThenBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }
}
