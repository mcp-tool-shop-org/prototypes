using PocketLedger.Domain.Entities;

namespace PocketLedger.Application.Interfaces;

public interface IEnvelopeRepository : IRepository<Envelope>
{
    Task<IReadOnlyList<Envelope>> GetByPeriodAsync(
        int year,
        int month,
        CancellationToken cancellationToken = default);

    Task<Envelope?> GetByCategoryAndPeriodAsync(
        Guid categoryId,
        int year,
        int month,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Envelope>> GetByCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Envelope>> GetOverBudgetAsync(
        int year,
        int month,
        CancellationToken cancellationToken = default);
}
