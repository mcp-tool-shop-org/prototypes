using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Attestia.Client;
using Attestia.Sidecar;
using Attestia.ViewModels;

namespace Attestia.App;

public static class Startup
{
    public static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        ConfigureLogging(services);
        ConfigureSidecar(services, configuration);
        ConfigureClient(services, configuration);
        ConfigureViewModels(services);
    }

    private static void ConfigureViewModels(IServiceCollection services)
    {
        services.AddTransient<DashboardViewModel>();
        services.AddTransient<IntentsViewModel>();
        services.AddTransient<IntentDetailViewModel>();
        services.AddTransient<DeclareIntentViewModel>();
        services.AddTransient<ReconciliationViewModel>();
        services.AddTransient<ProofsViewModel>();
        services.AddTransient<ComplianceViewModel>();
        services.AddTransient<EventsViewModel>();
        services.AddTransient<SettingsViewModel>();
    }

    private static void ConfigureLogging(IServiceCollection services)
    {
        var logPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Attestia", "Logs", "attestia-.log");
        Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.File(logPath, rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
            .CreateLogger();

        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddSerilog(dispose: true);
        });
    }

    private static void ConfigureSidecar(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SidecarConfig>(configuration.GetSection("Attestia"));
        services.AddSingleton<NodeBundleLocator>();
        services.AddSingleton<NodeSidecar>();
    }

    private static void ConfigureClient(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<AttestiaClientConfig>(sp =>
        {
            var sidecar = sp.GetRequiredService<NodeSidecar>();
            var apiKey = configuration["Attestia:ApiKey"];
            return new AttestiaClientConfig
            {
                BaseUrl = sidecar.BaseUrl,
                ApiKey = string.IsNullOrEmpty(apiKey) ? null : apiKey,
            };
        });

        services.AddHttpClient<AttestiaHttpClient>();

        services.AddSingleton(sp =>
        {
            var config = sp.GetRequiredService<AttestiaClientConfig>();
            var http = sp.GetRequiredService<AttestiaHttpClient>();
            return new AttestiaClient(http);
        });
    }
}
