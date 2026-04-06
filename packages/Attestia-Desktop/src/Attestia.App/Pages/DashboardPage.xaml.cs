using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Media.Animation;
using Attestia.Sidecar;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class DashboardPage : Page
{
    private readonly DashboardViewModel _vm;

    // Muted institutional colors
    private static readonly Windows.UI.Color HealthyColor = Windows.UI.Color.FromArgb(255, 76, 122, 91);
    private static readonly Windows.UI.Color WarningColor = Windows.UI.Color.FromArgb(255, 194, 161, 74);
    private static readonly Windows.UI.Color ErrorColor = Windows.UI.Color.FromArgb(255, 168, 90, 90);
    private static readonly Windows.UI.Color NeutralColor = Windows.UI.Color.FromArgb(255, 74, 90, 111);
    private static readonly Windows.UI.Color AccentColor = Windows.UI.Color.FromArgb(255, 194, 161, 74);

    private DateTime? _lastVerified;

    public DashboardPage()
    {
        InitializeComponent();
        _vm = App.GetService<DashboardViewModel>();

        _vm.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                LoadingRing.IsActive = _vm.IsBusy;
                UpdatePipeline();
                UpdateIntegrityAnchor();
                UpdateEngineStatus();
                UpdateIntegrityStatusPanel();
                UpdateWorkflowGuide();
                UpdateActivityTimeline();

                OfflineBanner.Visibility = _vm.IsEngineOffline
                    ? Visibility.Visible : Visibility.Collapsed;
            });
        };
    }

    private void UpdatePipeline()
    {
        PipelineIntentCount.Text = _vm.TotalIntents.ToString();
        PipelineAttestedCount.Text = _vm.LatestAttestationId is not null ? "1+" : "0";
        PipelineReconciledText.Text = _vm.LatestAttestationId ?? "None";
        PipelineProofCount.Text = _vm.MerkleLeafCount.ToString();
        PipelineCompliantText.Text = "—";
    }

    private void UpdateIntegrityAnchor()
    {
        MerkleRootText.Text = _vm.MerkleRoot ?? "Not yet computed";
        IntegrityLeafCount.Text = _vm.MerkleLeafCount.ToString();

        var hasRoot = !string.IsNullOrEmpty(_vm.MerkleRoot);
        var wasHidden = IntegrityBadge.Visibility == Visibility.Collapsed;
        IntegrityBadge.Visibility = hasRoot ? Visibility.Visible : Visibility.Collapsed;

        // 5.7 — Signature integrity moment: fade in the verified badge
        if (hasRoot && wasHidden)
        {
            FadeInElement(IntegrityBadge, 350);
        }
    }

    /// <summary>
    /// Smooth fade-in animation for premium feel.
    /// </summary>
    private static void FadeInElement(UIElement element, int durationMs = 200)
    {
        element.Opacity = 0;
        var storyboard = new Storyboard();
        var fadeIn = new DoubleAnimation
        {
            From = 0, To = 1,
            Duration = new Duration(TimeSpan.FromMilliseconds(durationMs)),
            EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut },
        };
        Storyboard.SetTarget(fadeIn, element);
        Storyboard.SetTargetProperty(fadeIn, "Opacity");
        storyboard.Children.Add(fadeIn);
        storyboard.Begin();
    }

    private void UpdateEngineStatus()
    {
        var status = _vm.SidecarStatus;
        EngineStatusText.Text = status switch
        {
            SidecarStatus.Running => "Operational",
            SidecarStatus.Starting => "Starting...",
            SidecarStatus.Degraded => "Degraded",
            SidecarStatus.Crashed or SidecarStatus.Error => "Offline",
            SidecarStatus.Stopped => "Stopped",
            _ => "...",
        };

        EngineIndicator.Fill = new SolidColorBrush(status switch
        {
            SidecarStatus.Running => HealthyColor,
            SidecarStatus.Starting => WarningColor,
            SidecarStatus.Degraded => WarningColor,
            SidecarStatus.Crashed or SidecarStatus.Error => ErrorColor,
            _ => NeutralColor,
        });

        if (status == SidecarStatus.Running && !_vm.IsBusy)
        {
            _lastVerified = DateTime.UtcNow;
            LastVerifiedText.Text = $"Last verified: {_lastVerified:yyyy-MM-dd HH:mm:ss} UTC";
        }
    }

    private void UpdateIntegrityStatusPanel()
    {
        var isOnline = _vm.SidecarStatus == SidecarStatus.Running;
        var hasRoot = !string.IsNullOrEmpty(_vm.MerkleRoot);
        var hasIntents = _vm.TotalIntents > 0;

        // Ledger
        LedgerStatusText.Text = isOnline ? "Append-Only" : "Unavailable";
        LedgerStatusDetail.Text = isOnline
            ? "Event integrity verified"
            : "Engine offline";

        // Governance
        GovernanceStatusText.Text = isOnline ? "Active" : "Unavailable";
        GovernanceStatusDetail.Text = isOnline
            ? "Intent approval required"
            : "Engine offline";

        // Quorum
        QuorumStatusText.Text = "Pending";
        QuorumStatusDetail.Text = "No witnesses registered";

        // Integrity Root
        IntegrityRootStatusText.Text = hasRoot ? "Valid" : "Not Computed";
        IntegrityRootStatusDetail.Text = hasRoot
            ? $"{_vm.MerkleLeafCount} proof entries"
            : hasIntents ? "Run attestation to compute" : "Awaiting first attestation";
    }

    /// <summary>
    /// Determines the user's current workflow step and updates the guide accordingly.
    /// Steps: 1=Declare, 2=Approve, 3=Execute, 4=Verify, 5=Attest
    /// </summary>
    private void UpdateWorkflowGuide()
    {
        if (_vm.IsEngineOffline || _vm.IsBusy)
        {
            WorkflowGuide.Visibility = Visibility.Collapsed;
            return;
        }

        var hasIntents = _vm.TotalIntents > 0;
        var hasAttestation = _vm.LatestAttestationId is not null;
        var hasRoot = !string.IsNullOrEmpty(_vm.MerkleRoot);

        // Determine current step (1-based)
        int currentStep;
        string actionLabel;
        string hintText;

        if (!hasIntents)
        {
            currentStep = 1;
            actionLabel = "Declare First Intent";
            hintText = "No intents declared yet";
        }
        else if (!hasAttestation)
        {
            // Intents exist but no attestation — user needs to go through approval/execution
            currentStep = 2;
            actionLabel = "Review Intents";
            hintText = $"{_vm.TotalIntents} intent(s) declared — approve and execute to proceed";
        }
        else if (!hasRoot)
        {
            currentStep = 4;
            actionLabel = "Verify Integrity";
            hintText = "Attestation exists — verify the integrity proof";
        }
        else
        {
            currentStep = 5;
            actionLabel = "View Compliance";
            hintText = "System attested — generate a compliance report";
        }

        WorkflowGuide.Visibility = Visibility.Visible;
        WorkflowActionBtn.Content = actionLabel;
        WorkflowHintText.Text = hintText;

        // Highlight completed and current steps
        var accentBrush = new SolidColorBrush(AccentColor);
        var defaultBg = (Brush)Resources["SubtleFillColorSecondaryBrush"]
            ?? new SolidColorBrush(Windows.UI.Color.FromArgb(20, 255, 255, 255));

        var steps = new[] {
            (WfStep1, WfStep1Number),
            (WfStep2, WfStep2Number),
            (WfStep3, WfStep3Number),
            (WfStep4, WfStep4Number),
            (WfStep5, WfStep5Number),
        };

        for (int i = 0; i < steps.Length; i++)
        {
            var (stepGrid, numberText) = steps[i];
            var stepIndex = i + 1;

            if (stepIndex < currentStep)
            {
                // Completed: checkmark
                numberText.Text = "\uE73E";
                numberText.FontFamily = new FontFamily("Segoe Fluent Icons");
                numberText.FontSize = 12;
                numberText.Foreground = new SolidColorBrush(HealthyColor);
            }
            else if (stepIndex == currentStep)
            {
                // Current: accent highlight
                numberText.Text = stepIndex.ToString();
                numberText.FontFamily = new FontFamily("Segoe UI");
                numberText.FontSize = 11;
                numberText.Foreground = accentBrush;
                stepGrid.BorderBrush = accentBrush;
                stepGrid.BorderThickness = new Thickness(0, 0, 0, 2);
            }
            else
            {
                // Future: dimmed
                numberText.Text = stepIndex.ToString();
                numberText.FontFamily = new FontFamily("Segoe UI");
                numberText.FontSize = 11;
                numberText.Foreground = (Brush)Application.Current.Resources["TextFillColorTertiaryBrush"];
                stepGrid.BorderBrush = null;
                stepGrid.BorderThickness = new Thickness(0);
            }
        }
    }

    private void WorkflowAction_Click(object sender, RoutedEventArgs e)
    {
        var hasIntents = _vm.TotalIntents > 0;
        var hasAttestation = _vm.LatestAttestationId is not null;
        var hasRoot = !string.IsNullOrEmpty(_vm.MerkleRoot);

        if (!hasIntents)
        {
            Frame.Navigate(typeof(DeclareIntentPage));
        }
        else if (!hasAttestation)
        {
            Frame.Navigate(typeof(IntentsPage));
        }
        else if (!hasRoot)
        {
            Frame.Navigate(typeof(ProofsPage));
        }
        else
        {
            Frame.Navigate(typeof(CompliancePage));
        }
    }

    private async void Page_Loaded(object sender, RoutedEventArgs e)
    {
        await _vm.RefreshCommand.ExecuteAsync(null);
    }

    private async void Refresh_Click(object sender, RoutedEventArgs e)
    {
        await _vm.RefreshCommand.ExecuteAsync(null);
    }

    private void UpdateActivityTimeline()
    {
        if (_vm.IsEngineOffline || _vm.IsBusy)
        {
            ActivityTimelinePanel.Visibility = Visibility.Collapsed;
            return;
        }

        ActivityTimelinePanel.Visibility = Visibility.Visible;
        TimelineItems.Children.Clear();

        var events = _vm.RecentEvents;
        if (events is null || events.Count == 0)
        {
            TimelineEmptyText.Visibility = Visibility.Visible;
            return;
        }

        TimelineEmptyText.Visibility = Visibility.Collapsed;

        foreach (var stored in events)
        {
            var ev = stored.Event;
            var icon = ev.Type switch
            {
                string t when t.Contains("intent", StringComparison.OrdinalIgnoreCase) => "\uE8A1",
                string t when t.Contains("reconcil", StringComparison.OrdinalIgnoreCase) => "\uE9D5",
                string t when t.Contains("attest", StringComparison.OrdinalIgnoreCase) => "\uE73E",
                string t when t.Contains("verify", StringComparison.OrdinalIgnoreCase) => "\uE8D7",
                _ => "\uE81C",
            };

            var row = new Grid
            {
                Padding = new Thickness(12),
                CornerRadius = new CornerRadius(6),
                Background = (Brush)Application.Current.Resources["CardBackgroundFillColorDefaultBrush"],
                BorderBrush = (Brush)Application.Current.Resources["CardStrokeColorDefaultBrush"],
                BorderThickness = new Thickness(1),
                ColumnSpacing = 12,
            };

            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var iconText = new TextBlock
            {
                Text = icon,
                FontFamily = new FontFamily("Segoe Fluent Icons"),
                FontSize = 14,
                VerticalAlignment = VerticalAlignment.Center,
                Foreground = (Brush)Application.Current.Resources["TextFillColorTertiaryBrush"],
            };
            Grid.SetColumn(iconText, 0);

            var infoPanel = new StackPanel { Spacing = 2, VerticalAlignment = VerticalAlignment.Center };
            infoPanel.Children.Add(new TextBlock
            {
                Text = ev.Type,
                FontSize = 13,
                FontWeight = Microsoft.UI.Text.FontWeights.SemiBold,
            });
            infoPanel.Children.Add(new TextBlock
            {
                Text = $"{ev.Metadata.Source} · {stored.StreamId}",
                FontSize = 11,
                Foreground = (Brush)Application.Current.Resources["TextFillColorTertiaryBrush"],
            });
            Grid.SetColumn(infoPanel, 1);

            var timestamp = new TextBlock
            {
                Text = stored.AppendedAt,
                FontSize = 11,
                VerticalAlignment = VerticalAlignment.Center,
                Foreground = (Brush)Application.Current.Resources["TextFillColorTertiaryBrush"],
            };
            Grid.SetColumn(timestamp, 2);

            row.Children.Add(iconText);
            row.Children.Add(infoPanel);
            row.Children.Add(timestamp);

            TimelineItems.Children.Add(row);
        }
    }

    private void ViewFullLedger_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(EventsPage));
    }

    private void DeclareIntent_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(DeclareIntentPage));
    }
}
