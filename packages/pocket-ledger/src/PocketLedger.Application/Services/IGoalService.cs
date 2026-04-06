using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Services;

public interface IGoalService
{
    Task<Result<GoalDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<GoalDto>>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<GoalDto>>> GetCompletedAsync(CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<GoalDto>>> GetArchivedAsync(CancellationToken cancellationToken = default);
    Task<Result<GoalDto>> CreateAsync(CreateGoalDto dto, CancellationToken cancellationToken = default);
    Task<Result<GoalDto>> UpdateAsync(Guid id, UpdateGoalDto dto, CancellationToken cancellationToken = default);
    Task<Result<GoalDto>> AddContributionAsync(GoalContributionDto dto, CancellationToken cancellationToken = default);
    Task<Result<GoalDto>> RemoveContributionAsync(GoalContributionDto dto, CancellationToken cancellationToken = default);
    Task<Result> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
