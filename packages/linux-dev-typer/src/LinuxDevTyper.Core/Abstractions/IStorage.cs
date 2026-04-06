using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Abstractions;

public interface IStorage
{
    PersistedState Load();
    void Save(PersistedState state);
}
