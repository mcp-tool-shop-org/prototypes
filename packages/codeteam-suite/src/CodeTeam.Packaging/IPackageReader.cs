namespace CodeTeam.Packaging;

/// <summary>
/// Abstraction for reading package contents.
/// Enables directory and ZIP/archive support.
/// </summary>
public interface IPackageReader : IDisposable
{
    /// <summary>
    /// Root path of the package
    /// </summary>
    string PackagePath { get; }

    /// <summary>
    /// Check if a file exists in the package
    /// </summary>
    bool FileExists(string relativePath);

    /// <summary>
    /// Get file size in bytes
    /// </summary>
    /// <returns>Size or -1 if file doesn't exist</returns>
    long GetFileSize(string relativePath);

    /// <summary>
    /// Open a stream to read file contents
    /// </summary>
    Stream OpenRead(string relativePath);

    /// <summary>
    /// Read all bytes from a file
    /// </summary>
    byte[] ReadAllBytes(string relativePath);

    /// <summary>
    /// Read file as text (UTF-8)
    /// </summary>
    string ReadAllText(string relativePath);

    /// <summary>
    /// List all files in the package (normalized paths)
    /// </summary>
    IEnumerable<string> ListFiles();
}
