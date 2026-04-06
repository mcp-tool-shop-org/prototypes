using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace PocketLedger.Infrastructure.Logging;

public class FileLoggerProvider : ILoggerProvider
{
    private readonly string _logDirectory;
    private readonly ConcurrentDictionary<string, FileLogger> _loggers = new();
    private readonly LogLevel _minLevel;

    public FileLoggerProvider(string? logDirectory = null, LogLevel minLevel = LogLevel.Information)
    {
        _minLevel = minLevel;

        if (string.IsNullOrEmpty(logDirectory))
        {
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            _logDirectory = Path.Combine(appDataPath, "PocketLedger", "logs");
        }
        else
        {
            _logDirectory = logDirectory;
        }

        if (!Directory.Exists(_logDirectory))
        {
            Directory.CreateDirectory(_logDirectory);
        }
    }

    public ILogger CreateLogger(string categoryName)
    {
        return _loggers.GetOrAdd(categoryName, name => new FileLogger(name, _logDirectory, _minLevel));
    }

    public void Dispose()
    {
        _loggers.Clear();
    }
}

public class FileLogger : ILogger
{
    private readonly string _categoryName;
    private readonly string _logDirectory;
    private readonly LogLevel _minLevel;
    private readonly object _lock = new();

    public FileLogger(string categoryName, string logDirectory, LogLevel minLevel)
    {
        _categoryName = categoryName;
        _logDirectory = logDirectory;
        _minLevel = minLevel;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel >= _minLevel;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel))
            return;

        var message = formatter(state, exception);
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        var level = logLevel.ToString().ToUpper().PadRight(11);
        var logEntry = $"[{timestamp}] [{level}] [{_categoryName}] {message}";

        if (exception != null)
        {
            logEntry += Environment.NewLine + exception.ToString();
        }

        var logFile = Path.Combine(_logDirectory, $"pocketledger-{DateTime.Today:yyyy-MM-dd}.log");

        lock (_lock)
        {
            File.AppendAllText(logFile, logEntry + Environment.NewLine);
        }
    }
}

public static class FileLoggerExtensions
{
    public static ILoggingBuilder AddFileLogger(
        this ILoggingBuilder builder,
        string? logDirectory = null,
        LogLevel minLevel = LogLevel.Information)
    {
        builder.AddProvider(new FileLoggerProvider(logDirectory, minLevel));
        return builder;
    }
}
