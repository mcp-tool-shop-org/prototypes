namespace CodeTeam.Packaging;

/// <summary>
/// Fixed paths per CONTRACT.md v0.1
/// </summary>
public static class PackageConstants
{
    /// <summary>
    /// Path to manifest file (required)
    /// </summary>
    public const string ManifestPath = "codeteam.manifest.json";

    /// <summary>
    /// Directory containing signatures and approvals (required)
    /// </summary>
    public const string SignaturesDir = "signatures";

    /// <summary>
    /// Approvals JSONL file
    /// </summary>
    public const string ApprovalsPath = "signatures/approvals.jsonl";

    /// <summary>
    /// Signatures JSONL file
    /// </summary>
    public const string SignaturesPath = "signatures/signatures.jsonl";

    /// <summary>
    /// Supported schema version
    /// </summary>
    public const string SchemaVersion = "0.1";
}
