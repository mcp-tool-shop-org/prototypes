namespace Soundboard.Client.Tests;

public class PresetsTests
{
    [Fact]
    public async Task GetPresetsAsync_ParsesPresetList()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("""
            {
                "presets": ["narrator", "assistant", "whisper"]
            }
            """));
        var client = TestHelper.CreateClient(handler);

        var presets = await client.GetPresetsAsync();

        Assert.Equal(3, presets.Count);
        Assert.Equal("narrator", presets[0]);
        Assert.Equal("assistant", presets[1]);
        Assert.Equal("whisper", presets[2]);
    }

    [Fact]
    public async Task GetPresetsAsync_EmptyList()
    {
        var handler = new MockHttpHandler(_ => MockHttpHandler.Json("""
            {
                "presets": []
            }
            """));
        var client = TestHelper.CreateClient(handler);

        var presets = await client.GetPresetsAsync();

        Assert.Empty(presets);
    }
}
