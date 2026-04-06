using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Attestia.Sidecar;

public sealed class NodeSidecar : IAsyncDisposable
{
    private readonly SidecarConfig _config;
    private readonly NodeBundleLocator _locator;
    private readonly ILogger<NodeSidecar> _logger;
    private readonly HttpClient _healthClient;

    private Process? _process;
    private CancellationTokenSource? _monitorCts;
    private Task? _monitorTask;
    private int _port;

    public NodeSidecar(
        IOptions<SidecarConfig> config,
        NodeBundleLocator locator,
        ILogger<NodeSidecar> logger)
    {
        _config = config.Value;
        _locator = locator;
        _logger = logger;
        _healthClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
    }

    public int Port => _port;
    public string BaseUrl => $"http://localhost:{_port}";
    public bool IsRunning => _process is not null && !_process.HasExited;

    public event EventHandler<SidecarStatus>? StatusChanged;

    public async Task StartAsync(CancellationToken ct = default)
    {
        _port = _config.Port > 0 ? _config.Port : FindAvailablePort();
        var nodePath = _locator.FindNodeExecutable(_config.NodePath);
        var serverPath = _locator.FindServerEntryPoint(_config.ServerEntryPoint);

        _logger.LogInformation("Starting Attestia sidecar on port {Port}", _port);
        _logger.LogDebug("Node: {NodePath}, Server: {ServerPath}", nodePath, serverPath);

        SpawnProcess(nodePath, serverPath);
        await WaitForReadyAsync(ct);

        _monitorCts = new CancellationTokenSource();
        _monitorTask = MonitorLoopAsync(_monitorCts.Token);

        StatusChanged?.Invoke(this, SidecarStatus.Running);
        _logger.LogInformation("Attestia sidecar ready on port {Port}", _port);
    }

    public async Task StopAsync()
    {
        _logger.LogInformation("Stopping Attestia sidecar");
        StatusChanged?.Invoke(this, SidecarStatus.Stopping);

        if (_monitorCts is not null)
        {
            await _monitorCts.CancelAsync();
            _monitorCts.Dispose();
            _monitorCts = null;
        }

        if (_monitorTask is not null)
        {
            try { await _monitorTask; }
            catch (OperationCanceledException) { }
            _monitorTask = null;
        }

        if (_process is not null && !_process.HasExited)
        {
            try
            {
                _process.Kill(entireProcessTree: true);
                await _process.WaitForExitAsync(new CancellationTokenSource(_config.ShutdownTimeout).Token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Force-killing sidecar process");
                try { _process.Kill(true); }
                catch { /* already dead */ }
            }
        }

        _process?.Dispose();
        _process = null;
        StatusChanged?.Invoke(this, SidecarStatus.Stopped);
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync();
        _healthClient.Dispose();
    }

    private void SpawnProcess(string nodePath, string serverPath)
    {
        var psi = new ProcessStartInfo
        {
            FileName = nodePath,
            Arguments = $"\"{serverPath}\"",
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };

        psi.Environment["PORT"] = _port.ToString();
        psi.Environment["NODE_ENV"] = "production";

        _process = new Process { StartInfo = psi, EnableRaisingEvents = true };

        _process.OutputDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                _logger.LogDebug("[sidecar] {Line}", e.Data);
        };
        _process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                _logger.LogWarning("[sidecar:err] {Line}", e.Data);
        };

        _process.Start();
        _process.BeginOutputReadLine();
        _process.BeginErrorReadLine();

        _logger.LogDebug("Sidecar process started (PID {Pid})", _process.Id);
    }

    private async Task WaitForReadyAsync(CancellationToken ct)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(_config.StartupTimeout);

        var pollInterval = TimeSpan.FromMilliseconds(250);

        while (!timeoutCts.Token.IsCancellationRequested)
        {
            try
            {
                var response = await _healthClient.GetAsync($"{BaseUrl}/health", timeoutCts.Token);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    return;
                }
            }
            catch (HttpRequestException)
            {
                // Server not ready yet
            }
            catch (TaskCanceledException) when (timeoutCts.Token.IsCancellationRequested)
            {
                break;
            }

            if (_process is not null && _process.HasExited)
            {
                throw new InvalidOperationException(
                    $"Sidecar process exited with code {_process.ExitCode} during startup");
            }

            await Task.Delay(pollInterval, timeoutCts.Token);
        }

        throw new TimeoutException(
            $"Sidecar did not become ready within {_config.StartupTimeout.TotalSeconds}s");
    }

    private async Task MonitorLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(_config.HealthCheckInterval, ct);

            if (_process is null || _process.HasExited)
            {
                _logger.LogWarning("Sidecar process exited unexpectedly");
                StatusChanged?.Invoke(this, SidecarStatus.Crashed);

                if (_config.AutoRestart)
                {
                    _logger.LogInformation("Auto-restarting sidecar");
                    try
                    {
                        var nodePath = _locator.FindNodeExecutable(_config.NodePath);
                        var serverPath = _locator.FindServerEntryPoint(_config.ServerEntryPoint);
                        SpawnProcess(nodePath, serverPath);
                        await WaitForReadyAsync(ct);
                        StatusChanged?.Invoke(this, SidecarStatus.Running);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to restart sidecar");
                        StatusChanged?.Invoke(this, SidecarStatus.Error);
                    }
                }

                continue;
            }

            // Health check
            try
            {
                var response = await _healthClient.GetAsync($"{BaseUrl}/health", ct);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Sidecar health check failed: {Status}", (int)response.StatusCode);
                    StatusChanged?.Invoke(this, SidecarStatus.Degraded);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Sidecar health check error");
                StatusChanged?.Invoke(this, SidecarStatus.Degraded);
            }
        }
    }

    private static int FindAvailablePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}

public enum SidecarStatus
{
    Stopped,
    Starting,
    Running,
    Degraded,
    Crashed,
    Stopping,
    Error,
}
