using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Attestia.Core.Models;
using Microsoft.Extensions.Logging;

namespace Attestia.Client;

public sealed class AttestiaHttpClient
{
    private readonly HttpClient _http;
    private readonly AttestiaClientConfig _config;
    private readonly ILogger<AttestiaHttpClient> _logger;

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters =
        {
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
        },
    };

    public AttestiaHttpClient(HttpClient http, AttestiaClientConfig config, ILogger<AttestiaHttpClient> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        _http.BaseAddress = new Uri(config.BaseUrl.TrimEnd('/'));
        _http.Timeout = config.Timeout;

        if (!string.IsNullOrEmpty(config.ApiKey))
        {
            _http.DefaultRequestHeaders.Add("X-Api-Key", config.ApiKey);
        }
    }

    internal async Task<T> GetAsync<T>(string path, CancellationToken ct = default)
    {
        var response = await SendWithRetryAsync(() => new HttpRequestMessage(HttpMethod.Get, path), ct);
        return await DeserializeResponseAsync<T>(response, ct);
    }

    internal async Task<T> GetEnvelopeAsync<T>(string path, CancellationToken ct = default)
    {
        var response = await SendWithRetryAsync(() => new HttpRequestMessage(HttpMethod.Get, path), ct);
        var envelope = await DeserializeResponseAsync<AttestiaResponse<T>>(response, ct);
        return envelope.Data;
    }

    internal async Task<T> PostEnvelopeAsync<T>(string path, object? body = null, CancellationToken ct = default)
    {
        var response = await SendWithRetryAsync(
            () =>
            {
                var msg = new HttpRequestMessage(HttpMethod.Post, path);
                if (body is not null)
                {
                    msg.Content = JsonContent.Create(body, options: JsonOptions);
                }
                return msg;
            },
            ct);

        var envelope = await DeserializeResponseAsync<AttestiaResponse<T>>(response, ct);
        return envelope.Data;
    }

    internal async Task<T> PostAsync<T>(string path, object? body = null, CancellationToken ct = default)
    {
        var response = await SendWithRetryAsync(
            () =>
            {
                var msg = new HttpRequestMessage(HttpMethod.Post, path);
                if (body is not null)
                {
                    msg.Content = JsonContent.Create(body, options: JsonOptions);
                }
                return msg;
            },
            ct);

        return await DeserializeResponseAsync<T>(response, ct);
    }

    internal async Task<string> GetStringAsync(string path, CancellationToken ct = default)
    {
        var response = await SendWithRetryAsync(() => new HttpRequestMessage(HttpMethod.Get, path), ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(ct);
    }

    private async Task<HttpResponseMessage> SendWithRetryAsync(
        Func<HttpRequestMessage> requestFactory,
        CancellationToken ct)
    {
        HttpResponseMessage? lastResponse = null;

        for (var attempt = 0; attempt <= _config.MaxRetries; attempt++)
        {
            if (attempt > 0)
            {
                var delay = TimeSpan.FromMilliseconds(200 * Math.Pow(2, attempt - 1));
                _logger.LogDebug("Retrying request (attempt {Attempt}/{Max}) after {Delay}ms",
                    attempt + 1, _config.MaxRetries + 1, delay.TotalMilliseconds);
                await Task.Delay(delay, ct);
            }

            using var request = requestFactory();
            lastResponse = await _http.SendAsync(request, ct);

            if ((int)lastResponse.StatusCode < 500)
            {
                break;
            }

            _logger.LogWarning("Server error {Status} on {Path}, will retry",
                (int)lastResponse.StatusCode, request.RequestUri);
        }

        return lastResponse!;
    }

    private async Task<T> DeserializeResponseAsync<T>(HttpResponseMessage response, CancellationToken ct)
    {
        if (!response.IsSuccessStatusCode)
        {
            await ThrowApiExceptionAsync(response, ct);
        }

        var result = await response.Content.ReadFromJsonAsync<T>(JsonOptions, ct);
        return result ?? throw new AttestiaException("NULL_RESPONSE", "Server returned null", (int)response.StatusCode);
    }

    private static async Task ThrowApiExceptionAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            var errorDoc = JsonDocument.Parse(errorBody);

            if (errorDoc.RootElement.TryGetProperty("error", out var errorProp))
            {
                var code = errorProp.GetProperty("code").GetString() ?? "UNKNOWN";
                var message = errorProp.GetProperty("message").GetString() ?? "Unknown error";
                throw new AttestiaException(code, message, (int)response.StatusCode);
            }

            throw new AttestiaException("HTTP_ERROR", errorBody, (int)response.StatusCode);
        }
        catch (AttestiaException)
        {
            throw;
        }
        catch
        {
            throw new AttestiaException("HTTP_ERROR",
                $"HTTP {(int)response.StatusCode} {response.ReasonPhrase}",
                (int)response.StatusCode);
        }
    }
}
