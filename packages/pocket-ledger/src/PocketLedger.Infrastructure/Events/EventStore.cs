using PocketLedger.Domain.Events;

namespace PocketLedger.Infrastructure.Events;

public interface IEventStore
{
    Task AppendAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDomainEvent>> GetEventsAsync(Guid aggregateId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDomainEvent>> GetEventsSinceAsync(DateTime since, CancellationToken cancellationToken = default);
}

public class InMemoryEventStore : IEventStore
{
    private readonly List<StoredEvent> _events = new();
    private readonly object _lock = new();

    public Task AppendAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _events.Add(new StoredEvent(
                domainEvent.EventId,
                domainEvent.GetType().FullName ?? domainEvent.GetType().Name,
                domainEvent,
                domainEvent.OccurredAt));
        }
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<IDomainEvent>> GetEventsAsync(
        Guid aggregateId,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var events = _events
                .Where(e => ContainsAggregateId(e.Event, aggregateId))
                .Select(e => e.Event)
                .ToList();

            return Task.FromResult<IReadOnlyList<IDomainEvent>>(events);
        }
    }

    public Task<IReadOnlyList<IDomainEvent>> GetEventsSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var events = _events
                .Where(e => e.OccurredAt >= since)
                .Select(e => e.Event)
                .ToList();

            return Task.FromResult<IReadOnlyList<IDomainEvent>>(events);
        }
    }

    private static bool ContainsAggregateId(IDomainEvent domainEvent, Guid aggregateId)
    {
        var properties = domainEvent.GetType().GetProperties();
        foreach (var prop in properties)
        {
            if (prop.PropertyType == typeof(Guid) && prop.GetValue(domainEvent) is Guid id && id == aggregateId)
                return true;
        }
        return false;
    }

    private record StoredEvent(
        Guid EventId,
        string EventType,
        IDomainEvent Event,
        DateTime OccurredAt);
}
