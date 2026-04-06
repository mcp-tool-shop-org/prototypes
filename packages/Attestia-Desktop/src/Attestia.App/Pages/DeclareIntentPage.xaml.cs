using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class DeclareIntentPage : Page
{
    private readonly DeclareIntentViewModel _vm;

    public DeclareIntentPage()
    {
        InitializeComponent();
        _vm = App.GetService<DeclareIntentViewModel>();

        _vm.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(DeclareIntentViewModel.IsBusy))
                    LoadingRing.IsActive = _vm.IsBusy;
                else if (e.PropertyName == nameof(DeclareIntentViewModel.ErrorMessage))
                    ErrorText.Text = _vm.ErrorMessage ?? "";
                else if (e.PropertyName == nameof(DeclareIntentViewModel.DeclaredIntent))
                    OnDeclared();
            });
        };
    }

    private void OnDeclared()
    {
        if (_vm.DeclaredIntent is null) return;

        SuccessPanel.Visibility = Visibility.Visible;
        DeclaredIdText.Text = _vm.DeclaredIntent.Id;
    }

    private void Back_Click(object sender, RoutedEventArgs e)
    {
        if (Frame.CanGoBack)
            Frame.GoBack();
    }

    private async void Declare_Click(object sender, RoutedEventArgs e)
    {
        var description = DescriptionBox.Text?.Trim();
        if (string.IsNullOrEmpty(description))
        {
            ErrorText.Text = "Description is required. Describe what this intent represents.";
            return;
        }

        var intentId = IntentIdBox.Text?.Trim();
        // Auto-generate ID if left blank
        if (string.IsNullOrEmpty(intentId))
        {
            intentId = $"intent-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8]}";
        }

        ErrorText.Text = "";
        _vm.IntentId = intentId;
        _vm.Kind = (KindCombo.SelectedItem as ComboBoxItem)?.Content as string ?? "transfer";
        _vm.Description = description;
        _vm.FromAddress = FromBox.Text?.Trim();
        _vm.ToAddress = ToBox.Text?.Trim();
        _vm.Amount = AmountBox.Text?.Trim();
        _vm.Currency = (CurrencyCombo.SelectedItem as ComboBoxItem)?.Content as string ?? "USD";
        _vm.ChainId = ChainIdBox.Text?.Trim();

        await _vm.DeclareCommand.ExecuteAsync(null);
    }

    private void ShowAdvanced_Toggled(object sender, RoutedEventArgs e)
    {
        AdvancedFieldsPanel.Visibility = ShowAdvancedToggle.IsChecked == true
            ? Visibility.Visible : Visibility.Collapsed;
        ShowAdvancedToggle.Content = ShowAdvancedToggle.IsChecked == true
            ? "Hide transaction parameters" : "Show transaction parameters";
    }

    private void ViewDeclared_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.DeclaredIntent is not null)
        {
            Frame.Navigate(typeof(IntentDetailPage), _vm.DeclaredIntent.Id);
        }
    }

    private void DeclareAnother_Click(object sender, RoutedEventArgs e)
    {
        // Reset form for another declaration
        SuccessPanel.Visibility = Visibility.Collapsed;
        IntentIdBox.Text = "";
        DescriptionBox.Text = "";
        FromBox.Text = "";
        ToBox.Text = "";
        AmountBox.Text = "";
        ChainIdBox.Text = "";
        KindCombo.SelectedIndex = 0;
        CurrencyCombo.SelectedIndex = 0;
        ShowAdvancedToggle.IsChecked = false;
        AdvancedFieldsPanel.Visibility = Visibility.Collapsed;
        ErrorText.Text = "";
    }
}
