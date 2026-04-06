using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Attestia.Sidecar;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class DashboardViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly NodeSidecar _sidecar;
    private readonly ILogger<DashboardViewModel> _logger;

    [ObservableProperty]
    private int _totalIntents;

    [ObservableProperty]
    private int _declaredCount;

    [ObservableProperty]
    private int _verifiedCount;

    [ObservableProperty]
    private string? _latestAttestationId;

    [ObservableProperty]
    private string? _globalStateHash;

    [ObservableProperty]
    private string? _merkleRoot;

    [ObservableProperty]
    private int _merkleLeafCount;

    [ObservableProperty]
    private SidecarStatus _sidecarStatus;

    [ObservableProperty]
    private List<StoredEvent> _recentEvents = [];

    public DashboardViewModel(AttestiaClient client, NodeSidecar sidecar, ILogger<DashboardViewModel> logger)
    {
        _client = client;
        _sidecar = sidecar;
        _logger = logger;

        _sidecar.StatusChanged += (_, status) => SidecarStatus = status;
        SidecarStatus = sidecar.IsRunning ? SidecarStatus.Running : SidecarStatus.Stopped;
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        await RunBusyAsync(async () =>
        {
            var intentsTask = _client.Intents.ListAsync(limit: 1);
            var hashTask = _client.Verify.StateHashAsync(new { }, new { }, "");
            var rootTask = _client.Proofs.MerkleRootAsync();
            var attestationsTask = _client.Reconciliation.ListAttestationsAsync(limit: 1);

            try
            {
                var intents = await intentsTask;
                TotalIntents = intents.Pagination.Total;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch intents count");
            }

            try
            {
                var root = await rootTask;
                MerkleRoot = root.Root;
                MerkleLeafCount = root.LeafCount;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch merkle root");
            }

            try
            {
                var attestations = await attestationsTask;
                if (attestations.Data.Count > 0)
                {
                    LatestAttestationId = attestations.Data[0].Id;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch attestations");
            }

            try
            {
                var events = await _client.Events.ListAsync(limit: 5);
                RecentEvents = events.Data.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch recent events");
            }
        });
    }
}
