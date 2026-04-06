# CursorAssist

## What This Is

A deterministic engine for assistive cursor control, UI accessibility benchmarking, and adaptive motor-skill training. Published as four modular NuGet packages (Canon, Trace, Policy, Engine) plus runtime and app layers.

## Two Products, One Workspace

- **CursorAssist** -- Real-time cursor assistance for people with motor impairments (tremor compensation, soft deadzones, target magnetism)
- **MouseTrainer** -- Deterministic cursor dexterity game for building motor skills over time (.NET MAUI desktop)

## Architecture

- .NET 8, C#, modular monolith with one-way dependencies
- Canon (schemas) and Trace (JSONL recording) are dependency-free leaves
- Policy maps MotorProfile to AssistiveConfig using DSP-grounded formulas
- Engine runs a 60 Hz fixed-timestep transform pipeline with FNV-1a hash verification
- Runtime.Core manages threading and config hot-swap; Runtime.Windows provides Win32 hooks
- MouseTrainer has its own Domain/Simulation/Audio stack plus MAUI host

## Key Design Principles

- Deterministic: same input always produces the same output, hash-verified every tick
- DSP-grounded: EMA cutoff from closed-form formulas, power-law deadzones, velocity-attenuated phase compensation
- Local-first: no network, no telemetry, no cloud sync

## Build & Test

```bash
dotnet build
dotnet test          # 456+ tests
```

## Key Notes

- Windows 10/11 required for Runtime.Windows and MouseTrainer.MauiHost
- Core libraries (Canon, Trace, Policy, Engine) are platform-agnostic
- NuGet packages published independently
