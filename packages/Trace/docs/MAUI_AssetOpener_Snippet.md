# MAUI AssetOpener Snippet

Platform bridge for MAUI's `FileSystem.OpenAppPackageFileAsync` to the library's `IAssetOpener` interface. Lives in `MauiHost` — the only project with platform SDK access.

```csharp
using MouseTrainer.Audio.Assets;

public sealed class MauiAssetOpener : IAssetOpener
{
    public Task<Stream> OpenAsync(string assetName, CancellationToken ct = default)
        => FileSystem.OpenAppPackageFileAsync(assetName);
}
```

### Usage at startup

```csharp
var missing = await AssetVerifier.VerifyRequiredAudioAsync(new MauiAssetOpener());
if (missing.Count > 0) { /* fail fast / disable audio with banner */ }
```

### Why this exists

`IAssetOpener` is defined in `MouseTrainer.Audio` (no MAUI reference). The MAUI host provides the concrete implementation, keeping the audio library platform-agnostic. See [`modular.manifesto.md`](modular.manifesto.md) for the dependency rules.
