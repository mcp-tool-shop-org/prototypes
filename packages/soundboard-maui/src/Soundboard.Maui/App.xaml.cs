using Soundboard.Maui.Views;

namespace Soundboard.Maui;

public partial class App : Application
{
    private readonly MainPage _mainPage;

    public App(MainPage mainPage)
    {
        InitializeComponent();
        _mainPage = mainPage;
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        var window = new Window(new NavigationPage(_mainPage))
        {
            Title = "Soundboard",
            Width = 540,
            Height = 760,
            MinimumWidth = 400,
            MinimumHeight = 600
        };

        return window;
    }
}
