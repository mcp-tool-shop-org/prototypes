namespace CodeTeam.Packaging;

/// <summary>
/// Package reader for directory-based packages (fixtures, local development)
/// </summary>
public sealed class DirectoryPackageReader : IPackageReader
{
    private readonly string _rootPath;
    private bool _disposed;

    public DirectoryPackageReader(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
            throw new DirectoryNotFoundException($"Package directory not found: {directoryPath}");

        _rootPath = Path.GetFullPath(directoryPath);
    }

    public string PackagePath => _rootPath;

    public bool FileExists(string relativePath)
    {
        ThrowIfDisposed();
        var fullPath = ResolvePath(relativePath);
        return File.Exists(fullPath);
    }

    public long GetFileSize(string relativePath)
    {
        ThrowIfDisposed();
        var fullPath = ResolvePath(relativePath);
        if (!File.Exists(fullPath))
            return -1;

        return new FileInfo(fullPath).Length;
    }

    public Stream OpenRead(string relativePath)
    {
        ThrowIfDisposed();
        var fullPath = ResolvePath(relativePath);
        return File.OpenRead(fullPath);
    }

    public byte[] ReadAllBytes(string relativePath)
    {
        ThrowIfDisposed();
        var fullPath = ResolvePath(relativePath);
        return File.ReadAllBytes(fullPath);
    }

    public string ReadAllText(string relativePath)
    {
        ThrowIfDisposed();
        var fullPath = ResolvePath(relativePath);
        return File.ReadAllText(fullPath);
    }

    public IEnumerable<string> ListFiles()
    {
        ThrowIfDisposed();
        return Directory.EnumerateFiles(_rootPath, "*", SearchOption.AllDirectories)
            .Select(f => Path.GetRelativePath(_rootPath, f))
            .Select(p => p.Replace('\\', '/'))  // Normalize to forward slashes
            .OrderBy(p => p, StringComparer.Ordinal);  // Deterministic ordering
    }

    private string ResolvePath(string relativePath)
    {
        // Normalize the path first (validates rules)
        var normalized = PathNormalizer.Normalize(relativePath);

        // Convert to OS-specific path
        var osPath = normalized.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, osPath));

        // Security check: ensure we haven't escaped the root
        if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidPathException("Path escape attempt detected", relativePath);

        return fullPath;
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
    }

    public void Dispose()
    {
        _disposed = true;
    }
}
