<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/VectorCaliper/readme.png" alt="VectorCaliper" width="400"></p>

<p align="center"><strong>Scientific instrument for faithful model-state visualization — turns vector graphics into calibrated representations.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/vector-caliper"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/vector-caliper.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-brightgreen.svg" alt="node 18+"></a>
  <a href="https://mcp-tool-shop-org.github.io/VectorCaliper/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

VectorCaliper visualizes model-state trajectories during training. Every visual element traces back to a measured variable. Nothing is inferred, smoothed, or recommended.

> "A microscope, not a dashboard."

VectorCaliper shows what happened. It never tells you what it means.

---

## What VectorCaliper Is

- A measurement instrument for learning dynamics
- A geometrical debugger for optimization trajectories
- An inspection tool for training state evolution
- A deterministic mapping from state to visual representation

## What VectorCaliper Is Not

- A training dashboard
- An optimizer or recommender system
- A health monitor or anomaly detector
- A hyperparameter search tool

See [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) for details.

---

## Core Guarantees (v1)

VectorCaliper v1.x provides frozen semantics:

1. **Determinism** — Same input produces same output
2. **No interpretation** — Visual encodings do not imply meaning
3. **Truthful degradation** — Subsets are exact, never approximations
4. **Explicit limits** — Budget violations cause rejection, not silent degradation

Full specification: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## Minimal Example

```typescript
import {
  createModelState,
  SemanticMapper,
  ProjectionEngine,
  SceneBuilder,
  SVGRenderer,
} from '@mcp-tool-shop/vector-caliper';

// Create state from measured values
const state = createModelState({
  time: 0,
  geometry: { effectiveDimension: 3.0, anisotropy: 1.5, spread: 5.0, density: 0.7 },
  uncertainty: { entropy: 1.2, margin: 0.6, calibration: 0.08 },
  performance: { accuracy: 0.92, loss: 0.08 },
});

// Project, build scene, render
const projector = new ProjectionEngine();
projector.fit([state]);
const builder = new SceneBuilder(new SemanticMapper());
builder.addState(state, projector.project(state));
const svg = new SVGRenderer({ width: 800, height: 600 }).render(builder.getScene());
```

---

## Canonical Demo

The [demo/](demo/) directory contains a deterministic demo generator:

```bash
npx ts-node demo/canonical-demo.ts
```

Output:
- `demo/output/canonical-trajectory.json` — 500 states
- `demo/output/canonical-trajectory.svg` — Visualization
- `demo/output/canonical-manifest.json` — SHA256 checksums

Run twice and compare checksums to verify determinism.

---

## Who This Is For

**Researchers** debugging training dynamics who need:
- Faithful visualization without interpretation
- Reproducible outputs for papers
- Explicit guarantees about what is shown

**Engineers** inspecting model state evolution who need:
- Scale-aware visualization (up to 1M states)
- Framework-agnostic state capture
- Deterministic CI artifacts

**Not for**: Production monitoring, automated alerting, or hyperparameter optimization.

---

## Installation

```bash
npm install @mcp-tool-shop/vector-caliper
```

Requires Node.js 18+.

---

## Scale Limits

VectorCaliper enforces explicit limits. Exceeding them results in **rejection**, not silent degradation.

| Scale Class | Max States | Memory Limit | Render Budget |
|-------------|------------|--------------|---------------|
| small       | 1,000      | 50 MB        | 16ms/frame    |
| medium      | 10,000     | 200 MB       | 33ms/frame    |
| large       | 100,000    | 500 MB       | 66ms/frame    |
| extreme     | 1,000,000  | 1 GB         | 100ms/frame   |

---

## Documentation

- [docs/README.md](docs/README.md) — Documentation index
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — Framework integration
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — Mapping pipeline

---

## How to Cite

If you use VectorCaliper in academic work:

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [Software]. https://github.com/mcp-tool-shop-org/VectorCaliper

**BibTeX:**
```bibtex
@software{vectorcaliper2026,
  author = {mcp-tool-shop},
  title = {VectorCaliper: A Geometrical Debugger for Learning Dynamics},
  year = {2026},
  version = {1.0.0},
  url = {https://github.com/mcp-tool-shop-org/VectorCaliper}
}
```

See [CITATION.cff](CITATION.cff) for machine-readable metadata.

---

## License

MIT. See [LICENSE](LICENSE).

---

## Status

**v1.0.0** — Feature-frozen until 2026-03-07. See [STOP.md](STOP.md).

> Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
