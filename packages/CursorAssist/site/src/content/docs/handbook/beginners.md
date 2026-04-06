---
title: Beginners
description: New to CursorAssist? Start here for a plain-language introduction.
sidebar:
  order: 99
---

New to CursorAssist? This page explains what the project does, who it is for, and how to get started without assuming prior knowledge of DSP or accessibility engineering.

## What is CursorAssist?

CursorAssist is a desktop tool and library suite that helps people with motor impairments use a mouse more effectively. If someone has a hand tremor, limited range of motion, or fatigue that makes precise cursor control difficult, CursorAssist smooths out the shaky input and guides the cursor toward targets.

The project also includes MouseTrainer, a dexterity training game that helps users build the motor skills to need less assistance over time.

## Who is it for?

- **End users** with motor impairments (essential tremor, Parkinson's, repetitive strain, fatigue) who need smoother cursor control on Windows
- **Developers** building accessibility tools who want a tested, modular transform pipeline they can embed via NuGet packages
- **Researchers** studying motor control who need deterministic, reproducible cursor input processing with replay support

## Key concepts

**Motor profile** -- A snapshot of someone's cursor behavior: how much their hand trembles, how directly they reach targets, how often they overshoot. CursorAssist measures these metrics and stores them in a structured JSON format.

**Assistive config** -- The settings that control how CursorAssist transforms cursor input. Instead of manually tuning sliders, the config is automatically derived from your motor profile using DSP math. The same profile always produces the same config.

**Transform pipeline** -- A chain of five processing steps that clean up raw cursor input: suppress tiny tremor movements (deadzone), smooth the path (EMA filter), compensate for smoothing lag (phase correction), detect intentional direction and boost it (intent), and gently pull the cursor toward nearby buttons (magnetism).

**Determinism** -- CursorAssist guarantees that feeding the same input always produces the same output. Every frame is hash-verified. This makes testing, benchmarking, and replay possible.

## How it works (simplified)

1. **Capture**: Windows hooks intercept raw mouse movement
2. **Profile**: A calibration session measures your tremor frequency and amplitude
3. **Map**: The Policy module converts your motor profile into an assistive config using DSP formulas
4. **Transform**: The Engine runs your input through five transforms at 60 frames per second
5. **Inject**: The corrected cursor position is sent back to Windows

The entire pipeline runs locally with no network calls, no telemetry, and no cloud sync.

## Installation

### Use the NuGet packages (for developers)

If you are building your own application and want to embed CursorAssist's transforms:

```bash
dotnet add package CursorAssist.Canon    # Schemas only
dotnet add package CursorAssist.Trace    # Recording/playback only
dotnet add package CursorAssist.Policy   # Profile-to-config mapping
dotnet add package CursorAssist.Engine   # Full transform pipeline
```

You only need the packages you actually use. Canon and Trace have zero dependencies.

### Build from source

```bash
git clone https://github.com/mcp-tool-shop-org/CursorAssist.git
cd CursorAssist
dotnet build
dotnet test    # runs 456+ tests
```

Requirements: .NET 8 SDK or later. Windows 10/11 is needed for the runtime and MouseTrainer app, but the core libraries work on any OS.

## Common tasks

### Run a quick calibration

```csharp
using CursorAssist.Engine.Analysis;
using CursorAssist.Policy;

// Record 5 seconds of cursor input (300 ticks at 60 Hz)
var session = new CalibrationSession();
while (!session.IsComplete)
    session.RecordTick(dx, dy); // feed raw deltas each tick

// Convert to a motor profile and assistive config
var result = session.GetResult();
var profile = result.ToMotorProfile("my-profile");
var config = ProfileToConfigMapper.Map(profile);
```

### Build and run the transform pipeline

```csharp
using CursorAssist.Engine.Core;
using CursorAssist.Engine.Transforms;

var pipeline = new TransformPipeline()
    .Add(new SoftDeadzoneTransform())
    .Add(new SmoothingTransform())
    .Add(new PhaseCompensationTransform())
    .Add(new DirectionalIntentTransform())
    .Add(new TargetMagnetismTransform());

var engine = new DeterministicPipeline(pipeline, fixedHz: 60);

var context = new TransformContext
{
    Tick = 0,
    Dt = 1f / 60f,
    Config = config,
    Targets = []
};

var raw = new InputSample(X: 500f, Y: 300f, Dx: 2.1f, Dy: -0.8f,
                          PrimaryDown: false, SecondaryDown: false, Tick: 0);

EngineFrameResult result = engine.FixedStep(in raw, context);
```

### Record a trace for replay

```csharp
using CursorAssist.Trace;

using var writer = new TraceWriter("session.castrace.jsonl");
writer.WriteHeader(new TraceHeader
{
    SessionId = "sess-001",
    StartedUtc = DateTimeOffset.UtcNow,
    TickRateHz = 60
});

writer.WriteSample(new TraceSample { Tick = 0, X = 500f, Y = 300f });
writer.WriteSample(new TraceSample { Tick = 1, X = 502.1f, Y = 299.2f });
```

## Frequently asked questions

**Does CursorAssist require an internet connection?**
No. Everything runs locally. There are no network calls, no telemetry, and no cloud sync.

**What operating system do I need?**
The core libraries (Canon, Trace, Policy, Engine) work on any OS that supports .NET 8. The runtime layer and MouseTrainer game require Windows 10 or 11.

**Can I use just one part of CursorAssist?**
Yes. The four NuGet packages have strictly one-way dependencies. You can use Canon alone for schemas, Trace alone for recording, or Policy alone for the mapper. You do not need to take the full Engine if you only need one piece.

**How does the calibration work?**
A 5-second session records your raw cursor movements. The TremorAnalyzer estimates your tremor frequency (via zero-crossing rate on high-pass filtered deltas) and amplitude (via RMS tracking). These measurements are converted into a motor profile, which the mapper then uses to derive all transform parameters.

**Is the output deterministic?**
Yes. The same input stream always produces the same output, verified by an FNV-1a hash chain on every tick. This makes it possible to record a session, replay it later, and confirm the output matches exactly.
