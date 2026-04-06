using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Enums;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Application.Services;

public interface ITransactionService
{
    Task<Result<TransactionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TransactionDto>>> GetByAccountAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TransactionDto>>> GetByDateRangeAsync(DateOnly start, DateOnly end, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TransactionDto>>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TransactionDto>>> GetByTypeAsync(TransactionType type, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<TransactionDto>>> GetRecentAsync(int count = 20, CancellationToken cancellationToken = default);
    Task<Result<TransactionDto>> CreateAsync(CreateTransactionDto dto, CancellationToken cancellationToken = default);
    Task<Result<TransactionDto>> UpdateAsync(Guid id, UpdateTransactionDto dto, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> MarkClearedAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> MarkUnclearedAsync(Guid id, CancellationToken cancellationToken = default);
}
