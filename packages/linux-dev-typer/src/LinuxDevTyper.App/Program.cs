using System.Reflection;
using Avalonia;

namespace LinuxDevTyper.App;

internal static class Program
{
    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .LogToTrace();

    [STAThread]
    public static void Main(string[] args)
    {
        if (args.Length > 0 && (args[0] == "--version" || args[0] == "-V"))
        {
            var version = typeof(Program).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                ?? typeof(Program).Assembly.GetName().Version?.ToString()
                ?? "unknown";
            Console.WriteLine($"linux-dev-typer {version}");
            return;
        }

        BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
    }
}
