using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Input;

namespace MouseTrainer.Simulation.Core;

/// <summary>
/// Core simulation contract. Implementations must be purely deterministic:
/// same seed + same input sequence must always produce the same event stream.
/// </summary>
public interface IGameSimulation
{
    /// <summary>Reset simulation state using a raw seed.</summary>
    void Reset(uint sessionSeed);

    /// <summary>Advance simulation by one fixed timestep.</summary>
    void FixedUpdate(long tick, float dt, in PointerInput input, List<GameEvent> events);
}
