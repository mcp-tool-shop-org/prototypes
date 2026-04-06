using PocketLedger.Domain.Events;

namespace PocketLedger.Application.Events;

public interface IEventDispatcher
{
    Task DispatchAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent;

    Task DispatchManyAsync(IEnumerable<IDomainEvent> events, CancellationToken cancellationToken = default);
}
