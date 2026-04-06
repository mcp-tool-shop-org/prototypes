namespace PocketLedger.Application.Configuration;

public class AppSettings
{
    public DatabaseSettings Database { get; set; } = new();
    public UserPreferences Preferences { get; set; } = new();
    public BudgetSettings Budget { get; set; } = new();
}

public class DatabaseSettings
{
    public string DatabasePath { get; set; } = string.Empty;
    public string BackupPath { get; set; } = string.Empty;
    public bool AutoBackupEnabled { get; set; } = true;
    public int BackupRetentionDays { get; set; } = 30;
}

public class UserPreferences
{
    public string DefaultCurrency { get; set; } = "USD";
    public string DateFormat { get; set; } = "yyyy-MM-dd";
    public string Theme { get; set; } = "System";
    public bool ShowClearedTransactions { get; set; } = true;
    public int DefaultTransactionCount { get; set; } = 50;
    public DayOfWeek WeekStartsOn { get; set; } = DayOfWeek.Sunday;
    public int MonthStartsOnDay { get; set; } = 1;
}

public class BudgetSettings
{
    public bool WarnOnOverBudget { get; set; } = true;
    public decimal WarningThresholdPercent { get; set; } = 90;
    public bool AutoCopyEnvelopes { get; set; } = true;
    public bool ShowRemainingInsteadOfSpent { get; set; } = true;
}
