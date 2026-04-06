using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Abstractions;

public interface ILibraryIndexStore
{
    LibraryIndex Load(string path);
    void Save(string path, LibraryIndex index);
}
