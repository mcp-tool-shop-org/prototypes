<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/witness/readme.png" alt="Witness" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/xrpl-witness/"><img src="https://img.shields.io/pypi/v/xrpl-witness" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/witness/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Status: v1.0.1 — Phase 1 complete, Phase 2A shipped**

A local-first, append-only, cryptographically verifiable event journal for human–AI work.

## What you can do today

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Third parties can validate testimony without Witness installed** — the JSON schema and verification rules are fully documented.

## Why it matters

Witness creates portable proof trails:
- **Deterministic**: Same inputs → same output bytes (use `--generated-at` for reproducibility)
- **Verifiable**: Ed25519 signatures + SHA-256 digests over canonical JSON
- **Portable**: Email it, attach it to tickets, check it into a repo
- **Exact**: `--include-events` embeds byte-for-byte store content

## Quickstart

```bash
# Install
pip install xrpl-witness

# Initialize a store
witness init

# Record an event
witness record --action "example.action" --intent "Demonstrate recording"

# Generate testimony
witness testify --format md

# Verify all events
witness verify
```

## Trust model

All cryptographic operations use **canonical JSON** → **SHA-256 digests** → **Ed25519 signatures**.

See [VERIFICATION.md](VERIFICATION.md) for:
- Exact serialization rules
- Worked verification examples
- Exit codes (0 = clean, 2 = flags, 3 = crypto failure)
- Privacy notes for `--include-events`

## Stable guarantees

| Artifact | Location | Contract |
|----------|----------|----------|
| Event schema | Golden fixtures | `tests/fixtures/golden/*.json` |
| Testimony schema | `schemas/testimony.schema.v0.1.json` | JSON output structure |
| Exit codes | [VERIFICATION.md](VERIFICATION.md) | 0/2/3 semantics |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 flag types, informational only |

## Documentation

> **Start here:** [CONTRACT.md](CONTRACT.md) — What is law vs example

| Document | Purpose |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | Normative vs example content |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Locked invariants |
| [VERIFICATION.md](VERIFICATION.md) | Crypto rules + worked examples |
| [docs/](docs/README.md) | Full documentation index |

## Phase 2 status

| Track | Status |
|-------|--------|
| **2A: Testimony as Artifact** | ✅ Shipped |
| **2B: Pipelines** | ⏸️ Paused ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | Not started |

See [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) for details.

## Project structure

```
witness/
├── src/witness/           # Core library
│   ├── canon.py           # Canonical JSON
│   ├── crypto.py          # Ed25519 signing/verification
│   ├── models.py          # Data models (events, verification)
│   ├── storage.py         # SQLite append-only store
│   ├── timeline.py        # Flag analysis
│   ├── testify.py         # Testimony generation
│   └── cli.py             # Command-line interface
├── schemas/               # JSON schemas
├── tests/                 # Test suite (128 tests)
│   └── fixtures/golden/   # Authoritative fixtures
├── tools/                 # Verification utilities
└── docs/                  # Documentation + ADRs
```

## Philosophy

> Witness is about truthfulness, not judgment.
> Record what happened. Verify it later. Let humans decide what it means.

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Local SQLite event journal (append-only), Ed25519 key pairs (local only), testimony artifacts (JSON/Markdown) |
| **Data NOT touched** | No telemetry, no analytics, no network calls, no cloud sync, no credential storage |
| **Permissions** | Read/write: local SQLite store + output artifacts. No network, no remote access |
| **Network** | None — fully offline, all cryptographic operations local |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting and cryptographic design.

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

MIT — see [LICENSE](LICENSE).
