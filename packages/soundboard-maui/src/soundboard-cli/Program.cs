using Soundboard.Client;
using Soundboard.Client.Models;

if (args.Length == 0 || args[0] is "-h" or "--help")
{
    PrintUsage();
    return 0;
}

var command = args[0].ToLowerInvariant();

try
{
    await using var client = new SoundboardClient();

    return command switch
    {
        "health" => await RunHealthAsync(client),
        "presets" => await RunPresetsAsync(client),
        "voices" => await RunVoicesAsync(client),
        "speak" => await RunSpeakAsync(client, args.Skip(1).ToArray()),
        _ => PrintUnknown(command)
    };
}
catch (HttpRequestException)
{
    Console.Error.WriteLine("Error: engine not reachable. Is it running on {0}?",
        Environment.GetEnvironmentVariable("SOUNDBOARD_BASE_URL") ?? "http://localhost:8765");
    return 1;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Error: {ex.Message}");
    return 1;
}

static async Task<int> RunHealthAsync(ISoundboardClient client)
{
    var health = await client.GetHealthAsync();
    Console.WriteLine($"Status:  {health.Status}");
    Console.WriteLine($"Engine:  v{health.EngineVersion}");
    Console.WriteLine($"API:     {health.ApiVersion}");
    return 0;
}

static async Task<int> RunPresetsAsync(ISoundboardClient client)
{
    var presets = await client.GetPresetsAsync();
    foreach (var p in presets)
        Console.WriteLine(p);
    return 0;
}

static async Task<int> RunVoicesAsync(ISoundboardClient client)
{
    var voices = await client.GetVoicesAsync();
    foreach (var v in voices)
        Console.WriteLine(v);
    return 0;
}

static async Task<int> RunSpeakAsync(ISoundboardClient client, string[] args)
{
    string? text = null;
    string? preset = null;
    string? voice = null;
    string? output = null;

    for (var i = 0; i < args.Length; i++)
    {
        if (args[i] == "--preset" && i + 1 < args.Length)
            preset = args[++i];
        else if (args[i] == "--voice" && i + 1 < args.Length)
            voice = args[++i];
        else if (args[i] == "--output" && i + 1 < args.Length)
            output = args[++i];
        else if (!args[i].StartsWith("--"))
            text = args[i];
    }

    if (string.IsNullOrWhiteSpace(text))
    {
        Console.Error.WriteLine("Error: speak requires text. Usage: soundboard-cli speak \"text\"");
        return 1;
    }

    // Discover defaults if not specified
    if (preset is null)
    {
        var presets = await client.GetPresetsAsync();
        preset = presets.Count > 0 ? presets[0] : "narrator";
    }

    if (voice is null)
    {
        var voices = await client.GetVoicesAsync();
        voice = voices.Count > 0 ? voices[0] : "default";
    }

    var chunks = new List<byte[]>();
    var sampleRate = 24000;

    using var cts = new CancellationTokenSource();
    Console.CancelKeyPress += (_, e) =>
    {
        e.Cancel = true;
        cts.Cancel();
    };

    Console.Error.Write("Streaming");

    var progress = new Progress<AudioChunk>(chunk =>
    {
        chunks.Add(chunk.PcmData);
        sampleRate = chunk.SampleRate;
        Console.Error.Write(".");
    });

    try
    {
        await client.SpeakAsync(new SpeakRequest(text, preset, voice), progress, cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.Error.WriteLine(" cancelled.");
        return 1;
    }

    Console.Error.WriteLine(" done.");

    // Write WAV
    var outputPath = output ?? "output.wav";
    WriteWav(outputPath, chunks, sampleRate);
    Console.WriteLine(outputPath);
    return 0;
}

static void WriteWav(string path, List<byte[]> chunks, int sampleRate)
{
    var totalBytes = chunks.Sum(c => c.Length);

    using var fs = File.Create(path);
    using var bw = new BinaryWriter(fs);

    // WAV header (PCM16, mono)
    bw.Write("RIFF"u8);
    bw.Write(36 + totalBytes);         // ChunkSize
    bw.Write("WAVE"u8);
    bw.Write("fmt "u8);
    bw.Write(16);                       // Subchunk1Size (PCM)
    bw.Write((short)1);                 // AudioFormat (PCM)
    bw.Write((short)1);                 // NumChannels (mono)
    bw.Write(sampleRate);               // SampleRate
    bw.Write(sampleRate * 2);           // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    bw.Write((short)2);                 // BlockAlign (NumChannels * BitsPerSample/8)
    bw.Write((short)16);               // BitsPerSample
    bw.Write("data"u8);
    bw.Write(totalBytes);               // Subchunk2Size

    foreach (var chunk in chunks)
        bw.Write(chunk);
}

static int PrintUnknown(string command)
{
    Console.Error.WriteLine($"Unknown command: {command}");
    PrintUsage();
    return 1;
}

static void PrintUsage()
{
    Console.Error.WriteLine("""
        soundboard-cli — Soundboard SDK reference client

        Usage:
          soundboard-cli health                          Check engine connection
          soundboard-cli presets                         List available presets
          soundboard-cli voices                          List available voices
          soundboard-cli speak "text" [options]          Stream speech to WAV file

        Speak options:
          --preset <name>     Preset to use (default: first available)
          --voice <name>      Voice to use (default: first available)
          --output <path>     Output WAV path (default: output.wav)

        Environment:
          SOUNDBOARD_BASE_URL   Engine URL (default: http://localhost:8765)
        """);
}
