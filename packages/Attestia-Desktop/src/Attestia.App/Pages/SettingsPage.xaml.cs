using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Attestia.Sidecar;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class SettingsPage : Page
{
    private readonly SettingsViewModel _vm;
    private readonly NodeSidecar _sidecar;

    public SettingsPage()
    {
        InitializeComponent();

        _vm = App.GetService<SettingsViewModel>();
        _sidecar = App.GetService<NodeSidecar>();
        UpdateSidecarInfo();

        _sidecar.StatusChanged += (_, _) => DispatcherQueue.TryEnqueue(UpdateSidecarInfo);
    }

    private void UpdateSidecarInfo()
    {
        var status = _vm.SidecarStatus;

        SidecarStatusText.Text = status switch
        {
            SidecarStatus.Running => "Running",
            SidecarStatus.Starting => "Starting...",
            SidecarStatus.Stopping => "Shutting down...",
            SidecarStatus.Degraded => "Degraded",
            SidecarStatus.Crashed => "Stopped unexpectedly",
            SidecarStatus.Error => "Offline",
            SidecarStatus.Stopped => "Stopped",
            _ => "Checking...",
        };

        var color = status switch
        {
            SidecarStatus.Running => Colors.LimeGreen,
            SidecarStatus.Starting or SidecarStatus.Stopping => Colors.Orange,
            SidecarStatus.Degraded => Colors.Gold,
            SidecarStatus.Crashed or SidecarStatus.Error => Colors.Tomato,
            _ => Colors.Gray,
        };
        EngineIndicator.Fill = new SolidColorBrush(color);
    }

    private async void RestartSidecar_Click(object sender, RoutedEventArgs e)
    {
        SidecarLoading.IsActive = true;
        try
        {
            await _sidecar.StopAsync();
            await _sidecar.StartAsync();
        }
        catch
        {
            SidecarStatusText.Text = "Failed to restart. Try again.";
            EngineIndicator.Fill = new SolidColorBrush(Colors.Tomato);
        }
        finally
        {
            SidecarLoading.IsActive = false;
        }
    }
}
