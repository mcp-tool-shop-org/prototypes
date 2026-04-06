using DevOpTyper.Content.Abstractions;
using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.App.Services;

/// <summary>
/// IAssetProvider bridge that surfaces content library items as Snippets
/// for the existing typing engine. Converts CodeItem → Snippet with
/// default Difficulty=3 and empty metadata fields.
///
/// In this app, the content library holds user-pasted and imported code.
/// Built-in snippets are loaded via LocalAssetProvider (full metadata).
/// </summary>
public sealed class ContentAssetProvider : IAssetProvider
{
    private readonly ContentIntegrationService _content;

    public ContentAssetProvider(ContentIntegrationService content)
    {
        _content = content;
    }

    public IReadOnlyList<string> ListLanguages()
    {
        return _content.Languages();
    }

    public IReadOnlyList<Snippet> LoadSnippets(string language)
    {
        var query = new ContentQuery { Language = language };
        return _content.QueryAsSnippets(query);
    }
}
