# Dogfood notes — first real-data run (qwen-lora-tallow-fen-v1, 2026-06-09)

Friction and findings from feeding VectorCaliper its first production training run.
Input for the next working session; nothing here was patched upstream yet.

## 1. Determinism guarantee is not actually byte-deterministic
`src/projection/engine.ts` — the PCA power-iteration seeds eigenvector init with raw
`Math.random()` while the seeded Mulberry32 (`createSeededRandom`) sits unused in the
same file. PCA usually converges to the same components up to sign, but the README's
determinism promise ("deterministic, reproducible rendering") is not guaranteed at the
byte level. Fix: thread the seeded RNG into `pca()`.

## 2. Raw Node ESM cannot consume the package
`tsc` emits the source's extensionless/directory relative imports verbatim
(`from './schema'`, `from './types/state'`); Node ESM rejects both
(`ERR_UNSUPPORTED_DIR_IMPORT`). Rendering required patching 32 dist files to append
`.js` / `/index.js`. Fix: `moduleResolution: "NodeNext"` + explicit `.js` extensions
in source imports. Related: no `dist/` ships and `files` only includes `dist/` — a
consumer must build from source with devDeps.

## 3. Naming/metadata drift
- README installs `@mcp-tool-shop/vector-caliper`; package.json says
  `@mcptoolshop/vector-caliper` (and `"private": true` — not published at all).
- `repository.url` points at `mcp-tool-shop-org/VectorCaliper.git`; the source lives
  in `mcp-tool-shop-org/prototypes`.

## 4. API fit for diffusion/LoRA training runs
The schema REQUIRES `uncertainty.{entropy, margin, calibration}` — natural for
classifiers, nonexistent for diffusion LoRA runs. This baseline used documented
proxies (entropy of the normalized centroid-similarity distribution; style-vs-photo
text-anchor contrast gap as margin; similarity std as calibration). Options:
make the uncertainty group optional like `dynamics`, or ship a domain preset
("diffusion-style-lora") that defines blessed proxies so cross-run baselines stay
comparable.

## 5. The demo bypasses the product
`demo/canonical-demo.ts` hand-rolls its SVG and uses a flat ad-hoc JSON, bypassing
ProjectionEngine/SemanticMapper/SceneBuilder/SVGRenderer entirely — so the checked-in
canonical output exercises none of the public pipeline. This baseline's SVG is, as far
as the dogfood could tell, the first artifact rendered through the real pipeline.

## 6. What worked
Zero-dep pure-TS core imported cleanly once dist was patched; all 8 states passed
`createModelState` validation on the first attempt (the capture script pre-clamped
its [0,1] proxies specifically because the factories fail closed — the contract
shaped the producer, which is the point of a strict schema); budget classes were a
non-issue at n=8; the semantic encoding (hue←effdim, radius←spread) makes the
step-2000 cloud collapse visible in the SVG without reading any numbers.
