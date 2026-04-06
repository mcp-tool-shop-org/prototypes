# Changelog

All notable changes to Training Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-03-25

### Added

- 4 version consistency tests (semver, >= 1.0.0, CHANGELOG, scope)
- SHA-pinned GitHub Actions in all 3 workflows

## [1.0.3] - 2026-02-27

### Added

- Shipcheck audit — SHIP_GATE.md, SCORECARD.md
- Security & Data Scope section in README

## [1.0.0] - 2026-02-02

### Added

#### Phase 1: Foundation & Stability
- Fixed bridge.unit.test.ts timeout issues with mock timing
- Fixed cli-validator.unit.test.ts path validation assertions
- Updated SCHEMA_URI to use mcp-tool-shop-org organization
- Added accessibility foundation with ARIA labels and semantic properties
- Added focus-visible, high contrast mode, and reduced motion CSS support
- Added WebGPU/WebGL/CPU fallback chain with user notification
- Added TensorFlow.js initialization error recovery
- Added bridge request timeouts (30s default)
- Added user-friendly error messages for OOM/NaN/training failures
- Created STORE_LISTING.md with Microsoft Store metadata
- Updated README with features and system requirements

#### Phase 2: Feature Completeness
- Added confusion matrix visualization after training
- Added per-class precision, recall, and F1 score metrics
- Added Predict tab with single sample and batch prediction UI
- Added prediction results with confidence scores and probability bars
- Added prediction export to CSV
- Implemented ComputeBundleDigest in C# ExportService
- Added cross-implementation bundle digest verification tests
- Added training run history with IndexedDB persistence
- Added run comparison (side-by-side metrics)
- Added best model auto-selection by validation loss
- Added data preprocessing utilities (normalization, one-hot encoding)
- Added missing value handling (mean, median, zero fill)
- Added correlation matrix computation

#### Phase 3: Polish & Production
- Added comprehensive responsive design for tablet and mobile
- Added touch device optimizations with 48px minimum tap targets
- Added landscape orientation and print styles support
- Added internationalization (i18n) infrastructure
- Extracted 100+ UI strings to locale resources
- Added Intl formatters for numbers, dates, and relative time
- Added RTL layout direction support
- Added training WebWorker for non-blocking UI
- Added async training worker client with callbacks
- Added sample datasets (iris.csv, binary_classification.csv)
- Added comprehensive troubleshooting guide
- Added performance tips and FAQ section

### Changed
- Updated all tests to pass (283 total tests)
- Improved error handling across the application
- Enhanced UI accessibility throughout
- Optimized for Microsoft Store publication

### Fixed
- Bridge timeout issues in unit tests
- Extended path prefix error message formatting
- SCHEMA_URI pointing to correct organization

### Security
- All validation remains pure (no code execution)
- Bundle digest verification for integrity checking
- Security-first design maintained throughout

## [0.1.0] - Initial Development

### Added
- Initial MAUI + HybridWebView architecture
- TensorFlow.js integration for in-browser training
- Bundle validation with SHA-256 integrity verification
- SPEC.md bundle format contract
- CI pipeline with contract gate testing
- 208 initial tests passing

---

## Release Notes

### v1.0.0 - Production Ready

This release marks Training Studio as production-ready for Microsoft Partners publication.

**Key Highlights:**
- 283 tests passing (100% pass rate)
- WCAG 2.1 AA accessibility foundation
- Responsive design for all screen sizes
- Internationalization ready (en-US default)
- WebWorker training for non-blocking UI
- Complete training-to-export workflow

**Recommended for:**
- Data scientists and ML engineers
- Students learning machine learning
- Educators teaching ML concepts
- Anyone needing local, private ML training

**System Requirements:**
- Windows 10 version 1809 or later
- 4 GB RAM minimum (8 GB recommended)
- Modern web browser support (Chrome, Edge, Firefox)
- GPU recommended for faster training (WebGL/WebGPU)
