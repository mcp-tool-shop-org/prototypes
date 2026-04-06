using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class ProofsPage : Page
{
    private readonly ProofsViewModel _vm;

    public ProofsPage()
    {
        InitializeComponent();
        _vm = App.GetService<ProofsViewModel>();

        _vm.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(ProofsViewModel.MerkleRoot))
                {
                    MerkleRootText.Text = _vm.MerkleRoot ?? "Not yet computed";
                    UpdateEmptyState();
                }
                else if (e.PropertyName == nameof(ProofsViewModel.LeafCount))
                {
                    LeafCountText.Text = _vm.LeafCount.ToString();
                    UpdateEmptyState();
                }
                else if (e.PropertyName == nameof(ProofsViewModel.IsBusy))
                    LoadingRing.IsActive = _vm.IsBusy;
                else if (e.PropertyName == nameof(ProofsViewModel.ErrorMessage))
                {
                    ErrorText.Text = _vm.ErrorMessage ?? "";
                    RetryBtn.Visibility = string.IsNullOrEmpty(_vm.ErrorMessage)
                        ? Visibility.Collapsed : Visibility.Visible;
                    UpdateEmptyState();
                }
                else if (e.PropertyName == nameof(ProofsViewModel.CurrentProof))
                    UpdateProofDisplay();
                else if (e.PropertyName == nameof(ProofsViewModel.ProofVerificationResult))
                    UpdateVerifyResult();
            });
        };
    }

    private void UpdateEmptyState()
    {
        var hasData = _vm.LeafCount > 0 || !string.IsNullOrEmpty(_vm.MerkleRoot);
        var hasError = !string.IsNullOrEmpty(_vm.ErrorMessage);
        EmptyState.Visibility = !hasData && !hasError && !_vm.IsBusy
            ? Visibility.Visible : Visibility.Collapsed;
        RootCard.Visibility = hasData ? Visibility.Visible : Visibility.Collapsed;
    }

    private async void Page_Loaded(object sender, RoutedEventArgs e)
    {
        await _vm.LoadMerkleRootCommand.ExecuteAsync(null);
    }

    private async void RefreshRoot_Click(object sender, RoutedEventArgs e)
    {
        await _vm.LoadMerkleRootCommand.ExecuteAsync(null);
    }

    private async void Lookup_Click(object sender, RoutedEventArgs e)
    {
        _vm.LookupId = LookupIdBox.Text?.Trim();
        await _vm.LookupProofCommand.ExecuteAsync(null);
    }

    private async void Verify_Click(object sender, RoutedEventArgs e)
    {
        await _vm.VerifyCurrentProofCommand.ExecuteAsync(null);
    }

    private void ShowCryptoDetails_Toggled(object sender, RoutedEventArgs e)
    {
        CryptoDetailsPanel.Visibility = ShowCryptoDetailsToggle.IsChecked == true
            ? Visibility.Visible : Visibility.Collapsed;
        ShowCryptoDetailsToggle.Content = ShowCryptoDetailsToggle.IsChecked == true
            ? "Hide cryptographic details" : "Show cryptographic details";
    }

    private void UpdateProofDisplay()
    {
        var proof = _vm.CurrentProof;
        if (proof is null)
        {
            ProofPanel.Visibility = Visibility.Collapsed;
            return;
        }

        ProofPanel.Visibility = Visibility.Visible;
        ProofLeafHash.Text = proof.InclusionProof.LeafHash;
        ProofLeafIndex.Text = proof.InclusionProof.LeafIndex.ToString();
        ProofRoot.Text = proof.InclusionProof.Root;

        var siblings = proof.InclusionProof.Siblings;
        ProofSiblings.Text = siblings.Count == 0
            ? "(none)"
            : string.Join("\n", siblings.Select(s => $"{s.Direction}: {s.Hash}"));

        VerifyResultText.Text = "";
        // Reset crypto details visibility on new lookup
        ShowCryptoDetailsToggle.IsChecked = false;
        CryptoDetailsPanel.Visibility = Visibility.Collapsed;
    }

    private void GoToCompliance_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(CompliancePage));
    }

    private void GoToEvents_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(EventsPage));
    }

    private void UpdateVerifyResult()
    {
        if (_vm.ProofVerificationResult is true)
        {
            VerifyResultText.Text = "✓ Integrity Confirmed";
            VerifyResultText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                Windows.UI.Color.FromArgb(255, 76, 122, 91)); // AttestiaHealthy

            // 5.7 — Signature integrity moment: fade-in the confirmation
            VerifyResultText.Opacity = 0;
            var storyboard = new Microsoft.UI.Xaml.Media.Animation.Storyboard();
            var fadeIn = new Microsoft.UI.Xaml.Media.Animation.DoubleAnimation
            {
                From = 0, To = 1, Duration = new Duration(TimeSpan.FromMilliseconds(350)),
                EasingFunction = new Microsoft.UI.Xaml.Media.Animation.CubicEase
                    { EasingMode = Microsoft.UI.Xaml.Media.Animation.EasingMode.EaseOut },
            };
            Microsoft.UI.Xaml.Media.Animation.Storyboard.SetTarget(fadeIn, VerifyResultText);
            Microsoft.UI.Xaml.Media.Animation.Storyboard.SetTargetProperty(fadeIn, "Opacity");
            storyboard.Children.Add(fadeIn);
            storyboard.Begin();
        }
        else if (_vm.ProofVerificationResult is false)
        {
            VerifyResultText.Text = "✗ Integrity Violation";
            VerifyResultText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                Windows.UI.Color.FromArgb(255, 168, 90, 90)); // AttestiaError
        }
        else
        {
            VerifyResultText.Text = "";
        }
    }
}
