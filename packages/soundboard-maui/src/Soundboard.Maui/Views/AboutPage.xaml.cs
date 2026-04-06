namespace Soundboard.Maui.Views;

public partial class AboutPage : ContentPage
{
    public AboutPage()
    {
        InitializeComponent();
        VersionLabel.Text = $"Version {AppInfo.Current.VersionString} (build {AppInfo.Current.BuildString})";
    }
}
