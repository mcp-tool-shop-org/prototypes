namespace Soundboard.Client.Tests;

internal static class TestHelper
{
    private static readonly SoundboardClientOptions DefaultOptions = new();

    public static SoundboardClient CreateClient(HttpMessageHandler handler)
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:8765") };
        return new SoundboardClient(http, DefaultOptions);
    }
}
