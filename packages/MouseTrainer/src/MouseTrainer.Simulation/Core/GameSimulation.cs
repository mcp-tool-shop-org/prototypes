using MouseTrainer.Domain.Events;
using MouseTrainer.Domain.Input;

namespace MouseTrainer.Simulation.Core;

/// <summary>
/// Minimal stub implementation of IGameSimulation.
/// Emits only Tick events. Used for testing the loop infrastructure
/// without a real game mode attached.
/// </summary>
public sealed class GameSimulation : IGameSimulation
{
    public void Reset(uint sessionSeed)
    {
        // No state to reset in stub.
    }

    public void FixedUpdate(long tick, float dt, in PointerInput input, List<GameEvent> events)
    {
        events.Add(new GameEvent(GameEventType.Tick, 1f, Arg0: (int)(tick % int.MaxValue)));
    }
}
