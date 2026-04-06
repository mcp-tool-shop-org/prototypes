using Soundboard.Client.Models;

namespace Soundboard.Maui.Audio;

public interface IAudioPlayer : IDisposable
{
    void Start(int sampleRate);
    void Feed(AudioChunk chunk);
    void Stop();
    void Flush();

    bool IsPlaying { get; }
    int BufferedChunks { get; }
}
