using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Interfaces;

public interface IRecurringTransactionRepository : IRepository<RecurringTransaction>
{
    Task<IReadOnlyList<RecurringTransaction>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecurringTransaction>> GetDueAsync(DateOnly asOfDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecurringTransaction>> GetByAccountAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecurringTransaction>> GetUpcomingAsync(int days, CancellationToken cancellationToken = default);
}
