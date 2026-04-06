using Microsoft.Extensions.Logging;

namespace Attestia.Sidecar;

public sealed class NodeBundleLocator
{
    private readonly ILogger<NodeBundleLocator> _logger;

    public NodeBundleLocator(ILogger<NodeBundleLocator> logger)
    {
        _logger = logger;
    }

    public string FindNodeExecutable(string? configuredPath = null)
    {
        if (!string.IsNullOrEmpty(configuredPath) && File.Exists(configuredPath))
        {
            _logger.LogInformation("Using configured Node.js path: {Path}", configuredPath);
            return configuredPath;
        }

        // Check bundled location (relative to app)
        var appDir = AppContext.BaseDirectory;
        var bundledNode = Path.Combine(appDir, "assets", "node", "node.exe");
        if (File.Exists(bundledNode))
        {
            _logger.LogInformation("Found bundled Node.js: {Path}", bundledNode);
            return bundledNode;
        }

        // Fallback to system PATH
        var systemNode = FindInPath("node.exe");
        if (systemNode is not null)
        {
            _logger.LogInformation("Found system Node.js: {Path}", systemNode);
            return systemNode;
        }

        throw new FileNotFoundException(
            "Node.js not found. Ensure node.exe is bundled in assets/node/ or available on PATH.");
    }

    public string FindServerEntryPoint(string? configuredPath = null)
    {
        if (!string.IsNullOrEmpty(configuredPath) && File.Exists(configuredPath))
        {
            return configuredPath;
        }

        var appDir = AppContext.BaseDirectory;
        var bundledServer = Path.Combine(appDir, "assets", "node", "server", "dist", "main.js");
        if (File.Exists(bundledServer))
        {
            return bundledServer;
        }

        throw new FileNotFoundException(
            "Attestia server entry point not found. Ensure the server is bundled in assets/node/server/dist/main.js");
    }

    private static string? FindInPath(string executable)
    {
        var pathVar = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrEmpty(pathVar)) return null;

        foreach (var dir in pathVar.Split(Path.PathSeparator))
        {
            var fullPath = Path.Combine(dir, executable);
            if (File.Exists(fullPath))
            {
                return fullPath;
            }
        }

        return null;
    }
}
