namespace DevOpTyper.Content.Models;

public sealed class LibraryIndex
{
    public int Version { get; set; } = 1;
    public DateTimeOffset GeneratedUtc { get; set; } = DateTimeOffset.UtcNow;
    public List<CodeItem> Items { get; set; } = new();
    public LibraryStats? Stats { get; set; }
}

public sealed class LibraryStats
{
    public int TotalItems { get; set; }
    public List<string> Languages { get; set; } = new();
}
