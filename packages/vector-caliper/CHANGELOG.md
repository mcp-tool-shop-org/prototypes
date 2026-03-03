# Changelog

All notable changes to VectorCaliper are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-05

### Added

#### Core
- State schema with typed values (bounded, normalized, positive)
- Validation layer with hard checks and soft warnings
- Semantic-to-visual mapping (SemanticMapper)
- Projection engine with PCA, t-SNE, UMAP support
- Scene graph as single source of truth
- SVG renderer with deterministic output

#### Trajectories & Time
- Trajectory type for ordered state sequences
- Time axis visualization
- Timeline scrubber with playback controls
- Regime detection for trajectory segmentation

#### Interactive Features
- Semantic layers with visibility toggling
- Comparison view for state differences
- Tooltip system with variable display
- Diagnostic logging for debugging

#### Scale & Performance
- Scale classes: small, medium, large, extreme
- Performance budgets with explicit limits
- Chunked state storage with async loading
- Progressive rendering with truthful degradation
- WebGL and Canvas2D renderers
- Interaction constraints (scrub rate, hover debounce, selection limits)

#### Integration
- Framework adapters (PyTorch, JAX)
- Streaming protocol for real-time visualization
- CLI artifacts for CI/CD integration
- Training log adapter

#### Documentation
- VECTORCALIPER_V1_GUARANTEES.md (frozen semantics)
- Canonical demo with deterministic output
- Complete API reference in README

### Guarantees

This release establishes frozen guarantees for v1.x:

1. **State Schema** - Variables are numeric only, no derived fields added
2. **Scene Graph** - Same state produces same geometry
3. **Projection** - Deterministic with fixed random seeds
4. **Integration** - Adapters are stateless, removable, non-invasive
5. **Streaming** - Replay equals offline loading
6. **Performance** - Explicit limits, rejection not degradation
7. **Interaction** - Constraints visible, never hidden
8. **Degradation** - Exact subsets, never approximations

See [VECTORCALIPER_V1_GUARANTEES.md](docs/VECTORCALIPER_V1_GUARANTEES.md) for details.

### What VectorCaliper Does Not Do

VectorCaliper is a microscope, not a dashboard. It does not:

- Recommend actions
- Detect anomalies
- Score quality
- Optimize hyperparameters
- Monitor production systems

It shows what happened. It never tells you what it means.

---

## Versioning Policy

- **Patch (1.0.x)**: Bug fixes only, no semantic changes
- **Minor (1.x.0)**: Additive features, no breaking changes to guarantees
- **Major (2.0.0)**: May change frozen guarantees, requires migration guide
