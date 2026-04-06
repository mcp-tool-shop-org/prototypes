using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace PocketLedger.Infrastructure.Logging;

public static class LoggingConfiguration
{
    public static IServiceCollection AddPocketLedgerLogging(this IServiceCollection services)
    {
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.AddDebug();

            builder.SetMinimumLevel(LogLevel.Information);

            builder.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
            builder.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
        });

        return services;
    }
}

public static class LoggingCategories
{
    public const string Transaction = "PocketLedger.Transaction";
    public const string Account = "PocketLedger.Account";
    public const string Budget = "PocketLedger.Budget";
    public const string Goal = "PocketLedger.Goal";
    public const string Persistence = "PocketLedger.Persistence";
    public const string Configuration = "PocketLedger.Configuration";
    public const string Events = "PocketLedger.Events";
}

public static class LoggerExtensions
{
    public static void LogTransactionCreated(
        this ILogger logger,
        Guid transactionId,
        decimal amount,
        string description)
    {
        logger.LogInformation(
            "Transaction created: {TransactionId}, Amount: {Amount}, Description: {Description}",
            transactionId, amount, description);
    }

    public static void LogAccountBalanceChanged(
        this ILogger logger,
        Guid accountId,
        decimal oldBalance,
        decimal newBalance)
    {
        logger.LogInformation(
            "Account balance changed: {AccountId}, Old: {OldBalance}, New: {NewBalance}",
            accountId, oldBalance, newBalance);
    }

    public static void LogBudgetWarning(
        this ILogger logger,
        string envelopeName,
        decimal percentUsed)
    {
        logger.LogWarning(
            "Budget warning: {EnvelopeName} is at {PercentUsed}% capacity",
            envelopeName, percentUsed);
    }

    public static void LogGoalCompleted(
        this ILogger logger,
        Guid goalId,
        string goalName,
        decimal targetAmount)
    {
        logger.LogInformation(
            "Goal completed: {GoalId}, Name: {GoalName}, Target: {TargetAmount}",
            goalId, goalName, targetAmount);
    }

    public static void LogDatabaseOperation(
        this ILogger logger,
        string operation,
        string entityType,
        int affectedRows)
    {
        logger.LogDebug(
            "Database {Operation} on {EntityType}: {AffectedRows} rows affected",
            operation, entityType, affectedRows);
    }

    public static void LogSettingsChanged(
        this ILogger logger,
        string settingName,
        object? oldValue,
        object? newValue)
    {
        logger.LogInformation(
            "Setting changed: {SettingName}, Old: {OldValue}, New: {NewValue}",
            settingName, oldValue, newValue);
    }
}
