using MouseTrainer.Simulation.Levels;

namespace MouseTrainer.Simulation.Core;

/// <summary>
/// Extended simulation interface that supports resetting from a pre-built LevelBlueprint.
/// Required for mutator replay: the verifier must reset from the mutated blueprint,
/// not from the bare seed, to replay against the exact gates the player saw.
/// </summary>
public interface IGameSimulationWithBlueprint : IGameSimulation
{
    /// <summary>
    /// Reset the simulation from a pre-built blueprint.
    /// Produces identical simulation state to Reset(uint) when the blueprint
    /// was generated from the same seed + config with no mutators.
    /// </summary>
    void Reset(LevelBlueprint blueprint);
}
