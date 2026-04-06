using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.UI.Xaml;

namespace Attestia.App;

public partial class App : Application
{
    private IHost? _host;

    public App()
    {
        InitializeComponent();

        UnhandledException += OnUnhandledException;
        System.AppDomain.CurrentDomain.UnhandledException += OnDomainUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
    }

    public static IServiceProvider Services => ((App)Current)._host!.Services;

    public static T GetService<T>() where T : class => Services.GetRequiredService<T>();

    public static MainWindow? MainWindow { get; private set; }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        try
        {
            _host = CreateHostBuilder().Build();
            await _host.StartAsync();

            MainWindow = new MainWindow();
            MainWindow.Activate();
        }
        catch (Exception ex)
        {
            LogFatalError(ex);
            throw;
        }
    }

    private void OnUnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs e)
    {
        LogFatalError(e.Exception);
    }

    private void OnDomainUnhandledException(object sender, System.UnhandledExceptionEventArgs e)
    {
        if (e.ExceptionObject is Exception ex)
        {
            LogFatalError(ex);
        }
    }

    private void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        LogFatalError(e.Exception);
        e.SetObserved();
    }

    private static void LogFatalError(Exception ex)
    {
        try
        {
            System.Diagnostics.Debug.WriteLine($"FATAL: {ex}");
            var logPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Attestia", "Logs", "crash.log");
            Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);
            File.WriteAllText(logPath,
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] FATAL CRASH\n{ex}\n");
        }
        catch
        {
            // Can't do much if logging fails
        }
    }

    private static IHostBuilder CreateHostBuilder()
    {
        return Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                Startup.ConfigureServices(services, context.Configuration);
            });
    }
}
