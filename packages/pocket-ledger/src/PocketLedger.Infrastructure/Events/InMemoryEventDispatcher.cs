using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PocketLedger.Application.Events;
using PocketLedger.Domain.Events;

namespace PocketLedger.Infrastructure.Events;

public class InMemoryEventDispatcher : IEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InMemoryEventDispatcher> _logger;

    public InMemoryEventDispatcher(
        IServiceProvider serviceProvider,
        ILogger<InMemoryEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        _logger.LogDebug("Dispatching event {EventType} with ID {EventId}",
            typeof(TEvent).Name, domainEvent.EventId);

        var handlers = _serviceProvider.GetServices<IEventHandler<TEvent>>();

        foreach (var handler in handlers)
        {
            try
            {
                await handler.HandleAsync(domainEvent, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling event {EventType} with handler {HandlerType}",
                    typeof(TEvent).Name, handler.GetType().Name);
            }
        }
    }

    public async Task DispatchManyAsync(IEnumerable<IDomainEvent> events, CancellationToken cancellationToken = default)
    {
        foreach (var domainEvent in events)
        {
            var eventType = domainEvent.GetType();
            var dispatchMethod = typeof(InMemoryEventDispatcher)
                .GetMethod(nameof(DispatchAsync))!
                .MakeGenericMethod(eventType);

            var task = (Task?)dispatchMethod.Invoke(this, new object[] { domainEvent, cancellationToken });
            if (task is not null)
            {
                await task;
            }
        }
    }
}
