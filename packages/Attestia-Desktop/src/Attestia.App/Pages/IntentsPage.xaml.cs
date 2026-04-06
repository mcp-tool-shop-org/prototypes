using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Attestia.Core.Models;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class IntentsPage : Page
{
    public IntentsViewModel ViewModel { get; }

    public IntentsPage()
    {
        InitializeComponent();
        ViewModel = App.GetService<IntentsViewModel>();

        ViewModel.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(IntentsViewModel.IsBusy))
                {
                    LoadingRing.IsActive = ViewModel.IsBusy;
                    if (!ViewModel.IsBusy)
                    {
                        var hasItems = ViewModel.Intents.Count > 0;
                        var hasError = !string.IsNullOrEmpty(ViewModel.ErrorMessage);
                        EmptyState.Visibility = !hasItems && !hasError ? Visibility.Visible : Visibility.Collapsed;
                        IntentsList.Visibility = hasItems ? Visibility.Visible : Visibility.Collapsed;
                    }
                }
                else if (e.PropertyName == nameof(IntentsViewModel.ErrorMessage))
                {
                    ErrorText.Text = ViewModel.ErrorMessage ?? "";
                    RetryBtn.Visibility = string.IsNullOrEmpty(ViewModel.ErrorMessage)
                        ? Visibility.Collapsed : Visibility.Visible;
                }
                else if (e.PropertyName == nameof(IntentsViewModel.HasMore))
                {
                    LoadMoreBtn.Visibility = ViewModel.HasMore ? Visibility.Visible : Visibility.Collapsed;
                }
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

    private async void StatusFilter_Changed(object sender, SelectionChangedEventArgs e)
    {
        if (StatusFilter.SelectedItem is ComboBoxItem item)
        {
            var tag = item.Tag as string;
            ViewModel.StatusFilter = string.IsNullOrEmpty(tag) ? null : tag;
            await ViewModel.LoadCommand.ExecuteAsync(null);
        }
    }

    private void Intent_Click(object sender, ItemClickEventArgs e)
    {
        if (e.ClickedItem is Intent intent)
        {
            Frame.Navigate(typeof(IntentDetailPage), intent.Id);
        }
    }

    private void Declare_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(DeclareIntentPage));
    }

    private void Reconcile_Click(object sender, RoutedEventArgs e)
    {
        Frame.Navigate(typeof(ReconciliationPage));
    }
}
