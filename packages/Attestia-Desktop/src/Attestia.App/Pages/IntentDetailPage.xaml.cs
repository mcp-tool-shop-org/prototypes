using System.Text.Json;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Navigation;
using Attestia.Core.Models;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class IntentDetailPage : Page
{
    private readonly IntentDetailViewModel _vm;
    private IntentStatus? _previousStatus;

    public IntentDetailPage()
    {
        InitializeComponent();
        _vm = App.GetService<IntentDetailViewModel>();

        _vm.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(IntentDetailViewModel.Intent))
                    UpdateDisplay();
                else if (e.PropertyName == nameof(IntentDetailViewModel.IsBusy))
                    LoadingRing.IsActive = _vm.IsBusy;
                else if (e.PropertyName == nameof(IntentDetailViewModel.ErrorMessage))
                {
                    ErrorText.Text = _vm.ErrorMessage ?? "";
                    RetryBtn.Visibility = string.IsNullOrEmpty(_vm.ErrorMessage)
                        ? Visibility.Collapsed : Visibility.Visible;
                }
            });
        };
    }

    protected override async void OnNavigatedTo(NavigationEventArgs e)
    {
        base.OnNavigatedTo(e);
        if (e.Parameter is string intentId)
        {
            await _vm.LoadCommand.ExecuteAsync(intentId);
        }
    }

    private void UpdateDisplay()
    {
        var intent = _vm.Intent;
        if (intent is null) return;

        IntentIdText.Text = intent.Id;
        StatusText.Text = intent.Status.ToString();
        KindText.Text = intent.Kind;
        DeclaredByText.Text = intent.DeclaredBy;
        DeclaredAtText.Text = intent.DeclaredAt;
        DescriptionText.Text = intent.Description;

        ParamsText.Text = intent.Params.Count > 0
            ? JsonSerializer.Serialize(intent.Params, new JsonSerializerOptions { WriteIndented = true })
            : "(none)";

        // Show contextual action panels
        ApproveRejectPanel.Visibility = intent.Status == IntentStatus.Declared
            ? Visibility.Visible : Visibility.Collapsed;
        ExecutePanel.Visibility = intent.Status == IntentStatus.Approved
            ? Visibility.Visible : Visibility.Collapsed;
        VerifyPanel.Visibility = intent.Status == IntentStatus.Executed
            ? Visibility.Visible : Visibility.Collapsed;

        // Show success banner if status changed after an action
        if (_previousStatus is not null && _previousStatus != intent.Status)
        {
            ShowActionSuccess(intent.Status);
        }
        _previousStatus = intent.Status;
    }

    private void ShowActionSuccess(IntentStatus newStatus)
    {
        var (message, nextStep) = newStatus switch
        {
            IntentStatus.Approved => (
                "Governance record confirmed — intent approved.",
                "Proceed to link an on-chain transaction to this approved intent."),
            IntentStatus.Rejected => (
                "Governance record confirmed — intent rejected.",
                "This intent is permanently closed and cannot re-enter the attestation pipeline."),
            IntentStatus.Executed => (
                "Execution record confirmed.",
                "Proceed to verify that the on-chain transaction matches the declared intent."),
            IntentStatus.Verified => (
                "Verification confirmed — lifecycle complete.",
                "Run a reconciliation to generate a cryptographic attestation for this action."),
            _ => ((string?)null, (string?)null),
        };

        if (message is not null)
        {
            ActionSuccessBanner.Visibility = Visibility.Visible;
            ActionSuccessText.Text = message;
            ActionNextStepText.Text = nextStep ?? "";
        }
    }

    private void Back_Click(object sender, RoutedEventArgs e)
    {
        if (Frame.CanGoBack)
            Frame.GoBack();
    }

    private async void Approve_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new ContentDialog
        {
            Title = "Approve Intent",
            Content = $"Approve intent \"{_vm.Intent?.Id}\"? This action creates a permanent governance record and cannot be undone.",
            PrimaryButtonText = "Approve",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = XamlRoot,
        };
        if (await dialog.ShowAsync() != ContentDialogResult.Primary) return;

        ActionSuccessBanner.Visibility = Visibility.Collapsed;
        await _vm.ApproveCommand.ExecuteAsync(null);
    }

    private async void Reject_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new ContentDialog
        {
            Title = "Reject Intent",
            Content = $"Reject intent \"{_vm.Intent?.Id}\"? This is irreversible — the intent can no longer proceed through the attestation pipeline.",
            PrimaryButtonText = "Reject",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Close,
            XamlRoot = XamlRoot,
        };
        if (await dialog.ShowAsync() != ContentDialogResult.Primary) return;

        ActionSuccessBanner.Visibility = Visibility.Collapsed;
        _vm.RejectReason = RejectReasonBox.Text?.Trim();
        await _vm.RejectCommand.ExecuteAsync(null);
    }

    private async void Execute_Click(object sender, RoutedEventArgs e)
    {
        var chainId = ChainIdBox.Text?.Trim();
        var txHash = TxHashBox.Text?.Trim();

        if (string.IsNullOrEmpty(txHash))
        {
            ErrorText.Text = "Transaction hash is required to record execution.";
            return;
        }

        var dialog = new ContentDialog
        {
            Title = "Record Execution",
            Content = $"Link transaction {txHash} to intent \"{_vm.Intent?.Id}\"? This creates a permanent auditable record.",
            PrimaryButtonText = "Record",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = XamlRoot,
        };
        if (await dialog.ShowAsync() != ContentDialogResult.Primary) return;

        ActionSuccessBanner.Visibility = Visibility.Collapsed;
        _vm.ChainId = chainId;
        _vm.TxHash = txHash;
        await _vm.ExecuteCommand.ExecuteAsync(null);
    }

    private async void Verify_Click(object sender, RoutedEventArgs e)
    {
        ActionSuccessBanner.Visibility = Visibility.Collapsed;
        _vm.VerifyMatched = MatchedCheck.IsChecked == true;
        await _vm.VerifyCommand.ExecuteAsync(null);
    }

    private async void Retry_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.Intent is not null)
            await _vm.LoadCommand.ExecuteAsync(_vm.Intent.Id);
    }
}
