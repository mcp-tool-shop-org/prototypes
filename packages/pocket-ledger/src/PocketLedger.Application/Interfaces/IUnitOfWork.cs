namespace PocketLedger.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IAccountRepository Accounts { get; }
    ITransactionRepository Transactions { get; }
    ICategoryRepository Categories { get; }
    IEnvelopeRepository Envelopes { get; }
    IGoalRepository Goals { get; }
    IRecurringTransactionRepository RecurringTransactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
