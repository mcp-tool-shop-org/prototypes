using Soundboard.Maui.ViewModels;

namespace Soundboard.Maui.Views;

public partial class MainPage : ContentPage
{
    private readonly SoundboardViewModel _vm;

    public MainPage(SoundboardViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;

        Loaded += OnLoaded;
    }

    private async void OnLoaded(object? sender, EventArgs e)
    {
        await _vm.LoadAsync();

        if (!_vm.ShowWelcome)
            TextEditor.Focus();
    }

    private async void OnAboutClicked(object? sender, EventArgs e)
        => await Navigation.PushAsync(new AboutPage());

#if WINDOWS
    protected override void OnHandlerChanged()
    {
        base.OnHandlerChanged();

        if (Handler?.PlatformView is Microsoft.UI.Xaml.UIElement element)
        {
            element.KeyDown += OnKeyDown;
        }
    }

    private void OnKeyDown(object sender, Microsoft.UI.Xaml.Input.KeyRoutedEventArgs e)
    {
        // Ctrl+Enter → Speak
        if (e.Key == Windows.System.VirtualKey.Enter &&
            Microsoft.UI.Input.InputKeyboardSource.GetKeyStateForCurrentThread(Windows.System.VirtualKey.Control)
                .HasFlag(Windows.UI.Core.CoreVirtualKeyStates.Down))
        {
            if (_vm.SpeakCommand.CanExecute(null))
                _vm.SpeakCommand.Execute(null);
            e.Handled = true;
            return;
        }

        // Escape → Stop
        if (e.Key == Windows.System.VirtualKey.Escape && _vm.IsSpeaking)
        {
            if (_vm.StopCommand.CanExecute(null))
                _vm.StopCommand.Execute(null);
            e.Handled = true;
        }
    }
#endif
}
