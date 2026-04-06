using System.Net;

namespace Soundboard.Client.Tests;

public class StopTests
{
    [Fact]
    public async Task StopAsync_SendsPostRequest()
    {
        HttpRequestMessage? captured = null;
        var handler = new MockHttpHandler(req =>
        {
            captured = req;
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        var client = TestHelper.CreateClient(handler);

        await client.StopAsync();

        Assert.NotNull(captured);
        Assert.Equal(HttpMethod.Post, captured.Method);
        Assert.Equal("/api/stop", captured.RequestUri?.AbsolutePath);
    }

    [Fact]
    public async Task StopAsync_RespectsCanellation()
    {
        var handler = new MockHttpHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = TestHelper.CreateClient(handler);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => client.StopAsync(cts.Token));
    }
}
