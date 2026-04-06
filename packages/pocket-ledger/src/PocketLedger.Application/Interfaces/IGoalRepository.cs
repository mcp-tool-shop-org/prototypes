using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Interfaces;

public interface IGoalRepository : IRepository<Goal>
{
    Task<IReadOnlyList<Goal>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Goal>> GetCompletedAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Goal>> GetArchivedAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Goal>> GetByTargetDateRangeAsync(DateOnly start, DateOnly end, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Goal>> GetOrderedByDisplayAsync(CancellationToken cancellationToken = default);
}
