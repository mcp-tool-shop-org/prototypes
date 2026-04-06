using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class EventsViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<EventsViewModel> _logger;
    private string? _nextCursor;

    [ObservableProperty]
    private bool _hasMore;

    [ObservableProperty]
    private string? _streamFilter;

    [ObservableProperty]
    private string? _lastExportedNdjson;

    public ObservableCollection<StoredEvent> Events { get; } = [];

    public EventsViewModel(AttestiaClient client, ILogger<EventsViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        await RunBusyAsync(async () =>
        {
            Events.Clear();
            _nextCursor = null;

            PaginatedList<StoredEvent> result;

            if (!string.IsNullOrEmpty(StreamFilter))
            {
                result = await _client.Events.ListStreamAsync(StreamFilter, limit: 100);
            }
            else
            {
                result = await _client.Events.ListAsync(limit: 100);
            }

            foreach (var evt in result.Data)
            {
                Events.Add(evt);
            }

            _nextCursor = result.Pagination.Cursor;
            HasMore = result.Pagination.HasMore;
        });
    }

    [RelayCommand]
    private async Task LoadMoreAsync()
    {
        if (!HasMore || _nextCursor is null) return;

        await RunBusyAsync(async () =>
        {
            PaginatedList<StoredEvent> result;

            if (!string.IsNullOrEmpty(StreamFilter))
            {
                result = await _client.Events.ListStreamAsync(StreamFilter, cursor: _nextCursor, limit: 100);
            }
            else
            {
                result = await _client.Events.ListAsync(cursor: _nextCursor, limit: 100);
            }

            foreach (var evt in result.Data)
            {
                Events.Add(evt);
            }

            _nextCursor = result.Pagination.Cursor;
            HasMore = result.Pagination.HasMore;
        });
    }

    [RelayCommand]
    private async Task ExportNdjsonAsync()
    {
        await RunBusyAsync(async () =>
        {
            LastExportedNdjson = await _client.Export.ExportEventsNdjsonAsync();
        });
    }
}
