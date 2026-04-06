using PocketLedger.Application.Common;
using PocketLedger.Application.DTOs;

namespace PocketLedger.Application.Services;

public interface IBudgetService
{
    Task<Result<IReadOnlyList<EnvelopeDto>>> GetEnvelopesForPeriodAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<Result<EnvelopeDto>> GetEnvelopeByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<EnvelopeDto>> CreateEnvelopeAsync(CreateEnvelopeDto dto, CancellationToken cancellationToken = default);
    Task<Result<EnvelopeDto>> UpdateEnvelopeAsync(Guid id, UpdateEnvelopeDto dto, CancellationToken cancellationToken = default);
    Task<Result> DeleteEnvelopeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<EnvelopeDto>>> GetOverBudgetEnvelopesAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<Result> CopyEnvelopesToNextMonthAsync(int fromYear, int fromMonth, CancellationToken cancellationToken = default);
    Task<Result<BudgetSummaryDto>> GetBudgetSummaryAsync(int year, int month, CancellationToken cancellationToken = default);
}

public record BudgetSummaryDto(
    int Year,
    int Month,
    decimal TotalAllocated,
    decimal TotalSpent,
    decimal TotalRemaining,
    int EnvelopeCount,
    int OverBudgetCount,
    string CurrencyCode);
