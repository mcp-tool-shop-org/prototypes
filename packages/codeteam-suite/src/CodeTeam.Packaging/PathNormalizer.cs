namespace CodeTeam.Packaging;

/// <summary>
/// Path normalization per CONTRACT.md v0.1:
/// - Paths MUST be relative
/// - Paths MUST NOT contain ..
/// - Paths MUST use forward slashes
/// - Absolute paths are forbidden
/// </summary>
public static class PathNormalizer
{
    /// <summary>
    /// Normalize a path to forward slashes and validate rules
    /// </summary>
    /// <param name="path">Path to normalize</param>
    /// <returns>Normalized path</returns>
    /// <exception cref="InvalidPathException">If path violates rules</exception>
    public static string Normalize(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new InvalidPathException("Path cannot be empty", path);

        // Convert backslashes to forward slashes
        var normalized = path.Replace('\\', '/');

        // Check for absolute paths
        if (IsAbsolutePath(normalized))
            throw new InvalidPathException("Absolute paths are forbidden", path);

        // Check for parent directory traversal
        if (ContainsParentTraversal(normalized))
            throw new InvalidPathException("Path cannot contain '..'", path);

        // Check for leading/trailing slashes
        if (normalized.StartsWith('/') || normalized.EndsWith('/'))
            throw new InvalidPathException("Path cannot have leading or trailing slashes", path);

        // Check for double slashes
        if (normalized.Contains("//"))
            throw new InvalidPathException("Path cannot contain double slashes", path);

        return normalized;
    }

    /// <summary>
    /// Validate a path without throwing
    /// </summary>
    /// <returns>True if valid, false otherwise</returns>
    public static bool IsValid(string path, out string? error)
    {
        error = null;

        if (string.IsNullOrWhiteSpace(path))
        {
            error = "Path cannot be empty";
            return false;
        }

        var normalized = path.Replace('\\', '/');

        if (IsAbsolutePath(normalized))
        {
            error = "Absolute paths are forbidden";
            return false;
        }

        if (ContainsParentTraversal(normalized))
        {
            error = "Path cannot contain '..'";
            return false;
        }

        if (normalized.StartsWith('/') || normalized.EndsWith('/'))
        {
            error = "Path cannot have leading or trailing slashes";
            return false;
        }

        if (normalized.Contains("//"))
        {
            error = "Path cannot contain double slashes";
            return false;
        }

        return true;
    }

    private static bool IsAbsolutePath(string path)
    {
        // Unix absolute path
        if (path.StartsWith('/'))
            return true;

        // Windows drive letter (C:, D:, etc.)
        if (path.Length >= 2 && char.IsLetter(path[0]) && path[1] == ':')
            return true;

        // UNC path (//server or \\server)
        if (path.StartsWith("//") || path.StartsWith("\\\\"))
            return true;

        return false;
    }

    private static bool ContainsParentTraversal(string path)
    {
        var segments = path.Split('/');
        return segments.Any(s => s == "..");
    }

    /// <summary>
    /// Combine a base path with a relative path, normalizing the result
    /// </summary>
    public static string Combine(string basePath, string relativePath)
    {
        var normalized = Normalize(relativePath);
        return Path.Combine(basePath, normalized.Replace('/', Path.DirectorySeparatorChar));
    }
}

/// <summary>
/// Exception for invalid paths
/// </summary>
public class InvalidPathException : Exception
{
    public string InvalidPath { get; }

    public InvalidPathException(string message, string path)
        : base($"{message}: '{path}'")
    {
        InvalidPath = path;
    }
}
