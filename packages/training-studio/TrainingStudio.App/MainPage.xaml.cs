using System.Text.Json;
using CommunityToolkit.Maui.Storage;

namespace TrainingStudio.App;

public partial class MainPage : ContentPage
{
    private readonly Services.DatasetService _datasetService;
    private readonly Services.ExportService _exportService;

    public MainPage()
    {
        InitializeComponent();
        _datasetService = new Services.DatasetService();
        _exportService = new Services.ExportService();
    }

    private async void OnHybridMessage(object? sender, HybridWebViewRawMessageReceivedEventArgs e)
    {
        if (string.IsNullOrEmpty(e.Message)) return;

        try
        {
            var message = JsonSerializer.Deserialize<BridgeMessage>(e.Message);
            if (message == null) return;

            var response = message.Action switch
            {
                "openFile" => await HandleOpenFile(message),
                "saveModel" => await HandleSaveModel(message),
                "exportBundle" => await HandleExportBundle(message),
                "getDatasetPreview" => await HandleGetDatasetPreview(message),
                _ => new BridgeResponse { Success = false, Error = $"Unknown action: {message.Action}" }
            };

            await SendToJs(message.RequestId, response);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Bridge error: {ex.Message}");
        }
    }

    private async Task<BridgeResponse> HandleOpenFile(BridgeMessage message)
    {
        var fileTypes = message.Payload?.GetProperty("fileTypes").GetString() ?? "csv";

        var customFileType = new FilePickerFileType(new Dictionary<DevicePlatform, IEnumerable<string>>
        {
            { DevicePlatform.WinUI, fileTypes == "json" ? new[] { ".json" } : new[] { ".csv" } }
        });

        var result = await FilePicker.Default.PickAsync(new PickOptions
        {
            PickerTitle = "Select a dataset file",
            FileTypes = customFileType
        });

        if (result == null)
        {
            return new BridgeResponse { Success = false, Error = "No file selected" };
        }

        var content = await File.ReadAllTextAsync(result.FullPath);
        var preview = _datasetService.ParseCsvPreview(content);

        return new BridgeResponse
        {
            Success = true,
            Data = JsonSerializer.SerializeToElement(new
            {
                fileName = result.FileName,
                filePath = result.FullPath,
                content = content,
                preview = preview
            })
        };
    }

    private async Task<BridgeResponse> HandleSaveModel(BridgeMessage message)
    {
        var modelJson = message.Payload?.GetProperty("modelJson").GetString();
        var weightsBase64 = message.Payload?.GetProperty("weightsBase64").GetString();
        var fileName = message.Payload?.GetProperty("fileName").GetString() ?? "model";

        if (string.IsNullOrEmpty(modelJson) || string.IsNullOrEmpty(weightsBase64))
        {
            return new BridgeResponse { Success = false, Error = "Missing model data" };
        }

        var folder = await FolderPicker.Default.PickAsync(default);
        if (folder == null || !folder.IsSuccessful)
        {
            return new BridgeResponse { Success = false, Error = "No folder selected" };
        }

        var basePath = Path.Combine(folder.Folder.Path, fileName);
        await File.WriteAllTextAsync($"{basePath}.json", modelJson);
        await File.WriteAllBytesAsync($"{basePath}.weights.bin", Convert.FromBase64String(weightsBase64));

        return new BridgeResponse
        {
            Success = true,
            Data = JsonSerializer.SerializeToElement(new { path = basePath })
        };
    }

    private async Task<BridgeResponse> HandleExportBundle(BridgeMessage message)
    {
        var bundle = message.Payload;
        if (bundle == null)
        {
            return new BridgeResponse { Success = false, Error = "Missing bundle data" };
        }

        var folder = await FolderPicker.Default.PickAsync(default);
        if (folder == null || !folder.IsSuccessful)
        {
            return new BridgeResponse { Success = false, Error = "No folder selected" };
        }

        var exportPath = await _exportService.CreateExportBundle(folder.Folder.Path, bundle.Value);

        return new BridgeResponse
        {
            Success = true,
            Data = JsonSerializer.SerializeToElement(new { path = exportPath })
        };
    }

    private Task<BridgeResponse> HandleGetDatasetPreview(BridgeMessage message)
    {
        var content = message.Payload?.GetProperty("content").GetString();
        if (string.IsNullOrEmpty(content))
        {
            return Task.FromResult(new BridgeResponse { Success = false, Error = "No content provided" });
        }

        var preview = _datasetService.ParseCsvPreview(content);
        return Task.FromResult(new BridgeResponse
        {
            Success = true,
            Data = JsonSerializer.SerializeToElement(preview)
        });
    }

    private async Task SendToJs(string requestId, BridgeResponse response)
    {
        var json = JsonSerializer.Serialize(new
        {
            requestId,
            success = response.Success,
            data = response.Data,
            error = response.Error
        });

        await hybridWebView.EvaluateJavaScriptAsync($"window.bridgeCallback({json})");
    }
}

public class BridgeMessage
{
    public string Action { get; set; } = "";
    public string RequestId { get; set; } = "";
    public JsonElement? Payload { get; set; }
}

public class BridgeResponse
{
    public bool Success { get; set; }
    public JsonElement? Data { get; set; }
    public string? Error { get; set; }
}
