namespace Soundboard.Client.Models;

/// <summary>A state transition event from the engine (e.g. started, streaming, finished).</summary>
/// <param name="State">The engine state identifier.</param>
public sealed record EngineEvent(
    string State
);
