using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PocketLedger.Application.Configuration;
using PocketLedger.Application.Events;
using PocketLedger.Application.Interfaces;
using PocketLedger.Infrastructure.Configuration;
using PocketLedger.Infrastructure.Events;
using PocketLedger.Infrastructure.Persistence;
using PocketLedger.Infrastructure.Repositories;

namespace PocketLedger.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        var databasePath = GetDatabasePath(configuration);

        services.AddDbContext<PocketLedgerDbContext>(options =>
        {
            options.UseSqlite($"Data Source={databasePath}");
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IEnvelopeRepository, EnvelopeRepository>();
        services.AddScoped<IGoalRepository, GoalRepository>();
        services.AddScoped<IRecurringTransactionRepository, RecurringTransactionRepository>();

        services.AddScoped<DatabaseInitializer>();

        services.AddSingleton<ISettingsService, JsonSettingsService>();

        services.AddSingleton<IEventDispatcher, InMemoryEventDispatcher>();
        services.AddSingleton<IEventStore, InMemoryEventStore>();

        return services;
    }

    private static string GetDatabasePath(IConfiguration? configuration)
    {
        var configuredPath = configuration?["Database:Path"];

        if (!string.IsNullOrEmpty(configuredPath))
            return configuredPath;

        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var pocketLedgerPath = Path.Combine(appDataPath, "PocketLedger");

        if (!Directory.Exists(pocketLedgerPath))
        {
            Directory.CreateDirectory(pocketLedgerPath);
        }

        return Path.Combine(pocketLedgerPath, "pocketledger.db");
    }
}
