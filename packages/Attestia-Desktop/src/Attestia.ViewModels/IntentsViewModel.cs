using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class IntentsViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<IntentsViewModel> _logger;
    private string? _nextCursor;

    [ObservableProperty]
    private string? _statusFilter;

    [ObservableProperty]
    private bool _hasMore;

    public ObservableCollection<Intent> Intents { get; } = [];

    public IntentsViewModel(AttestiaClient client, ILogger<IntentsViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        await RunBusyAsync(async () =>
        {
            Intents.Clear();
            _nextCursor = null;
            var result = await _client.Intents.ListAsync(status: StatusFilter, limit: 50);

            foreach (var intent in result.Data)
            {
                Intents.Add(intent);
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
            var result = await _client.Intents.ListAsync(status: StatusFilter, cursor: _nextCursor, limit: 50);

            foreach (var intent in result.Data)
            {
                Intents.Add(intent);
            }

            _nextCursor = result.Pagination.Cursor;
            HasMore = result.Pagination.HasMore;
        });
    }

    [RelayCommand]
    private async Task<Intent?> ApproveAsync(string intentId)
    {
        return await RunBusyAsync(async () =>
        {
            var updated = await _client.Intents.ApproveAsync(intentId);
            ReplaceIntent(updated);
            return updated;
        });
    }

    [RelayCommand]
    private async Task<Intent?> RejectAsync((string Id, string Reason) args)
    {
        return await RunBusyAsync(async () =>
        {
            var updated = await _client.Intents.RejectAsync(args.Id, args.Reason);
            ReplaceIntent(updated);
            return updated;
        });
    }

    private void ReplaceIntent(Intent updated)
    {
        for (var i = 0; i < Intents.Count; i++)
        {
            if (Intents[i].Id == updated.Id)
            {
                Intents[i] = updated;
                return;
            }
        }
    }
}
