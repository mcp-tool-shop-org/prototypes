using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Application.Interfaces;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<IReadOnlyList<Transaction>> GetByAccountAsync(
        Guid accountId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByDateRangeAsync(
        DateRange range,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByAccountAndDateRangeAsync(
        Guid accountId,
        DateRange range,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByCategoryAndDateRangeAsync(
        Guid categoryId,
        DateRange range,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByTypeAsync(
        TransactionType type,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByTypeAndDateRangeAsync(
        TransactionType type,
        DateRange range,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetRecentAsync(
        int count,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetUnclearedAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetByRecurringIdAsync(
        Guid recurringTransactionId,
        CancellationToken cancellationToken = default);

    Task<Money> GetSumByAccountAsync(
        Guid accountId,
        DateRange? range = null,
        CancellationToken cancellationToken = default);

    Task<Money> GetSumByCategoryAsync(
        Guid categoryId,
        DateRange? range = null,
        CancellationToken cancellationToken = default);
}
