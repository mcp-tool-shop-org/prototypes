using Microsoft.Extensions.Logging;
using Soundboard.Client;
using Soundboard.Maui.Audio;
using Soundboard.Maui.ViewModels;
using Soundboard.Maui.Views;

namespace Soundboard.Maui;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>();

        // Services
        builder.Services.AddSingleton(new SoundboardClientOptions());
        builder.Services.AddSingleton<ISoundboardClient>(sp =>
            new SoundboardClient(sp.GetRequiredService<SoundboardClientOptions>()));
        builder.Services.AddSingleton<IAudioPlayer, Pcm16AudioPlayer>();

        // ViewModels
        builder.Services.AddTransient<SoundboardViewModel>();

        // Pages
        builder.Services.AddTransient<MainPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
