using Soundboard.Client.Models;

namespace Soundboard.Client.Tests;

public class HealthTests
{
    [Fact]
    public async Task GetHealthAsync_DeserializesCorrectly()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("""
            {
                "status": "ok",
                "engine_version": "0.9.0",
                "api_version": "1"
            }
            """));
        var client = TestHelper.CreateClient(handler);

        var health = await client.GetHealthAsync();

        Assert.Equal("ok", health.Status);
        Assert.Equal("0.9.0", health.EngineVersion);
        Assert.Equal("1", health.ApiVersion);
    }

    [Fact]
    public async Task GetHealthAsync_ThrowsOnNull()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("null"));
        var client = TestHelper.CreateClient(handler);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => client.GetHealthAsync());
    }
}
