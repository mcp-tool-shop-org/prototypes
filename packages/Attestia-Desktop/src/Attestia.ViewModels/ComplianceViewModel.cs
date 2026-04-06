using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Attestia.Client;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.ViewModels;

public partial class ComplianceViewModel : ViewModelBase
{
    private readonly AttestiaClient _client;
    private readonly ILogger<ComplianceViewModel> _logger;

    [ObservableProperty]
    private ComplianceReport? _currentReport;

    [ObservableProperty]
    private string? _selectedFrameworkId;

    public ObservableCollection<ComplianceFramework> Frameworks { get; } = [];

    public ComplianceViewModel(AttestiaClient client, ILogger<ComplianceViewModel> logger)
    {
        _client = client;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadFrameworksAsync()
    {
        await RunBusyAsync(async () =>
        {
            Frameworks.Clear();
            var frameworks = await _client.Compliance.ListFrameworksAsync();

            foreach (var fw in frameworks)
            {
                Frameworks.Add(fw);
            }

            if (Frameworks.Count > 0)
            {
                SelectedFrameworkId = Frameworks[0].Id;
            }
        });
    }

    [RelayCommand]
    private async Task LoadReportAsync()
    {
        if (string.IsNullOrEmpty(SelectedFrameworkId)) return;

        await RunBusyAsync(async () =>
        {
            CurrentReport = await _client.Compliance.GetReportAsync(SelectedFrameworkId);
        });
    }
}
