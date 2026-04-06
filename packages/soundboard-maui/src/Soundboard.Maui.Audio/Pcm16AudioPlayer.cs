using NAudio.Wave;
using Soundboard.Client.Models;

namespace Soundboard.Maui.Audio;

public sealed class Pcm16AudioPlayer : IAudioPlayer
{
    private WaveOutEvent? _waveOut;
    private BufferedWaveProvider? _buffer;
    private int _bufferedChunks;

    public bool IsPlaying => _waveOut?.PlaybackState == PlaybackState.Playing;
    public int BufferedChunks => _bufferedChunks;

    public void Start(int sampleRate)
    {
        Stop();

        var format = new WaveFormat(sampleRate, 16, 1); // PCM16, mono
        _buffer = new BufferedWaveProvider(format)
        {
            BufferDuration = TimeSpan.FromSeconds(10),
            DiscardOnBufferOverflow = true
        };

        _waveOut = new WaveOutEvent
        {
            DesiredLatency = 100
        };
        _waveOut.Init(_buffer);
        _waveOut.Play();
        _bufferedChunks = 0;
    }

    public void Feed(AudioChunk chunk)
    {
        if (_buffer == null)
            throw new InvalidOperationException("Player not started. Call Start() first.");

        _buffer.AddSamples(chunk.PcmData, 0, chunk.PcmData.Length);
        Interlocked.Increment(ref _bufferedChunks);
    }

    public void Stop()
    {
        _waveOut?.Stop();
        _waveOut?.Dispose();
        _waveOut = null;
        _buffer?.ClearBuffer();
        _buffer = null;
        _bufferedChunks = 0;
    }

    public void Flush()
    {
        _buffer?.ClearBuffer();
        _bufferedChunks = 0;
    }

    public void Dispose()
    {
        Stop();
    }
}
