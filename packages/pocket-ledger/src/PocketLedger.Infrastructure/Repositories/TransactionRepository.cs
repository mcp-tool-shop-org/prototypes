using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class TransactionRepository : RepositoryBase<Transaction>, ITransactionRepository
{
    public TransactionRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Transaction>> GetByAccountAsync(
        Guid accountId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.AccountId == accountId || t.TransferToAccountId == accountId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByDateRangeAsync(
        DateRange range,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.Date >= range.StartDate && t.Date <= range.EndDate)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByAccountAndDateRangeAsync(
        Guid accountId,
        DateRange range,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => (t.AccountId == accountId || t.TransferToAccountId == accountId) &&
                       t.Date >= range.StartDate && t.Date <= range.EndDate)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.CategoryId == categoryId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByCategoryAndDateRangeAsync(
        Guid categoryId,
        DateRange range,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.CategoryId == categoryId &&
                       t.Date >= range.StartDate && t.Date <= range.EndDate)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByTypeAsync(
        TransactionType type,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.Type == type)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByTypeAndDateRangeAsync(
        TransactionType type,
        DateRange range,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.Type == type &&
                       t.Date >= range.StartDate && t.Date <= range.EndDate)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetRecentAsync(
        int count,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetUnclearedAsync(
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => !t.IsCleared)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Transaction>> GetByRecurringIdAsync(
        Guid recurringTransactionId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(t => t.RecurringTransactionId == recurringTransactionId)
            .OrderByDescending(t => t.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<Money> GetSumByAccountAsync(
        Guid accountId,
        DateRange? range = null,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(t => t.AccountId == accountId);

        if (range is not null)
        {
            query = query.Where(t => t.Date >= range.StartDate && t.Date <= range.EndDate);
        }

        var transactions = await query.ToListAsync(cancellationToken);

        if (!transactions.Any())
            return Money.Zero();

        var currency = transactions.First().Amount.CurrencyCode;
        var sum = transactions.Sum(t => t.Amount.Amount);

        return Money.Create(sum, currency);
    }

    public async Task<Money> GetSumByCategoryAsync(
        Guid categoryId,
        DateRange? range = null,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(t => t.CategoryId == categoryId);

        if (range is not null)
        {
            query = query.Where(t => t.Date >= range.StartDate && t.Date <= range.EndDate);
        }

        var transactions = await query.ToListAsync(cancellationToken);

        if (!transactions.Any())
            return Money.Zero();

        var currency = transactions.First().Amount.CurrencyCode;
        var sum = transactions.Sum(t => t.Amount.Amount);

        return Money.Create(sum, currency);
    }
}
