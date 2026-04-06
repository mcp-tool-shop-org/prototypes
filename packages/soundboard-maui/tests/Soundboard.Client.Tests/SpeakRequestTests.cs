using Soundboard.Client.Models;

namespace Soundboard.Client.Tests;

public class SpeakRequestTests
{
    [Fact]
    public void ResolvedRequestId_StablePerInstance()
    {
        var req = new SpeakRequest("Hello", "narrator", "af_bella");

        var id1 = req.ResolvedRequestId;
        var id2 = req.ResolvedRequestId;

        // Now stable per instance (lazy-initialized)
        Assert.Equal(id1, id2);
        Assert.True(Guid.TryParse(id1, out _));
    }

    [Fact]
    public void ResolvedRequestId_UsesExplicitWhenProvided()
    {
        var req = new SpeakRequest("Hello", "narrator", "af_bella", RequestId: "my-test-id");

        Assert.Equal("my-test-id", req.ResolvedRequestId);
        Assert.Equal("my-test-id", req.ResolvedRequestId); // stable
    }

    [Fact]
    public void DefaultRequestId_IsNull()
    {
        var req = new SpeakRequest("Hello", "narrator", "af_bella");

        Assert.Null(req.RequestId);
    }
}
