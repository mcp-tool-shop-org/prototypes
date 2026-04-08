using System.Globalization;
using System.Text;
using System.Text.Json;

namespace CodeTeam.Core;

/// <summary>
/// Canonical JSON serialization per CodeTeam Canonicalization Spec v0.1.
///
/// Rules:
/// 1. UTF-8 encoding, no BOM, no trailing whitespace, no trailing newline
/// 2. Minimal JSON (no pretty printing, no extra spaces)
/// 3. Object keys sorted lexicographically by Unicode code point (ordinal)
/// 4. Arrays preserve order (no sorting)
/// 5. Strings use JSON escaping, no Unicode normalization
/// 6. Numbers: integers only, no floats, no exponents, no leading zeros
/// 7. No duplicate keys (throws on detection)
///
/// This produces byte-identical output for semantically equivalent JSON,
/// enabling deterministic digest computation across platforms.
/// </summary>
public static class CanonicalJson
{
    /// <summary>
    /// Serialize an object to canonical JSON bytes.
    /// </summary>
    public static byte[] SerializeToBytes(object value)
    {
        var json = Serialize(value);
        return Encoding.UTF8.GetBytes(json);
    }

    /// <summary>
    /// Serialize an object to canonical JSON string.
    /// </summary>
    public static string Serialize(object value)
    {
        // First serialize to JsonDocument to get the structure
        var json = JsonSerializer.Serialize(value, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = false
        });

        using var doc = JsonDocument.Parse(json);
        var sb = new StringBuilder();
        WriteCanonical(doc.RootElement, sb);
        return sb.ToString();
    }

    /// <summary>
    /// Canonicalize an existing JSON string.
    /// </summary>
    public static string Canonicalize(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var sb = new StringBuilder();
        WriteCanonical(doc.RootElement, sb);
        return sb.ToString();
    }

    /// <summary>
    /// Canonicalize a JsonDocument.
    /// </summary>
    public static string Canonicalize(JsonDocument doc)
    {
        var sb = new StringBuilder();
        WriteCanonical(doc.RootElement, sb);
        return sb.ToString();
    }

    /// <summary>
    /// Canonicalize a JsonElement.
    /// </summary>
    public static string Canonicalize(JsonElement element)
    {
        var sb = new StringBuilder();
        WriteCanonical(element, sb);
        return sb.ToString();
    }

    private static void WriteCanonical(JsonElement element, StringBuilder sb)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                WriteObject(element, sb);
                break;

            case JsonValueKind.Array:
                WriteArray(element, sb);
                break;

            case JsonValueKind.String:
                WriteString(element.GetString()!, sb);
                break;

            case JsonValueKind.Number:
                WriteNumber(element, sb);
                break;

            case JsonValueKind.True:
                sb.Append("true");
                break;

            case JsonValueKind.False:
                sb.Append("false");
                break;

            case JsonValueKind.Null:
                sb.Append("null");
                break;

            default:
                throw new InvalidOperationException($"Unsupported JSON value kind: {element.ValueKind}");
        }
    }

    private static void WriteObject(JsonElement element, StringBuilder sb)
    {
        // Get all properties and sort by key (ordinal/Unicode code point)
        var properties = element.EnumerateObject()
            .OrderBy(p => p.Name, StringComparer.Ordinal)
            .ToList();

        // Check for duplicate keys
        var keys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var prop in properties)
        {
            if (!keys.Add(prop.Name))
            {
                throw new InvalidOperationException($"Duplicate key detected: {prop.Name}");
            }
        }

        sb.Append('{');
        var first = true;
        foreach (var prop in properties)
        {
            if (!first) sb.Append(',');
            first = false;

            WriteString(prop.Name, sb);
            sb.Append(':');
            WriteCanonical(prop.Value, sb);
        }
        sb.Append('}');
    }

    private static void WriteArray(JsonElement element, StringBuilder sb)
    {
        sb.Append('[');
        var first = true;
        foreach (var item in element.EnumerateArray())
        {
            if (!first) sb.Append(',');
            first = false;
            WriteCanonical(item, sb);
        }
        sb.Append(']');
    }

    private static void WriteString(string value, StringBuilder sb)
    {
        sb.Append('"');
        foreach (var c in value)
        {
            switch (c)
            {
                case '"':
                    sb.Append("\\\"");
                    break;
                case '\\':
                    sb.Append("\\\\");
                    break;
                case '\b':
                    sb.Append("\\b");
                    break;
                case '\f':
                    sb.Append("\\f");
                    break;
                case '\n':
                    sb.Append("\\n");
                    break;
                case '\r':
                    sb.Append("\\r");
                    break;
                case '\t':
                    sb.Append("\\t");
                    break;
                default:
                    if (c < 0x20)
                    {
                        // Control characters must be escaped
                        sb.Append($"\\u{(int)c:x4}");
                    }
                    else
                    {
                        // All other characters pass through (no Unicode normalization)
                        sb.Append(c);
                    }
                    break;
            }
        }
        sb.Append('"');
    }

    private static void WriteNumber(JsonElement element, StringBuilder sb)
    {
        // Get raw text to check format
        var rawText = element.GetRawText();

        // Reject floats and exponents
        if (rawText.Contains('.') || rawText.Contains('e') || rawText.Contains('E'))
        {
            throw new InvalidOperationException(
                $"Canonical JSON only allows integers, not floats or exponents: {rawText}");
        }

        // Reject leading zeros (except for "0" itself)
        if (rawText.Length > 1 && rawText[0] == '0')
        {
            throw new InvalidOperationException(
                $"Canonical JSON does not allow leading zeros: {rawText}");
        }
        if (rawText.Length > 2 && rawText[0] == '-' && rawText[1] == '0')
        {
            throw new InvalidOperationException(
                $"Canonical JSON does not allow leading zeros: {rawText}");
        }

        // Parse as long to validate range
        if (!element.TryGetInt64(out var value))
        {
            throw new InvalidOperationException(
                $"Number out of safe integer range: {rawText}");
        }

        // Check safe integer range: [-(2^53-1), +(2^53-1)]
        const long maxSafeInteger = 9007199254740991; // 2^53 - 1
        if (value < -maxSafeInteger || value > maxSafeInteger)
        {
            throw new InvalidOperationException(
                $"Number out of safe integer range [-(2^53-1), +(2^53-1)]: {value}");
        }

        // Write in normalized form (no leading zeros, optional leading -)
        sb.Append(value.ToString(CultureInfo.InvariantCulture));
    }
}
