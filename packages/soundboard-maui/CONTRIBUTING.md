# Contributing to Soundboard MAUI

## Repository scope

This repository is the **client application only**. It does not contain engine code, voice models, or inference logic.

- **UI and ViewModel changes** go here (`soundboard-maui`)
- **Engine and API changes** go to [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)
- **API contract changes** require updates in both repos (see [api-contract.md](docs/api-contract.md))

## Client reuse

`Soundboard.Client` is a standalone net8.0 library with no MAUI dependencies. It can be referenced from:

- Console apps
- WPF/WinForms apps
- ASP.NET services
- Any .NET project that can provide an `IAudioPlayer` implementation

The client discovers presets and voices at runtime. It makes no assumptions about the engine implementation.

## What we'll accept

- Bug fixes with regression tests
- UX improvements that reduce first-run friction
- New `IAudioPlayer` implementations for other platforms
- Documentation improvements
- Test coverage improvements

## What we won't accept

- Engine code or model dependencies
- Features that require engine-side changes without a contract update
- UI complexity that increases time-to-first-output
- Analytics, telemetry, or tracking
- Breaking changes to the v1.0 client API without a major version bump

## How to contribute

1. Fork the repo
2. Create a branch from `main`
3. Make your changes
4. Run tests: `dotnet test`
5. Verify the MAUI app builds: `dotnet build src/Soundboard.Maui`
6. Open a PR using the [template](.github/pull_request_template.md)

## Development setup

```bash
# Prerequisites
# - .NET 10.0 SDK with MAUI workload
# - Windows 10/11

dotnet workload install maui-windows

# Run all tests (no engine needed)
dotnet test

# Build the app
dotnet build src/Soundboard.Maui
```

## Code conventions

- C# with nullable enabled
- No `#region` blocks
- MVVM pattern: ViewModel owns logic, XAML owns layout
- `INotifyPropertyChanged` manually (no framework)
- All async methods accept `CancellationToken`
- Tests use xUnit
