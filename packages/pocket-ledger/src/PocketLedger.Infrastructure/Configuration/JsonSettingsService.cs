using System.Text.Json;
using Microsoft.Extensions.Logging;
using PocketLedger.Application.Configuration;

namespace PocketLedger.Infrastructure.Configuration;

public class JsonSettingsService : ISettingsService
{
    private readonly string _settingsPath;
    private readonly ILogger<JsonSettingsService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private AppSettings? _cachedSettings;

    public JsonSettingsService(ILogger<JsonSettingsService> logger)
    {
        _logger = logger;

        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var pocketLedgerPath = Path.Combine(appDataPath, "PocketLedger");

        if (!Directory.Exists(pocketLedgerPath))
        {
            Directory.CreateDirectory(pocketLedgerPath);
        }

        _settingsPath = Path.Combine(pocketLedgerPath, "settings.json");

        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<AppSettings> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        if (_cachedSettings is not null)
            return _cachedSettings;

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_cachedSettings is not null)
                return _cachedSettings;

            if (!File.Exists(_settingsPath))
            {
                _cachedSettings = CreateDefaultSettings();
                await SaveSettingsInternalAsync(_cachedSettings, cancellationToken);
                return _cachedSettings;
            }

            var json = await File.ReadAllTextAsync(_settingsPath, cancellationToken);
            _cachedSettings = JsonSerializer.Deserialize<AppSettings>(json, _jsonOptions) ?? CreateDefaultSettings();

            return _cachedSettings;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading settings, using defaults");
            _cachedSettings = CreateDefaultSettings();
            return _cachedSettings;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task SaveSettingsAsync(AppSettings settings, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await SaveSettingsInternalAsync(settings, cancellationToken);
            _cachedSettings = settings;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<T> GetAsync<T>(string key, T defaultValue, CancellationToken cancellationToken = default)
    {
        var settings = await GetSettingsAsync(cancellationToken);
        var property = typeof(AppSettings).GetProperty(key);

        if (property is null)
        {
            _logger.LogWarning("Setting key {Key} not found", key);
            return defaultValue;
        }

        var value = property.GetValue(settings);
        return value is T typedValue ? typedValue : defaultValue;
    }

    public async Task SetAsync<T>(string key, T value, CancellationToken cancellationToken = default)
    {
        var settings = await GetSettingsAsync(cancellationToken);
        var property = typeof(AppSettings).GetProperty(key);

        if (property is null)
        {
            _logger.LogWarning("Setting key {Key} not found", key);
            return;
        }

        property.SetValue(settings, value);
        await SaveSettingsAsync(settings, cancellationToken);
    }

    public async Task ResetToDefaultsAsync(CancellationToken cancellationToken = default)
    {
        var defaults = CreateDefaultSettings();
        await SaveSettingsAsync(defaults, cancellationToken);
    }

    private async Task SaveSettingsInternalAsync(AppSettings settings, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(settings, _jsonOptions);
        await File.WriteAllTextAsync(_settingsPath, json, cancellationToken);
    }

    private AppSettings CreateDefaultSettings()
    {
        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var pocketLedgerPath = Path.Combine(appDataPath, "PocketLedger");

        return new AppSettings
        {
            Database = new DatabaseSettings
            {
                DatabasePath = Path.Combine(pocketLedgerPath, "pocketledger.db"),
                BackupPath = Path.Combine(pocketLedgerPath, "backups"),
                AutoBackupEnabled = true,
                BackupRetentionDays = 30
            },
            Preferences = new UserPreferences
            {
                DefaultCurrency = "USD",
                DateFormat = "yyyy-MM-dd",
                Theme = "System",
                ShowClearedTransactions = true,
                DefaultTransactionCount = 50,
                WeekStartsOn = DayOfWeek.Sunday,
                MonthStartsOnDay = 1
            },
            Budget = new BudgetSettings
            {
                WarnOnOverBudget = true,
                WarningThresholdPercent = 90,
                AutoCopyEnvelopes = true,
                ShowRemainingInsteadOfSpent = true
            }
        };
    }
}
