namespace Attestia.Client;

public sealed class AttestiaClientConfig
{
    public required string BaseUrl { get; init; }
    public string? ApiKey { get; init; }
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);
    public int MaxRetries { get; init; } = 3;
}
