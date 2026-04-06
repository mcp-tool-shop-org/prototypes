using System.Globalization;

namespace Soundboard.Maui.Converters;

public sealed class BoolToOpacityConverter : IValueConverter
{
    public double TrueOpacity { get; set; } = 0.3;
    public double FalseOpacity { get; set; } = 1.0;

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is true ? TrueOpacity : FalseOpacity;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
