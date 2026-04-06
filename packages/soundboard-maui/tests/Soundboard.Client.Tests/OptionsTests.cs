namespace Soundboard.Client.Tests;

public class OptionsTests
{
    [Fact]
    public void DefaultOptions_UsesLocalhost()
    {
        var opts = new SoundboardClientOptions();

        Assert.Equal("http://localhost:8765", opts.BaseUrl);
    }

    [Fact]
    public void DefaultOptions_HttpTimeout_Is10Seconds()
    {
        var opts = new SoundboardClientOptions();

        Assert.Equal(TimeSpan.FromSeconds(10), opts.HttpTimeout);
    }

    [Fact]
    public void DefaultOptions_WsConnectTimeout_Is5Seconds()
    {
        var opts = new SoundboardClientOptions();

        Assert.Equal(TimeSpan.FromSeconds(5), opts.WebSocketConnectTimeout);
    }

    [Fact]
    public void DefaultOptions_WsReceiveTimeout_Is30Seconds()
    {
        var opts = new SoundboardClientOptions();

        Assert.Equal(TimeSpan.FromSeconds(30), opts.WebSocketReceiveTimeout);
    }

    [Fact]
    public void WsUri_DerivedFromBaseUrl()
    {
        var opts = new SoundboardClientOptions { BaseUrl = "http://192.168.1.50:9000" };

        Assert.Equal(new Uri("ws://192.168.1.50:9000/stream"), opts.WsUri);
    }

    [Fact]
    public void WsUri_HttpsBecomesWss()
    {
        var opts = new SoundboardClientOptions { BaseUrl = "https://engine.example.com:443" };

        Assert.Equal("wss", opts.WsUri.Scheme);
        Assert.Equal("/stream", opts.WsUri.AbsolutePath);
    }

    [Fact]
    public void CustomOptions_Override()
    {
        var opts = new SoundboardClientOptions
        {
            BaseUrl = "http://10.0.0.5:4000",
            HttpTimeout = TimeSpan.FromSeconds(30),
            WebSocketConnectTimeout = TimeSpan.FromSeconds(15)
        };

        Assert.Equal("http://10.0.0.5:4000", opts.BaseUrl);
        Assert.Equal(TimeSpan.FromSeconds(30), opts.HttpTimeout);
        Assert.Equal(TimeSpan.FromSeconds(15), opts.WebSocketConnectTimeout);
    }

    [Fact]
    public void PublicConstructor_DefaultOptions()
    {
        // Verifies parameterless construction works (uses defaults)
        var client = new SoundboardClient();
        Assert.NotNull(client);
    }

    [Fact]
    public void PublicConstructor_CustomOptions()
    {
        var opts = new SoundboardClientOptions { BaseUrl = "http://10.0.0.1:5000" };
        var client = new SoundboardClient(opts);
        Assert.NotNull(client);
    }

    [Fact]
    public void PublicConstructor_AcceptsInjectedHttpClient()
    {
        var http = new HttpClient();
        var client = new SoundboardClient(httpClient: http);
        Assert.NotNull(client);
    }
}
