using System.Globalization;

namespace Soundboard.Maui.Converters;

/// <summary>
/// Shows "Loading {parameter}…" when true, "{parameter}" when false.
/// </summary>
public sealed class LoadingTitleConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var label = parameter as string ?? "items";
        return value is true ? $"Loading {label.ToLowerInvariant()}\u2026" : label;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
