using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Attestia.ViewModels;

namespace Attestia.App.Pages;

public sealed partial class CompliancePage : Page
{
    private readonly ComplianceViewModel _vm;

    public CompliancePage()
    {
        InitializeComponent();
        _vm = App.GetService<ComplianceViewModel>();

        _vm.PropertyChanged += (_, e) =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (e.PropertyName == nameof(ComplianceViewModel.IsBusy))
                    LoadingRing.IsActive = _vm.IsBusy;
                else if (e.PropertyName == nameof(ComplianceViewModel.ErrorMessage))
                {
                    ErrorText.Text = _vm.ErrorMessage ?? "";
                    RetryBtn.Visibility = string.IsNullOrEmpty(_vm.ErrorMessage)
                        ? Visibility.Collapsed : Visibility.Visible;
                }
                else if (e.PropertyName == nameof(ComplianceViewModel.CurrentReport))
                    UpdateReport();
            });
        };
    }

    private async void Page_Loaded(object sender, RoutedEventArgs e)
    {
        await _vm.LoadFrameworksCommand.ExecuteAsync(null);
        UpdateFrameworkCombo();
    }

    private void UpdateFrameworkCombo()
    {
        FrameworkCombo.Items.Clear();
        foreach (var fw in _vm.Frameworks)
        {
            FrameworkCombo.Items.Add(new ComboBoxItem
            {
                Content = $"{fw.Name} ({fw.Version})",
                Tag = fw.Id,
            });
        }

        var hasFrameworks = FrameworkCombo.Items.Count > 0;
        EmptyState.Visibility = hasFrameworks ? Visibility.Collapsed : Visibility.Visible;

        if (hasFrameworks)
            FrameworkCombo.SelectedIndex = 0;
    }

    private void Framework_Changed(object sender, SelectionChangedEventArgs e)
    {
        if (FrameworkCombo.SelectedItem is ComboBoxItem item)
        {
            _vm.SelectedFrameworkId = item.Tag as string;
        }
    }

    private async void GenerateReport_Click(object sender, RoutedEventArgs e)
    {
        await _vm.LoadReportCommand.ExecuteAsync(null);
    }

    private void UpdateReport()
    {
        var report = _vm.CurrentReport;
        if (report is null)
        {
            ReportPanel.Visibility = Visibility.Collapsed;
            return;
        }

        ReportPanel.Visibility = Visibility.Visible;
        ScoreText.Text = $"{report.Score:P0}";
        PassedText.Text = report.PassedControls.ToString();
        TotalText.Text = report.TotalControls.ToString();
        EvaluationsList.ItemsSource = report.Evaluations;
    }
}
