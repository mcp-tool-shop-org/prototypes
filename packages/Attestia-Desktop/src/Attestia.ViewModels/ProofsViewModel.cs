using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class ProofsViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<ProofsViewModel> _logger;

    [ObservableProperty]
    private string? _merkleRoot;

    [ObservableProperty]
    private int _leafCount;

    [ObservableProperty]
    private AttestationProofPackage? _currentProof;

    [ObservableProperty]
    private bool? _proofVerificationResult;

    [ObservableProperty]
    private string? _lookupId;

    public ProofsViewModel(AttestiaClient client, ILogger<ProofsViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadMerkleRootAsync()
    {
        await RunBusyAsync(async () =>
        {
            var info = await _client.Proofs.MerkleRootAsync();
            MerkleRoot = info.Root;
            LeafCount = info.LeafCount;
        });
    }

    [RelayCommand]
    private async Task LookupProofAsync()
    {
        if (string.IsNullOrWhiteSpace(LookupId)) return;

        await RunBusyAsync(async () =>
        {
            CurrentProof = await _client.Proofs.GetAttestationAsync(LookupId);
            ProofVerificationResult = null;
        });
    }

    [RelayCommand]
    private async Task VerifyCurrentProofAsync()
    {
        if (CurrentProof is null) return;

        await RunBusyAsync(async () =>
        {
            var result = await _client.Proofs.VerifyProofAsync(CurrentProof);
            ProofVerificationResult = result.Valid;
        });
    }
}
