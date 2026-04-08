---
title: Getting Started
description: Install Feature-Reacher, run the dev server, and complete your first adoption risk audit.
sidebar:
  order: 1
---

Get Feature-Reacher running locally and produce your first adoption risk audit in under five minutes.

## Install

```bash
git clone https://github.com/mcp-tool-shop-org/feature-reacher
cd feature-reacher
npm install
```

## Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick test: your first audit

1. **Paste docs** — Copy a chunk of release notes, product documentation, or feature specs into the text editor
2. **Run audit** — Click the "Run Audit" button
3. **Review results** — Expand any flagged feature to see the diagnosis, evidence citations, risk score, and recommended action
4. **Export** — Copy the ranked report as plain text or printable HTML

That's it. No accounts, no API keys, no configuration.

## Project structure

```
feature-reacher/
├── src/
│   ├── app/              # Next.js pages and routing
│   ├── analysis/         # Core audit pipeline
│   │   ├── extractor.ts  # Feature extraction from text
│   │   ├── scoring.ts    # Heuristic risk scoring
│   │   ├── diagnose.ts   # Diagnosis generation
│   │   └── ranking.ts    # Final risk ranking
│   ├── components/       # React UI components
│   └── lib/              # Shared utilities
├── site/                 # Landing page + handbook (you are here)
├── tests/                # Jest test suite
└── package.json
```

## Next steps

- Read [Audit Pipeline](/feature-reacher/handbook/audit-pipeline/) to understand how the 6-step pipeline works
- See [History & Compare](/feature-reacher/handbook/history-compare/) for Phase 2 features
- Check [Reference](/feature-reacher/handbook/reference/) for architecture details and diagnosis types
