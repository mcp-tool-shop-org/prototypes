using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class ReconciliationViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<ReconciliationViewModel> _logger;

    [ObservableProperty]
    private ReconciliationReport? _currentReport;

    [ObservableProperty]
    private ReconciliationSummary? _summary;

    public ObservableCollection<AttestationRecord> Attestations { get; } = [];

    public ReconciliationViewModel(AttestiaClient client, ILogger<ReconciliationViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadAttestationsAsync()
    {
        await RunBusyAsync(async () =>
        {
            Attestations.Clear();
            var result = await _client.Reconciliation.ListAttestationsAsync(limit: 50);

            foreach (var record in result.Data)
            {
                Attestations.Add(record);
            }
        });
    }
}
