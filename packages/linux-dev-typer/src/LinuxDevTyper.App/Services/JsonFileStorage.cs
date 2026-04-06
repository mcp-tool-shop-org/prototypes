using System.Text.Json;
using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Persistence;

namespace LinuxDevTyper.App.Services;

public sealed class JsonFileStorage : IStorage
{
    private static readonly JsonSerializerOptions ReadOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true
    };

    private static readonly JsonSerializerOptions WriteOpts = new()
    {
        WriteIndented = true
    };

    private static string StatePath() => AppPaths.StateFile();

    public PersistedState Load()
    {
        try
        {
            var path = StatePath();
            if (!File.Exists(path)) return new PersistedState();
            var json = File.ReadAllText(path);
            var state = JsonSerializer.Deserialize<PersistedState>(json, ReadOpts) ?? new PersistedState();
            return SchemaMigrator.Migrate(state);
        }
        catch
        {
            return new PersistedState();
        }
    }

    public void Save(PersistedState state)
    {
        try
        {
            state.SchemaVersion = PersistedState.CurrentSchemaVersion;
            var path = StatePath();
            var json = JsonSerializer.Serialize(state, WriteOpts);
            File.WriteAllText(path, json);
        }
        catch { }
    }
}
