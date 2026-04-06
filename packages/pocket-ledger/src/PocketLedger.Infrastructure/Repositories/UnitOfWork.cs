using Microsoft.EntityFrameworkCore.Storage;
using PocketLedger.Application.Interfaces;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly PocketLedgerDbContext _context;
    private IDbContextTransaction? _transaction;

    private IAccountRepository? _accounts;
    private ITransactionRepository? _transactions;
    private ICategoryRepository? _categories;
    private IEnvelopeRepository? _envelopes;
    private IGoalRepository? _goals;
    private IRecurringTransactionRepository? _recurringTransactions;

    public UnitOfWork(PocketLedgerDbContext context)
    {
        _context = context;
    }

    public IAccountRepository Accounts =>
        _accounts ??= new AccountRepository(_context);

    public ITransactionRepository Transactions =>
        _transactions ??= new TransactionRepository(_context);

    public ICategoryRepository Categories =>
        _categories ??= new CategoryRepository(_context);

    public IEnvelopeRepository Envelopes =>
        _envelopes ??= new EnvelopeRepository(_context);

    public IGoalRepository Goals =>
        _goals ??= new GoalRepository(_context);

    public IRecurringTransactionRepository RecurringTransactions =>
        _recurringTransactions ??= new RecurringTransactionRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            throw new InvalidOperationException("No transaction in progress");

        await _transaction.CommitAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            throw new InvalidOperationException("No transaction in progress");

        await _transaction.RollbackAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
