# MouseTrainer

Deterministic mouse dexterity trainer with fixed-timestep simulation and replay verification.

## Key Features

- **Fully Deterministic** — Same seed produces identical levels, scores, and replays everywhere
- **Six Blueprint Mutators** — Composable difficulty reshaping
- **Replay Verification** — Tick-by-tick re-simulation for integrity
- **ReflexGates Mode** — 12 oscillating gates at 60 Hz fixed timestep
- **Protocol-Grade Identity** — RunId frozen forever after creation

## NuGet Packages

```bash
dotnet add package MouseTrainer.Domain
dotnet add package MouseTrainer.Simulation
dotnet add package MouseTrainer.Audio
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/MouseTrainer)
- [MouseTrainer.Domain on NuGet](https://www.nuget.org/packages/MouseTrainer.Domain)
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
