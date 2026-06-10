# Baselines

Real measured trajectories from production training runs, shaped to the
`createModelState()` contract. These are VectorCaliper's ground truth for the
"establish baselines → predict/hypothesize" roadmap: once several runs are in,
early-trajectory geometry (e.g. spread-collapse rate by step 500) can be tested
as a predictor of where the binding peak lands.

## qwen-lora-tallow-fen-v1 (2026-06-09) — first real-data baseline

A Qwen-Image rank-16 style LoRA (`tallow_fen_style_v1`, RTX 5090, 2000 steps,
8 checkpoints). Per checkpoint: a fixed 12-prompt eval grid was generated and the
CLIP ViT-B/32 embedding cloud measured. Field mapping and uncertainty PROXIES are
documented in the capture script docstring (a diffusion-LoRA run has no native
classifier entropy/margin/ECE — see dogfood notes #4).

**What this baseline demonstrates** (the headline for the tool's thesis):
between steps 1750→2000, `performance.accuracy` (CLIP-sim to the style centroid)
ROSE 0.7796→0.7937 while `geometry.anisotropy` spiked 8.2→12.5 and
`geometry.effectiveDimension` collapsed 7.0→6.76. The similarity gain came from a
collapsing, less-diverse embedding cloud — overfit masquerading as improvement.
Performance-only checkpoint selection picks step 2000; geometry+performance picks
step 1250 (also the CMMD minimum, 0.1351, and the human looked-at choice, which
saw the same overfit as monochrome drift on neutral subjects). **The combined view
caught what the single metric missed.**

- `qwen-lora-tallow-fen-v1.json` — 8 states (capture: `E:/AI/training/_caliper_capture.py` on the rig)
- `qwen-lora-tallow-fen-v1.svg` — rendered through the real pipeline (ProjectionEngine → SceneBuilder → SVGRenderer)
