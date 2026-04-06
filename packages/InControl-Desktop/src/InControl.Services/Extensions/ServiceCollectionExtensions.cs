using Microsoft.Extensions.DependencyInjection;
using InControl.Services.Chat;
using InControl.Services.Interfaces;
using InControl.Services.Storage;
using InControl.Services.Voice;

namespace InControl.Services.Extensions;

/// <summary>
/// Extension methods for registering application services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds application services to the DI container.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<IFileStore, FileStore>();
        services.AddSingleton<IConversationStorage, JsonConversationStorage>();
        services.AddSingleton<IChatService, ChatService>();
        return services;
    }

    /// <summary>
    /// Adds voice synthesis services to the DI container.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddVoiceServices(this IServiceCollection services)
    {
        services.AddSingleton<KokoroVoiceService>();
        services.AddSingleton<WindowsVoiceService>();
        services.AddSingleton<IVoiceService, FallbackVoiceService>();
        return services;
    }
}
