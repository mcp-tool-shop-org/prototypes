using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class DeclareIntentViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<DeclareIntentViewModel> _logger;

    [ObservableProperty]
    private string? _intentId;

    [ObservableProperty]
    private string _kind = "transfer";

    [ObservableProperty]
    private string? _description;

    [ObservableProperty]
    private string? _fromAddress;

    [ObservableProperty]
    private string? _toAddress;

    [ObservableProperty]
    private string? _amount;

    [ObservableProperty]
    private string _currency = "USD";

    [ObservableProperty]
    private string? _chainId;

    [ObservableProperty]
    private Intent? _declaredIntent;

    public DeclareIntentViewModel(AttestiaClient client, ILogger<DeclareIntentViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task DeclareAsync()
    {
        if (string.IsNullOrWhiteSpace(IntentId) || string.IsNullOrWhiteSpace(Description))
            return;

        await RunBusyAsync(async () =>
        {
            var intentParams = new Dictionary<string, object?>();

            if (!string.IsNullOrWhiteSpace(FromAddress))
                intentParams["from"] = FromAddress;
            if (!string.IsNullOrWhiteSpace(ToAddress))
                intentParams["to"] = ToAddress;
            if (!string.IsNullOrWhiteSpace(Amount))
                intentParams["amount"] = new { amount = Amount, currency = Currency };
            if (!string.IsNullOrWhiteSpace(ChainId))
                intentParams["chainId"] = ChainId;

            var request = new DeclareIntentRequest
            {
                Id = IntentId!,
                Kind = Kind,
                Description = Description!,
                Params = intentParams,
            };

            DeclaredIntent = await _client.Intents.DeclareAsync(request);
        });
    }
}
