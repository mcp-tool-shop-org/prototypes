using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Services;

static void Help()
{
    Console.WriteLine("DevOpTyper.Content.Cli");
    Console.WriteLine("Commands:");
    Console.WriteLine("  paste --out <index.json> --lang <language> --title <title> --text <code>");
    Console.WriteLine("  build --out <index.json> --source <folder>");
    Console.WriteLine("Flags:");
    Console.WriteLine("  --version, -V   Show version and exit");
    Console.WriteLine("  --help, -h      Show this help");
}

if (args.Contains("--version") || args.Contains("-V"))
{
    var asm = typeof(DevOpTyper.Content.Services.LibraryIndexBuilder).Assembly;
    var ver = asm.GetName().Version?.ToString(3) ?? "unknown";
    Console.WriteLine($"DevOpTyper.Content {ver}");
    return 0;
}

if (args.Length == 0 || args.Contains("--help") || args.Contains("-h"))
{
    Help();
    return 0;
}

string Arg(string name, string? def = null)
{
    var i = Array.IndexOf(args, name);
    if (i >= 0 && i + 1 < args.Length) return args[i + 1];
    return def ?? string.Empty;
}

var cmd = args[0].ToLowerInvariant();
var outPath = Arg("--out", "library.index.json");
var store = new JsonLibraryIndexStore();

if (cmd == "paste")
{
    var lang = Arg("--lang", "text");
    var title = Arg("--title", "Pasted Code");
    var text = Arg("--text", string.Empty);

    var source = new SingleTextSource(title, text, lang);
    var builder = new LibraryIndexBuilder(new DefaultExtractor(), new MetricCalculator());
    var index = await builder.BuildAsync(source);
    store.Save(outPath, index);
    Console.WriteLine($"Wrote {index.Items.Count} items -> {outPath}");
    return 0;
}

if (cmd == "build")
{
    var folder = Arg("--source", string.Empty);
    if (string.IsNullOrWhiteSpace(folder) || !Directory.Exists(folder))
    {
        Console.WriteLine("Missing or invalid --source <folder>");
        return 2;
    }

    var source = new FolderSource(folder);
    var builder = new LibraryIndexBuilder(new DefaultExtractor(), new MetricCalculator());
    var index = await builder.BuildAsync(source);
    store.Save(outPath, index);
    Console.WriteLine($"Indexed {index.Items.Count} items from {folder} -> {outPath}");
    return 0;
}

Console.WriteLine("Unknown command.");
Help();
return 2;

// --- CLI sources ---
sealed class SingleTextSource : IContentSource
{
    private readonly string _title;
    private readonly string _text;
    private readonly string _lang;

    public SingleTextSource(string title, string text, string lang)
    {
        _title = title;
        _text = text;
        _lang = lang;
    }

    public async IAsyncEnumerable<RawContent> EnumerateAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
    {
        await Task.Yield();
        yield return new RawContent(
            Path: null,
            LanguageHint: _lang,
            Title: _title,
            Text: _text,
            Source: "user",
            Origin: null
        );
    }
}

sealed class FolderSource : IContentSource
{
    private readonly string _root;

    public FolderSource(string root) => _root = root;

    public async IAsyncEnumerable<RawContent> EnumerateAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
    {
        foreach (var f in Directory.EnumerateFiles(_root, "*.*", SearchOption.AllDirectories))
        {
            ct.ThrowIfCancellationRequested();

            var fi = new FileInfo(f);
            if (fi.Length > 2_000_000) continue; // v1 guardrail

            string text;
            try
            {
                text = await File.ReadAllTextAsync(f, ct);
            }
            catch
            {
                continue;
            }

            yield return new RawContent(
                Path: f,
                LanguageHint: null,
                Title: Path.GetFileName(f),
                Text: text,
                Source: "corpus",
                Origin: _root
            );
        }
    }
}
