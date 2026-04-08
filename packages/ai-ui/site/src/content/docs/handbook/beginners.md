---
title: Beginners
description: New to AI-UI? Start here for a guided walkthrough of concepts, setup, and your first design audit.
sidebar:
  order: 99
---

## What is AI-UI?

AI-UI is a command-line tool that checks whether your app's UI actually lets users reach the features your documentation promises. It does this by parsing your docs, crawling your running app in a real browser, and matching documented features to interactive UI elements.

The core problem it solves: SPAs accumulate features faster than they accumulate navigation paths to those features. Your README might promise "ambient soundscapes" or "dark mode," but if no button leads there, users never find it. AI-UI detects these gaps automatically.

The tool produces a coverage score (percentage of documented features with a discoverable UI entry point), a list of buried features, and actionable recommendations. Optional AI commands extend the pipeline with semantic matching, visual analysis, and code patch generation -- all running locally via Ollama.

## Key concepts

Before diving in, here are the terms you will encounter:

- **Feature** -- a capability your docs claim to have. AI-UI extracts these from your markdown headings and content.
- **Trigger** -- an interactive UI element (button, link, input) that AI-UI discovers by crawling your app in a browser.
- **Coverage** -- the percentage of documented features that have at least one matching trigger in the UI.
- **Must-surface** -- a documented feature with no discoverable UI entry point. This is a gap that needs fixing.
- **Burial index** -- how many clicks deep a feature is from the primary navigation. Higher scores mean harder-to-find features.
- **Goal rule** -- a configurable predicate that detects when a user completed a meaningful action (for SPAs where URLs do not change).
- **Design map** -- the full diagnostic output: surface inventory, feature map, task flows, and IA proposal.

## Prerequisites

You need three things before running AI-UI:

1. **Node.js 20 or later.** Check with `node --version`. AI-UI uses the Node.js native test runner and ES module features that require v20+.

2. **A web app with a dev server.** AI-UI crawls your running app using Playwright's headless Chromium. Your dev server must be accessible at a `localhost` URL (e.g., `http://localhost:5173`).

3. **Documentation in markdown.** AI-UI parses your README.md, CHANGELOG.md, and any files matching your configured glob patterns to extract features. The more complete your docs, the more useful the audit.

For the optional AI commands (ai-suggest, ai-eyes, ai-hands), you also need [Ollama](https://ollama.com) running locally with the required models pulled. These are not needed for the core deterministic pipeline.

## Step-by-step first run

### 1. Clone and install

```bash
git clone https://github.com/mcp-tool-shop-org/ai-ui.git
cd ai-ui
npm install
```

### 2. Create a config file

In **your project's** root directory (not the ai-ui directory), create `ai-ui.config.json`:

```json
{
  "docs": { "globs": ["README.md"] },
  "probe": {
    "baseUrl": "http://localhost:5173",
    "routes": ["/"]
  }
}
```

Adjust `baseUrl` to match your dev server's port, and `routes` to include the pages you want audited.

### 3. Start your dev server

In a separate terminal, start your app:

```bash
npm run dev
```

Make sure it is running and reachable at the configured `baseUrl`.

### 4. Run the basic pipeline

From your project directory:

```bash
ai-ui stage0
```

This runs three commands in sequence:
- **atlas** -- parses your docs into a feature catalog (`ai-ui-output/atlas.json`)
- **probe** -- crawls your UI in headless Chromium and records every interactive element (`ai-ui-output/probe.jsonl`)
- **diff** -- matches features to triggers and computes coverage (`ai-ui-output/diff.json` + `diff.md`)

### 5. Read the results

Open `ai-ui-output/diff.md`. It shows:
- **Matched features** -- documented features that have a discoverable UI trigger
- **Must-surface items** -- documented features with no visible entry point (these are the gaps)
- **Undocumented triggers** -- UI elements not mentioned in your docs
- **Coverage percentage** -- the headline metric

If coverage is 100%, congratulations -- every documented feature is discoverable. If not, the report tells you exactly which features are missing and suggests fixes.

## Common mistakes

**Wrong baseUrl.** The most common first-run failure is pointing AI-UI at the wrong port. Verify your dev server URL matches `probe.baseUrl` in the config. You can test with `curl http://localhost:5173` (or your port).

**Dev server not running.** AI-UI connects to your running app via Playwright. If the dev server is not started, probe will fail with a timeout error. Always start your dev server before running probe or stage0.

**Overly broad doc globs.** If `docs.globs` matches files that are not user-facing documentation (e.g., internal design docs, meeting notes), atlas will extract features from them, inflating your feature count and deflating your coverage score. Only include files that describe user-facing capabilities.

**Expecting AI-UI to redesign your app.** AI-UI measures discoverability and reports gaps. It does not generate new layouts or redesign navigation. The ai-hands command generates code patches for specific improvements, but those are proposals for human review -- never applied automatically.

**Skipping the graph step.** Running `stage0` gives you the basic diff, but the richer analysis (design map, task flows, IA proposals) requires `ai-ui graph` and `ai-ui design-map` to be run after stage0. The full sequence is: `stage0 -> graph -> design-map`.

**Authenticated routes.** Probe runs unauthenticated. Pages behind login will not be crawled. Audit only the public portion of your app, or use a dev mode that bypasses authentication.

## Frequently asked questions (beginners)

**Do I need Ollama to use AI-UI?**
No. The core pipeline (atlas, probe, diff, graph, design-map, verify) is fully deterministic and requires only Node.js and a dev server. Ollama is only needed for the three AI commands: ai-suggest, ai-eyes, and ai-hands.

**Does AI-UI modify my source code?**
Never. AI-UI only reads your docs and crawls your running app. All output goes to the `ai-ui-output/` directory. The ai-hands command generates patch proposals, but they are never applied automatically.

**Does it send data to the internet?**
No. All processing runs locally. The only network activity is Playwright connecting to your `localhost` dev server. The AI commands use local Ollama -- no data leaves your machine.

**Can I use it in CI?**
Yes. Three commands are all you need:

```bash
ai-ui stage0
ai-ui graph
ai-ui verify --strict --gate minimum --min-coverage 60
```

Exit code 0 means pass. No secrets or API keys required.

**What frameworks does it work with?**
Any web framework that serves HTML over a localhost dev server: React, Vue, Svelte, Angular, Astro, Next.js, Nuxt, SvelteKit, or plain HTML. AI-UI sees whatever the browser sees after JavaScript executes.

**What if my feature names don't match my UI labels?**
Use `featureAliases` in your config to map doc feature names to the text that appears in your UI. For example, if your docs say "ambient soundscapes" but your UI button says "Audio Settings," add an alias mapping.

**How do I check my environment before running?**
Run `ai-ui env-check` to verify Node.js version, config file, Playwright installation, and Ollama model availability.

## Next steps

Once you have run your first audit and reviewed the diff report, here is where to go next:

- **Build a full design map.** Run `ai-ui graph` followed by `ai-ui design-map` to get surface inventories, feature discoverability scores, task flows, and an IA proposal. See [Common Tasks](/ai-ui/handbook/usage/) for the recipe.

- **Capture runtime evidence.** For SPAs where URLs do not change, use `ai-ui runtime-effects` to click triggers and observe side effects (storage writes, DOM mutations, fetch calls). Then rebuild the graph with `--with-runtime` for goal-aware analysis.

- **Set up CI gates.** Add `ai-ui verify --strict --gate minimum --min-coverage 60` to your CI pipeline to block PRs that reduce discoverability. See [Operations](/ai-ui/handbook/operations/) for a GitHub Actions example.

- **Try the AI commands.** Install [Ollama](https://ollama.com), pull the required models, and run `ai-ui ai-suggest` for semantic matching, `ai-ui ai-eyes` for visual surface analysis, or `ai-ui ai-hands` for PR-ready code patches. See [Commands](/ai-ui/handbook/commands/) for details.

- **Track changes over time.** Use `ai-ui replay-pack` to snapshot your pipeline artifacts, then `ai-ui replay-diff` to compare snapshots across releases and see what improved or regressed.

- **Read the full reference.** The [Configuration](/ai-ui/handbook/configuration/) page covers every config field including goal rules. The [Architecture](/ai-ui/handbook/architecture/) page explains the mental model and design decisions behind the tool.
