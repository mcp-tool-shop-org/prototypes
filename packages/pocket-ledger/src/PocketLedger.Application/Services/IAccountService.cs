using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;
using PocketLedger.Domain.Enums;

namespace PocketLedger.Application.Services;

public interface IAccountService
{
    Task<Result<AccountDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<AccountDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<AccountDto>>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<AccountDto>>> GetByTypeAsync(AccountType type, CancellationToken cancellationToken = default);
    Task<Result<AccountDto>> CreateAsync(CreateAccountDto dto, CancellationToken cancellationToken = default);
    Task<Result<AccountDto>> UpdateAsync(Guid id, UpdateAccountDto dto, CancellationToken cancellationToken = default);
    Task<Result> DeactivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> ActivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
