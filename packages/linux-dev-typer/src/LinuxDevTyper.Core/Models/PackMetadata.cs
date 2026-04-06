namespace LinuxDevTyper.Core.Models;

/// <summary>
/// Metadata for a user-authored snippet pack. Stored in PersistedState.PackRegistry
/// to track which packs are enabled/disabled.
/// </summary>
public sealed class PackMetadata
{
    /// <summary>Filename in the packs directory (e.g. "go.json")</summary>
    public string FileName { get; set; } = "";

    /// <summary>Language identifier derived from filename (e.g. "go")</summary>
    public string Language { get; set; } = "";

    /// <summary>Whether this pack is enabled for snippet selection</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Number of valid snippets discovered in this pack</summary>
    public int SnippetCount { get; set; }
}
