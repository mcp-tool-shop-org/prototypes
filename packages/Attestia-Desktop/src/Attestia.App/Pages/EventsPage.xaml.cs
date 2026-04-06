using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class EventsPage : Page
{
    public EventsViewModel ViewModel { get; }

    public EventsPage()
    {
        InitializeComponent();
        ViewModel = App.GetService<EventsViewModel>();

        ViewModel.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(EventsViewModel.IsBusy))
                {
                    LoadingRing.IsActive = ViewModel.IsBusy;
                    if (!ViewModel.IsBusy)
                    {
                        var hasItems = ViewModel.Events.Count > 0;
                        var hasError = !string.IsNullOrEmpty(ViewModel.ErrorMessage);
                        EmptyState.Visibility = !hasItems && !hasError ? Visibility.Visible : Visibility.Collapsed;
                        EventsList.Visibility = hasItems ? Visibility.Visible : Visibility.Collapsed;
                    }
                }
                else if (e.PropertyName == nameof(EventsViewModel.ErrorMessage))
                {
                    ErrorText.Text = ViewModel.ErrorMessage ?? "";
                    RetryBtn.Visibility = string.IsNullOrEmpty(ViewModel.ErrorMessage)
                        ? Visibility.Collapsed : Visibility.Visible;
                }
                else if (e.PropertyName == nameof(EventsViewModel.HasMore))
                    LoadMoreBtn.Visibility = ViewModel.HasMore ? Visibility.Visible : Visibility.Collapsed;
            });
        };
    }

    private async void Page_Loaded(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadCommand.ExecuteAsync(null);
    }

    private async void Refresh_Click(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadCommand.ExecuteAsync(null);
    }

    private async void LoadMore_Click(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadMoreCommand.ExecuteAsync(null);
    }

    private async void ApplyFilter_Click(object sender, RoutedEventArgs e)
    {
        var text = StreamFilterBox.Text?.Trim();
        ViewModel.StreamFilter = string.IsNullOrEmpty(text) ? null : text;
        await ViewModel.LoadCommand.ExecuteAsync(null);
    }

    private async void Export_Click(object sender, RoutedEventArgs e)
    {
        await ViewModel.ExportNdjsonCommand.ExecuteAsync(null);
        var ndjson = ViewModel.LastExportedNdjson;
        if (ndjson is null) return;

        var picker = new Windows.Storage.Pickers.FileSavePicker();
        var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(App.MainWindow);
        WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
        picker.SuggestedFileName = "events";
        picker.FileTypeChoices.Add("NDJSON", [".ndjson"]);

        var file = await picker.PickSaveFileAsync();
        if (file is not null)
        {
            await Windows.Storage.FileIO.WriteTextAsync(file, ndjson);
        }
    }
}
