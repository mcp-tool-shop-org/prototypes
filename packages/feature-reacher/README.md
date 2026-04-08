<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Surface underutilized features before they become technical debt.**

Feature-Reacher analyzes your product artifacts (release notes, documentation, FAQs) and produces an **Adoption Risk Audit**—a ranked, evidence-backed list of features that users may never discover.

---

## What This Is

A diagnostic tool that:
- Ingests product documentation and release notes
- Extracts feature mentions with evidence
- Scores features on recency, visibility, and documentation density
- Produces actionable adoption risk diagnoses

## What This Is NOT

- An analytics platform (no usage data ingestion)
- A feature flag system
- A dashboard connected to your codebase
- Magic AI that guesses what users want

This is **explainable intelligence**—every diagnosis comes with cited evidence and clear reasoning.

---

## What Phase 1 Delivers

- **Artifact Upload**: Paste text or upload .txt/.md files
- **Feature Extraction**: Headings, bullet lists, repeated phrases
- **Scoring Heuristics**: Recency decay, visibility signals, documentation density
- **Diagnosis Engine**: 6 diagnosis types with triggering signals and evidence
- **Ranked Audit**: Features ordered by adoption risk
- **Action Recommendations**: Copyable actions per diagnosis
- **Export**: Plain text and printable HTML reports

## What Phase 2 Adds (Repeatability & Retention)

- **Audit History**: All audits saved to IndexedDB with browse, rename, delete
- **Auto-Save Toggle**: Run audits once, save automatically (or manually)
- **Artifact Sets**: Named collections for repeatable audit workflows
- **Audit Compare**: Side-by-side diff showing new/resolved risks, diagnosis changes
- **Feature Trends**: Sparkline visualization of risk trajectory over time
- **Executive Narrative**: Template-driven summary for partner sharing (no AI)
- **Test Suite**: Jest + ts-jest with guardrail tests

## What Phase 3 Adds (Marketplace-Ready)

- **Public Landing Page**: `/landing` with value props and CTAs
- **Demo Mode**: `/demo` auto-loads sample data for instant experience
- **Legal Pages**: Privacy policy, terms of service, support contact
- **Data Handling Panel**: Transparency about local storage with purge option
- **Onboarding Tour**: 4-step guided tour for new users
- **Methodology Page**: `/methodology` explains scoring (no AI hype)
- **Error Boundaries**: Crash-safe UX with diagnostic export
- **A11y Utilities**: Keyboard navigation, ARIA helpers, screen reader support
- **Marketplace Assets**: Listing copy, PDF docs, submission checklist

## What This Tool Intentionally Does NOT Do

- Connect to analytics platforms
- Integrate with GitHub, Jira, or other tools
- Use ML models for feature detection
- Provide real-time monitoring
- Require authentication or accounts
- Use AI for narrative generation (deterministic templates only)

This is by design. Phase 3 proves marketplace readiness before adding integrations.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick Test

1. Paste some release notes or documentation
2. Click "Run Audit"
3. Review the ranked feature list
4. Expand features to see evidence and recommendations
5. Export the report

### Phase 2 Workflows

**Repeatability Flow:**
1. Run audit → auto-saved to History
2. Go to `/history` to browse saved audits
3. Save artifact collection for repeat runs
4. Compare two audits at `/compare`
5. View trends at `/trends`

**Partner Sharing Flow:**
1. Run audit → click "Export" → "Executive Summary"
2. Or compare two audits → "Export Compare Report"

---

## Project Structure

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### Key Files

- `src/domain/feature.ts` - Canonical Feature model
- `src/domain/diagnosis.ts` - Diagnosis types and severity
- `src/analysis/extractor.ts` - Feature extraction heuristics
- `src/analysis/scoring.ts` - Recency/visibility scoring
- `src/analysis/diagnose.ts` - Diagnosis engine
- `src/analysis/ranking.ts` - Risk ranking and audit generation
- `src/analysis/actions.ts` - Action recommendations
- `src/analysis/export.ts` - Report generation + executive narrative
- `src/analysis/diff.ts` - Audit comparison engine
- `src/analysis/trend.ts` - Feature trend analysis
- `src/storage/types.ts` - Persistence types
- `src/storage/indexeddb.ts` - IndexedDB implementation

---

## Architecture

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### Design Principles

1. **No magic**: Every diagnosis is explainable with cited evidence
2. **Heuristics first**: No ML until heuristics prove insufficient
3. **Deterministic**: Same input always produces same output
4. **Transparent**: Users can trace any conclusion back to source

---

## Security & Data Scope

Feature-Reacher is a **local-first** Next.js web application.

- **Data accessed:** User-pasted text (release notes, documentation), IndexedDB for audit history, localStorage for settings
- **Data NOT accessed:** No external analytics platforms. No external APIs. No authentication. No server-side storage
- **Permissions:** Browser-only. No network calls to external services

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## Running Tests

```bash
npm test
```

Tests verify guardrails: risk scores bounded 0-1, audit IDs formatted correctly, graceful handling of edge cases.

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
