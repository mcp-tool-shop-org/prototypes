using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Attestia.App.Pages;
using Attestia.Sidecar;

namespace Attestia.App;

public sealed partial class MainWindow : Window
{
    private readonly NodeSidecar _sidecar;

    // Muted institutional status colors from brand palette
    private static readonly Windows.UI.Color HealthyColor = Windows.UI.Color.FromArgb(255, 76, 122, 91);    // #4C7A5B
    private static readonly Windows.UI.Color WarningColor = Windows.UI.Color.FromArgb(255, 194, 161, 74);   // #C2A14A
    private static readonly Windows.UI.Color ErrorColor = Windows.UI.Color.FromArgb(255, 168, 90, 90);      // #A85A5A
    private static readonly Windows.UI.Color NeutralColor = Windows.UI.Color.FromArgb(255, 74, 90, 111);    // #4A5A6F

    public MainWindow()
    {
        InitializeComponent();

        var appWindow = this.AppWindow;
        appWindow.Title = "Attestia";
        appWindow.Resize(new Windows.Graphics.SizeInt32(1280, 800));

        _sidecar = App.GetService<NodeSidecar>();
        _sidecar.StatusChanged += OnSidecarStatusChanged;

        // Select Overview on startup
        NavView.SelectedItem = NavView.MenuItems[0];

        _ = StartSidecarAsync();
    }

    private async Task StartSidecarAsync()
    {
        try
        {
            UpdateStatus(SidecarStatus.Starting);
            await _sidecar.StartAsync();
            UpdateStatus(SidecarStatus.Running);
        }
        catch
        {
            UpdateStatus(SidecarStatus.Error);
        }
    }

    private void OnSidecarStatusChanged(object? sender, SidecarStatus status)
    {
        DispatcherQueue.TryEnqueue(() => UpdateStatus(status));
    }

    private void UpdateStatus(SidecarStatus status)
    {
        StatusText.Text = status switch
        {
            SidecarStatus.Running => "Attestation engine operational",
            SidecarStatus.Starting => "Attestation engine starting...",
            SidecarStatus.Stopping => "Attestation engine shutting down...",
            SidecarStatus.Degraded => "Attestation engine degraded",
            SidecarStatus.Crashed => "Attestation engine terminated unexpectedly",
            SidecarStatus.Error => "Attestation engine offline",
            SidecarStatus.Stopped => "Attestation engine stopped",
            _ => "Initializing...",
        };

        StatusIndicator.Fill = new SolidColorBrush(status switch
        {
            SidecarStatus.Running => HealthyColor,
            SidecarStatus.Starting or SidecarStatus.Stopping => WarningColor,
            SidecarStatus.Degraded => WarningColor,
            SidecarStatus.Crashed or SidecarStatus.Error => ErrorColor,
            _ => NeutralColor,
        });

        // 5.9 — Last verification timestamp in footer
        if (status == SidecarStatus.Running)
        {
            LastVerificationText.Text = $"Verified {DateTime.Now:HH:mm:ss}";
        }
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.IsSettingsSelected)
        {
            ContentFrame.Navigate(typeof(SettingsPage));
            return;
        }

        if (args.SelectedItem is NavigationViewItem item && item.Tag is string tag)
        {
            var pageType = tag switch
            {
                "overview" => typeof(DashboardPage),
                "intents" => typeof(IntentsPage),
                "attestation" => typeof(ReconciliationPage),
                "integrity" => typeof(ProofsPage),
                "compliance" => typeof(CompliancePage),
                "events" => typeof(EventsPage),
                _ => typeof(DashboardPage),
            };
            ContentFrame.Navigate(pageType);
        }
    }
}
