// Soundboard SDK — Agent Tool Example
//
// Demonstrates using the SDK as a callable tool in an AI agent pipeline.
// The agent decides what to say; this tool handles voice output.
//
// Pattern:
//   Agent loop → decides to speak → calls SpeakTool.ExecuteAsync → audio out
//
// This is the integration style for:
//   - LLM tool calling (function_call → speak)
//   - Conversational agents with voice output
//   - Agentic workflows that narrate their progress
//
// Run:
//   dotnet run --project examples/AgentTool

using Soundboard.Client;
using Soundboard.Client.Models;

// --- Agent tool definition ---

/// <summary>
/// A tool that an AI agent can call to speak text aloud.
/// Wraps the Soundboard SDK in a tool-shaped interface.
/// </summary>
var speakTool = new SpeakTool();
await speakTool.InitializeAsync();

// --- Simulate an agent loop ---

Console.WriteLine("Agent: starting task analysis...");
Console.WriteLine();

// Agent decides to narrate its work
await speakTool.ExecuteAsync(new SpeakToolInput(
    Text: "Starting analysis. I'll walk you through what I find.",
    Mood: "narrator"));

Console.WriteLine();
Console.WriteLine("Agent: [processing documents...]");
await Task.Delay(500);

// Agent reports a finding
await speakTool.ExecuteAsync(new SpeakToolInput(
    Text: "Found three anomalies in the dataset. The first one is significant.",
    Mood: "narrator"));

Console.WriteLine();
Console.WriteLine("Agent: [generating summary...]");
await Task.Delay(500);

// Agent delivers conclusion
await speakTool.ExecuteAsync(new SpeakToolInput(
    Text: "Analysis complete. Two items need your attention. I've saved the full report.",
    Mood: "narrator"));

Console.WriteLine();
Console.WriteLine("Agent: task complete.");

await speakTool.DisposeAsync();

// --- Tool implementation ---

/// <summary>Input schema for the speak tool.</summary>
record SpeakToolInput(string Text, string? Mood = null);

/// <summary>Result returned to the agent after speaking.</summary>
record SpeakToolResult(bool Success, int ChunkCount, string? Error = null);

/// <summary>
/// Soundboard speak tool. Stateful — holds a client connection and caches
/// available presets/voices so repeated calls are fast.
/// </summary>
class SpeakTool : IAsyncDisposable
{
    private SoundboardClient? _client;
    private IReadOnlyList<string> _presets = [];
    private IReadOnlyList<string> _voices = [];

    public async Task InitializeAsync(CancellationToken ct = default)
    {
        _client = new SoundboardClient();
        var health = await _client.GetHealthAsync(ct);
        Console.WriteLine($"[SpeakTool] connected: engine v{health.EngineVersion}");

        _presets = await _client.GetPresetsAsync(ct);
        _voices = await _client.GetVoicesAsync(ct);
        Console.WriteLine($"[SpeakTool] ready: {_presets.Count} presets, {_voices.Count} voices");
    }

    public async Task<SpeakToolResult> ExecuteAsync(
        SpeakToolInput input,
        CancellationToken ct = default)
    {
        if (_client is null) return new SpeakToolResult(false, 0, "Not initialized");

        var preset = ResolvePreset(input.Mood);
        var voice = _voices.Count > 0 ? _voices[0] : "default";
        var chunkCount = 0;

        Console.Write($"[SpeakTool] speaking ({preset})");

        var progress = new Progress<AudioChunk>(_ =>
        {
            Interlocked.Increment(ref chunkCount);
            Console.Write(".");
        });

        try
        {
            await _client.SpeakAsync(
                new SpeakRequest(input.Text, preset, voice),
                progress, ct);

            Console.WriteLine($" done ({chunkCount} chunks)");
            return new SpeakToolResult(true, chunkCount);
        }
        catch (Exception ex)
        {
            Console.WriteLine($" error: {ex.Message}");
            return new SpeakToolResult(false, chunkCount, ex.Message);
        }
    }

    private string ResolvePreset(string? mood)
    {
        // Map agent mood hints to engine presets
        // Falls back to first available or "narrator"
        if (mood is not null && _presets.Contains(mood))
            return mood;

        return _presets.Count > 0 ? _presets[0] : "narrator";
    }

    public ValueTask DisposeAsync()
    {
        return _client?.DisposeAsync() ?? ValueTask.CompletedTask;
    }
}
