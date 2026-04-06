using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OllamaSharp;
using InControl.Core.Configuration;
using InControl.Core.Models;
using InControl.Inference.Interfaces;

namespace InControl.Inference.Ollama;

/// <summary>
/// Model manager implementation backed by Ollama.
/// Handles listing, pulling, deleting, and preloading models.
/// </summary>
public sealed class OllamaModelManager : IModelManager
{
    private readonly IOptions<OllamaOptions> _options;
    private readonly ILogger<OllamaModelManager> _logger;
    private OllamaApiClient? _client;

    public event EventHandler<ModelListChangedEventArgs>? ModelsChanged;
    public event EventHandler<ModelDownloadProgressEventArgs>? DownloadProgress;

    public OllamaModelManager(
        IOptions<OllamaOptions> options,
        ILogger<OllamaModelManager> logger)
    {
        _options = options;
        _logger = logger;
    }

    private OllamaApiClient GetClient()
    {
        if (_client is null)
        {
            _client = new OllamaApiClient(_options.Value.BaseUrl);
        }
        return _client;
    }

    public async Task<IReadOnlyList<ModelInfo>> ListModelsAsync(CancellationToken ct = default)
    {
        var client = GetClient();
        var models = await client.ListLocalModelsAsync(ct);

        return models.Select(m => new ModelInfo
        {
            Id = m.Name,
            Name = m.Name,
            SizeBytes = m.Size,
            ParameterCount = m.Details?.ParameterSize,
            Quantization = m.Details?.QuantizationLevel,
            Family = m.Details?.Family,
            ModifiedAt = m.ModifiedAt
        }).ToList();
    }

    public async Task<ModelInfo> PullModelAsync(string modelId, CancellationToken ct = default)
    {
        var client = GetClient();
        _logger.LogInformation("Pulling model {ModelId}", modelId);

        await foreach (var status in client.PullModelAsync(modelId, ct))
        {
            if (status != null)
            {
                DownloadProgress?.Invoke(this, new ModelDownloadProgressEventArgs
                {
                    ModelId = modelId,
                    Status = status.Status ?? "Downloading",
                    BytesDownloaded = status.Completed,
                    TotalBytes = status.Total > 0 ? status.Total : null
                });
            }
        }

        // Refresh to get the pulled model info
        var models = await ListModelsAsync(ct);
        var pulled = models.FirstOrDefault(m =>
            m.Id.StartsWith(modelId, StringComparison.OrdinalIgnoreCase));

        var result = pulled ?? new ModelInfo
        {
            Id = modelId,
            Name = modelId,
            ModifiedAt = DateTimeOffset.UtcNow
        };

        ModelsChanged?.Invoke(this, new ModelListChangedEventArgs
        {
            ChangeType = ModelListChangeType.Added,
            Model = result
        });

        return result;
    }

    public async Task DeleteModelAsync(string modelId, CancellationToken ct = default)
    {
        var client = GetClient();
        _logger.LogInformation("Deleting model {ModelId}", modelId);

        await client.DeleteModelAsync(modelId, ct);

        ModelsChanged?.Invoke(this, new ModelListChangedEventArgs
        {
            ChangeType = ModelListChangeType.Removed,
            Model = new ModelInfo { Id = modelId, Name = modelId }
        });
    }

    public Task PreloadModelAsync(string modelId, CancellationToken ct = default)
    {
        // Ollama preloads on first inference request
        _logger.LogDebug("Preload requested for {ModelId} (handled by Ollama on first use)", modelId);
        return Task.CompletedTask;
    }

    public Task UnloadModelAsync(string modelId, CancellationToken ct = default)
    {
        _logger.LogDebug("Unload requested for {ModelId}", modelId);
        return Task.CompletedTask;
    }
}
