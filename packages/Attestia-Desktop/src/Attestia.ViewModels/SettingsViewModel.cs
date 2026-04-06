using CommunityToolkit.Mvvm.ComponentModel;
using Attestia.Sidecar;

namespace Attestia.ViewModels;

public partial class SettingsViewModel : ViewModelBase
{
    private readonly NodeSidecar _sidecar;

    [ObservableProperty]
    private string? _apiKey;

    [ObservableProperty]
    private int _serverPort;

    [ObservableProperty]
    private SidecarStatus _sidecarStatus;

    [ObservableProperty]
    private string _appVersion = "0.1.0-alpha";

    public SettingsViewModel(NodeSidecar sidecar)
    {
        _sidecar = sidecar;
        ServerPort = sidecar.Port;
        SidecarStatus = sidecar.IsRunning ? SidecarStatus.Running : SidecarStatus.Stopped;

        _sidecar.StatusChanged += (_, status) =>
        {
            SidecarStatus = status;
            ServerPort = _sidecar.Port;
        };
    }
}
