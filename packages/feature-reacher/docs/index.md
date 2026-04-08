# Feature-Reacher

**Surface underutilized features before they become technical debt.**

Feature-Reacher analyzes your product artifacts (release notes, documentation, FAQs) and produces an Adoption Risk Audit -- a ranked, evidence-backed list of features that users may never discover.

---

## What It Does

- Ingests product documentation and release notes
- Extracts feature mentions with cited evidence
- Scores features on recency, visibility, and documentation density
- Produces actionable adoption risk diagnoses
- Exports reports in plain text and printable HTML

## Design Principles

1. **No magic** -- every diagnosis is explainable with cited evidence
2. **Heuristics first** -- no ML until heuristics prove insufficient
3. **Deterministic** -- same input always produces same output
4. **Transparent** -- users can trace any conclusion back to source

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, paste some release notes, and click "Run Audit."

## Links

- [Source Code](https://github.com/mcp-tool-shop-org/feature-reacher)
- [Architecture](ARCHITECTURE.md)
- [Demo Script](demo-script.md)
