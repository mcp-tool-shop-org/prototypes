# Fresh Install Validation

Proof that Soundboard works on a clean machine with no prior setup.

## Prerequisites (only these)

- .NET 8.0 SDK (for SDK, CLI, examples) or .NET 10.0 SDK with MAUI workload (for reference client)
- Git
- Windows 10/11

Nothing else. No accounts, no API keys, no environment configuration.

## Validation script

Run these commands on a fresh machine. Every step must succeed without modification.

### Step 1: Clone

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui
```

### Step 2: Run tests (no engine needed)

```bash
dotnet test tests/Soundboard.Client.Tests
dotnet test tests/Soundboard.IntegrationTests
```

Expected: 44 tests pass (27 unit + 17 integration). Zero engine dependency.

### Step 3: Build everything

```bash
dotnet build src/Soundboard.Client
dotnet build src/soundboard-cli
dotnet build examples/Quickstart
dotnet build examples/AgentTool
```

Expected: all 4 build with 0 errors, 0 warnings.

### Step 4: CLI help (no engine needed)

```bash
dotnet run --project src/soundboard-cli -- --help
```

Expected: usage text with health, presets, voices, speak commands.

### Step 5: Pack the SDK

```bash
dotnet pack src/Soundboard.Client --configuration Release
```

Expected: `Soundboard.Client.1.0.0.nupkg` created.

### Step 6 (optional): With engine

If the engine is running on `localhost:8765`:

```bash
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello from a fresh install"
```

Expected: health info, preset list, and `output.wav` created.

## What this proves

| Property | Evidence |
|---|---|
| No tribal knowledge | Script runs unchanged on any machine |
| No environment guessing | Only .NET SDK + Git required |
| No git clone workarounds | Standard clone, standard build |
| Tests without engine | FakeEngineServer handles all integration tests |
| SDK is independent | Builds and packs without MAUI workload |

## Failure checklist

If any step fails:

| Failure | Likely cause | Fix |
|---|---|---|
| `dotnet` not found | .NET SDK not installed | Install from https://dot.net |
| Restore fails | No internet | Ensure NuGet.org is reachable |
| MAUI build fails | Workload not installed | `dotnet workload install maui-windows` |
| Test fails | Port conflict | Restart and retry (FakeEngineServer uses random ports) |
| CLI can't connect | No engine running | Step 6 requires a running engine |
