using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class IntentDetailViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<IntentDetailViewModel> _logger;

    [ObservableProperty]
    private Intent? _intent;

    [ObservableProperty]
    private string? _rejectReason;

    [ObservableProperty]
    private string? _chainId;

    [ObservableProperty]
    private string? _txHash;

    [ObservableProperty]
    private bool _verifyMatched = true;

    public IntentDetailViewModel(AttestiaClient client, ILogger<IntentDetailViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadAsync(string intentId)
    {
        await RunBusyAsync(async () =>
        {
            Intent = await _client.Intents.GetAsync(intentId);
        });
    }

    [RelayCommand]
    private async Task ApproveAsync()
    {
        if (Intent is null) return;

        await RunBusyAsync(async () =>
        {
            Intent = await _client.Intents.ApproveAsync(Intent.Id);
        });
    }

    [RelayCommand]
    private async Task RejectAsync()
    {
        if (Intent is null || string.IsNullOrWhiteSpace(RejectReason)) return;

        await RunBusyAsync(async () =>
        {
            Intent = await _client.Intents.RejectAsync(Intent.Id, RejectReason!);
            RejectReason = null;
        });
    }

    [RelayCommand]
    private async Task ExecuteAsync()
    {
        if (Intent is null || string.IsNullOrWhiteSpace(ChainId) || string.IsNullOrWhiteSpace(TxHash))
            return;

        await RunBusyAsync(async () =>
        {
            Intent = await _client.Intents.ExecuteAsync(Intent.Id, ChainId!, TxHash!);
            ChainId = null;
            TxHash = null;
        });
    }

    [RelayCommand]
    private async Task VerifyAsync()
    {
        if (Intent is null) return;

        await RunBusyAsync(async () =>
        {
            Intent = await _client.Intents.VerifyAsync(Intent.Id, VerifyMatched);
        });
    }
}
