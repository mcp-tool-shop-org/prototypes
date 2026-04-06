namespace Soundboard.Client.Tests;

public class DisposeTests
{
    [Fact]
    public async Task DisposeAsync_DoesNotThrow()
    {
        var opts = new SoundboardClientOptions { BaseUrl = "http://localhost:9999" };
        var client = new SoundboardClient(opts);

        // Should not throw even if never used
        await client.DisposeAsync();
    }

    [Fact]
    public async Task DisposeAsync_DoubleDispose_DoesNotThrow()
    {
        var opts = new SoundboardClientOptions { BaseUrl = "http://localhost:9999" };
        var client = new SoundboardClient(opts);

        await client.DisposeAsync();
        await client.DisposeAsync();
    }
}
