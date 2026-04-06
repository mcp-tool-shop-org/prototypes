using System.Text.Json;
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Services;

public sealed class JsonLibraryIndexStore : ILibraryIndexStore
{
    private static readonly JsonSerializerOptions Opts = new() { WriteIndented = true };

    public LibraryIndex Load(string path)
    {
        try
        {
            if (!File.Exists(path)) return new LibraryIndex();
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<LibraryIndex>(json) ?? new LibraryIndex();
        }
        catch
        {
            return new LibraryIndex();
        }
    }

    public void Save(string path, LibraryIndex index)
    {
        index.GeneratedUtc = DateTimeOffset.UtcNow;
        index.Stats ??= new LibraryStats();
        index.Stats.TotalItems = index.Items.Count;
        index.Stats.Languages = index.Items.Select(i => i.Language).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList();

        Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
        File.WriteAllText(path, JsonSerializer.Serialize(index, Opts));
    }
}
