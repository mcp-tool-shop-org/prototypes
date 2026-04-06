---
title: Motor Profiling
description: DSP-grounded profile-to-config mapping and calibration.
sidebar:
  order: 3
---

CursorAssist uses motor profiles to adapt its behavior to individual users. The Policy package maps profiles to assistive configurations using DSP-grounded formulas (policy version 4).

## Motor profile inputs

A `MotorProfile` captures measurable characteristics of a user's cursor control. All fields are immutable once created (versioned schema v1).

| Field | Unit | Meaning |
|-------|------|---------|
| TremorFrequencyHz | Hz | Dominant tremor frequency (0 = not measured) |
| TremorAmplitudeVpx | virtual px | Tremor amplitude (RMS of high-freq displacement) |
| PathEfficiency | ratio (0-1) | How directly the cursor reaches targets (1.0 = perfect) |
| OvershootRate | rate | How often the cursor overshoots targets |
| OvershootMagnitudeVpx | virtual px | Mean overshoot magnitude |
| MeanTimeToTargetS | seconds | Mean time to acquire a target |
| StdDevTimeToTargetS | seconds | Standard deviation of time-to-target |
| ClickStabilityVpx | virtual px | Mean displacement during click hold (lower = more stable) |
| SampleCount | count | Number of trials that produced this profile |

## Profile-to-config mapping

The `ProfileToConfigMapper` (policy v4) derives an `AssistiveConfig` from a motor profile:

```csharp
var profile = new MotorProfile
{
    ProfileId = "user-001",
    CreatedUtc = DateTimeOffset.UtcNow,
    TremorFrequencyHz = 6f,
    TremorAmplitudeVpx = 4.5f,
    PathEfficiency = 0.72f,
    OvershootRate = 1.2f,
};

AssistiveConfig config = ProfileToConfigMapper.Map(profile);
```

### Key output parameters

| Output | Formula basis | Example (6 Hz, 4.5 vpx tremor) |
|--------|--------------|-------------------------------|
| SmoothingMinAlpha | Closed-form EMA cutoff: `alpha = 0.05236 * f_tremor`, clamped [0.20, 0.40] | ~0.31 |
| SmoothingMaxAlpha | Path-efficiency-scaled ceiling, clamped to 0.95 | ~0.92 |
| DeadzoneRadiusVpx | Power-law: `D = 0.8 * A * (f/8)^0.65`, clamped [0.2, 3.0] | ~2.7 |
| PhaseCompensationGainS | `0.7 * tau_avg` with frequency-aware attenuation | ~0.005 |
| MagnetismRadiusVpx | `30 + pathDeficiency * 120` (range 30-150 vpx) | ~63.6 |
| SmoothingDualPoleEnabled | Enabled when tremor amplitude exceeds 4 vpx | true |
| IntentBoostStrength | Enabled when PathEfficiency exceeds 0.6 | ~0.32 |

The mapper also derives velocity breakpoints (`VelocityLow`, `VelocityHigh`), magnetism strength and hysteresis, edge resistance, and snap radius from the profile.

## DSP grounding

The smoothing filter is not ad hoc. The EMA cutoff frequency is derived from the closed-form formula `fc = alpha * Fs / (2 * pi)`, where `Fs` is the 60 Hz engine tick rate. The target suppression band is 4-12 Hz (physiological/essential tremor), preserving intentional motion below 3 Hz.

The deadzone radius uses power-law frequency weighting (exponent 0.65) rather than a simple square root. This relaxes suppression at low frequencies (3-4 Hz) where tremor overlaps with slow intentional motion, and tightens suppression at high frequencies (12+ Hz) where small per-tick deltas accumulate more destabilization.

Phase compensation gain includes frequency-aware attenuation: when MinAlpha is high (high-frequency tremor), the EMA is barely filtering and there is little lag to compensate. The gain ramps down to zero to avoid amplifying noise.

## Calibration

The `CalibrationSession` class records raw input ticks and produces a `CalibrationResult` using the standalone `TremorAnalyzer`:

```csharp
var session = new CalibrationSession(durationTicks: 300); // 5 seconds at 60 Hz

while (!session.IsComplete)
    session.RecordTick(dx, dy);

CalibrationResult result = session.GetResult();
MotorProfile profile = result.ToMotorProfile("user-calibrated");
AssistiveConfig config = ProfileToConfigMapper.Map(profile);
```

The `TremorAnalyzer` estimates frequency via zero-crossing rate on high-pass filtered deltas over a sliding 1-second window, with velocity gating to freeze adaptation during fast intentional motion. It also tracks RMS tremor amplitude. All operations are O(1) per tick with no allocations.

Confidence scoring reflects both sample count and whether a valid tremor frequency was detected. Profiles created from calibration use conservative defaults for unmeasured fields (PathEfficiency=0.7, OvershootRate=0.3).
