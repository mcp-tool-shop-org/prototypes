namespace TrainingStudio.App.Services;

public class DatasetService
{
    public DatasetPreview ParseCsvPreview(string csvContent, int maxRows = 10)
    {
        var lines = csvContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length == 0)
        {
            return new DatasetPreview();
        }

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<string[]>();
        var columnTypes = new string[headers.Length];

        // Initialize column types
        for (int i = 0; i < headers.Length; i++)
        {
            columnTypes[i] = "unknown";
        }

        // Parse data rows and infer types
        for (int i = 1; i < Math.Min(lines.Length, maxRows + 1); i++)
        {
            var row = ParseCsvLine(lines[i]);
            if (row.Length == headers.Length)
            {
                rows.Add(row);

                // Infer column types from first few rows
                for (int j = 0; j < row.Length; j++)
                {
                    var inferredType = InferType(row[j]);
                    if (columnTypes[j] == "unknown")
                    {
                        columnTypes[j] = inferredType;
                    }
                    else if (columnTypes[j] != inferredType && inferredType != "unknown")
                    {
                        columnTypes[j] = "string"; // Mixed types default to string
                    }
                }
            }
        }

        return new DatasetPreview
        {
            Headers = headers,
            Rows = rows,
            ColumnTypes = columnTypes,
            TotalRows = lines.Length - 1
        };
    }

    private string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = "";
        var inQuotes = false;

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.Trim());
                current = "";
            }
            else
            {
                current += c;
            }
        }
        result.Add(current.Trim());

        return result.ToArray();
    }

    private string InferType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "unknown";

        if (double.TryParse(value, out _))
            return "number";

        if (bool.TryParse(value, out _))
            return "boolean";

        return "string";
    }
}

public class DatasetPreview
{
    public string[] Headers { get; set; } = Array.Empty<string>();
    public List<string[]> Rows { get; set; } = new();
    public string[] ColumnTypes { get; set; } = Array.Empty<string>();
    public int TotalRows { get; set; }
}
