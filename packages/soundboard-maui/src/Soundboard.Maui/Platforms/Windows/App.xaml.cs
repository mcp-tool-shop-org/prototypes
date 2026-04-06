using Microsoft.UI.Xaml;

namespace Soundboard.Maui.WinUI;

public partial class App : MauiWinUIApplication
{
    public App()
    {
        InitializeComponent();
    }

    protected override MauiApp CreateMauiApp() => Soundboard.Maui.MauiProgram.CreateMauiApp();
}
