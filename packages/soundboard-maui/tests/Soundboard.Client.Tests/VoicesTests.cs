namespace Soundboard.Client.Tests;

public class VoicesTests
{
    [Fact]
    public async Task GetVoicesAsync_ParsesVoiceIds()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("""
            {
                "voices": [
                    { "id": "af_bella", "name": "Bella" },
                    { "id": "am_adam", "name": "Adam" }
                ]
            }
            """));
        var client = TestHelper.CreateClient(handler);

        var voices = await client.GetVoicesAsync();

        Assert.Equal(2, voices.Count);
        Assert.Equal("af_bella", voices[0]);
        Assert.Equal("am_adam", voices[1]);
    }

    [Fact]
    public async Task GetVoicesAsync_EmptyList()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("""
            {
                "voices": []
            }
            """));
        var client = TestHelper.CreateClient(handler);

        var voices = await client.GetVoicesAsync();

        Assert.Empty(voices);
    }
}
