<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/training-studio/readme.png" alt="Training Studio" width="400" />
</p>

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**Train machine learning models directly in your browser. No cloud. No data upload. No Python setup.**

Training Studio is a TensorFlow.js-powered ML training application that runs entirely locally. Your data never leaves your device.

## Why Training Studio?

| Problem | Solution |
|---------|----------|
| Python environment headaches | **Zero setup** - just open and train |
| Privacy concerns with cloud ML | **100% local** - data never leaves your device |
| Complex ML tooling | **Simple workflow** - CSV in, trained model out |
| Slow iteration cycles | **Real-time feedback** - live charts and metrics |

## Features

### Core Training
- **Load CSV datasets** - Automatic feature/label detection
- **Configure MLP models** - Hidden layers, activation, dropout
- **Real-time training charts** - Loss and accuracy visualization
- **Early stopping** - Automatic convergence detection
- **GPU acceleration** - WebGPU/WebGL for fast training

### Evaluation & Prediction
- **Confusion matrix** - Visual classification performance
- **Per-class metrics** - Precision, recall, F1 score
- **Single predictions** - Test individual samples
- **Batch inference** - Predict on CSV files
- **Export results** - Download predictions as CSV

### Data Tools
- **Preprocessing** - Normalization, missing value handling
- **One-hot encoding** - Automatic categorical conversion
- **Train/test split** - Configurable validation percentage
- **Training history** - Compare runs, find best models

### Production Ready
- **287 tests** - Comprehensive test coverage
- **Accessible** - WCAG 2.1 AA foundation
- **Responsive** - Works on tablet and mobile
- **Offline capable** - No internet required after install

## Installation

### From Source

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## Quickstart

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Try with sample data

1. Click **Dataset** tab
2. Load `sample_data/iris.csv`
3. Select features: sepal_length, sepal_width, petal_length, petal_width
4. Select label: species
5. Go to **Model** tab, use defaults (64, 32 hidden layers)
6. Go to **Train** tab, click **Start Training**
7. Watch the charts update in real-time!

## Bundle Validation (CLI)

Validate exported ML bundles from the command line:

```bash
cd TrainingStudio.Web
npm run validate -- ./src/tests/fixtures/golden-v1
npm run validate -- --json ./path/to/bundle
```

Exit codes: `0` = valid, `2` = valid with warnings, `3` = invalid. See [SPEC.md](SPEC.md) for the full bundle format specification.

## Desktop App (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Requires Windows 10 1809+, 4 GB RAM (8 GB recommended), GPU with WebGL 2.0 or WebGPU (optional, CPU fallback).

## Development

```bash
cd TrainingStudio.Web

# Run all 287 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## Documentation

| Document | Description |
|----------|-------------|
| [Handbook](https://mcp-tool-shop-org.github.io/training-studio/handbook/) | Full user guide, reference, and beginner tutorial |
| [SPEC.md](SPEC.md) | Bundle format specification |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [ROADMAP.md](ROADMAP.md) | Development roadmap |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## Sample Datasets

| File | Task | Features | Classes |
|------|------|----------|---------|
| `sample_data/iris.csv` | Multi-class classification | 4 | 3 |
| `sample_data/binary_classification.csv` | Binary classification | 2 | 2 |

## Privacy & Security

| Aspect | Detail |
|--------|--------|
| **Data touched** | User-provided CSV datasets, TensorFlow.js models (browser-local), training metrics |
| **Data NOT touched** | No telemetry, no analytics, no cloud upload, no user tracking |
| **Permissions** | Browser sandbox only — file access via user-initiated file picker |
| **Network** | None — fully offline, all ML runs in-browser via TensorFlow.js |
| **Telemetry** | None collected or sent |

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for details.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT - See [LICENSE](LICENSE) for details.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
