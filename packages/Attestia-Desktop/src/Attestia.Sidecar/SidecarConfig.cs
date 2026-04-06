namespace Attestia.Sidecar;

public sealed class SidecarConfig
{
    public string? NodePath { get; set; }
    public string? ServerEntryPoint { get; set; }
    public int Port { get; set; }
    public TimeSpan HealthCheckInterval { get; set; } = TimeSpan.FromSeconds(5);
    public TimeSpan StartupTimeout { get; set; } = TimeSpan.FromSeconds(30);
    public TimeSpan ShutdownTimeout { get; set; } = TimeSpan.FromSeconds(10);
    public bool AutoRestart { get; set; } = true;
}
