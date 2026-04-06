using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Abstractions;

public interface IAssetProvider
{
    IReadOnlyList<string> ListLanguages();
    IReadOnlyList<Snippet> LoadSnippets(string language);
}
