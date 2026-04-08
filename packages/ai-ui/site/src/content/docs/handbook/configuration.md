---
title: Configuration
description: Config file reference — docs, probe, feature aliases, goal rules.
sidebar:
  order: 4
---

## Where config lives

AI-UI reads `ai-ui.config.json` from your project root. Every field is optional — sensible defaults are applied.

## Full example

```json
{
  "docs": {
    "globs": ["README.md", "CHANGELOG.md", "docs/*.md"]
  },
  "probe": {
    "baseUrl": "http://localhost:5173",
    "routes": ["/", "/settings", "/dashboard"]
  },
  "featureAliases": {
    "dark-mode-support": ["Theme", "Dark mode", "Light mode"]
  },
  "goalRules": [
    {
      "id": "settings_open",
      "label": "Open Settings",
      "kind": "domEffect",
      "dom": { "textRegex": "Settings" },
      "score": 2
    },
    {
      "id": "prefs_saved",
      "label": "Save Preferences",
      "kind": "storageWrite",
      "storage": { "keyRegex": "^user\\.prefs\\." },
      "score": 5
    }
  ]
}
```

## Config fields

### docs

Controls which files atlas parses for features.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `globs` | `string[]` | `["README.md", "docs/**/*.md", "HANDBOOK.md", "CHANGELOG.md"]` | Glob patterns for doc files |
| `cliHelp` | `string \| null` | `null` | Path to CLI help output for feature extraction |

Atlas treats every markdown heading as a potential feature. More docs = more features to match against triggers.

### probe

Controls how the browser crawl works.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | `string` | `"http://localhost:4321"` | Dev server URL |
| `routes` | `string[]` | `["/"]` | Routes to crawl |
| `maxDepth` | `number` | `3` | Maximum crawl depth per route |
| `timeout` | `number` | `30000` | Page load timeout in milliseconds |
| `skipLabels` | `string[]` | `["Delete", "Remove", "Destroy", "Reset", "Unsubscribe"]` | Trigger labels to skip during probe |
| `safeOverride` | `string` | `"data-aiui-safe"` | HTML attribute that overrides skip rules |
| `basePath` | `string` | `""` | Base path prefix for routes |
| `goalRoutes` | `string[]` | `[]` | Routes where goal detection is active |

Each route is visited in headless Chromium. Probe records every interactive element it finds — buttons, links, inputs, checkboxes, etc.

**Tip:** Include all top-level routes. Don't include routes that require authentication — probe runs unauthenticated.

### featureAliases

Maps slugified feature names to UI text that might represent them.

```json
{
  "ambient-sound-system-with-42-non-rhythmic-soundscape-tracks": [
    "change", "Audio Settings"
  ]
}
```

When diff can't fuzzy-match a feature name to a trigger, it checks aliases. This is useful when your docs use different language than your UI.

**Key format:** Feature names are slugified (lowercase, hyphens). The key must match the slugified form of a feature from your atlas.

### goalRules

Configurable effect predicates for SPAs where URLs don't change. Goal rules define what "success" looks like when a user interacts with your app.

## Goal rules in depth

### Why goal rules exist

Traditional web apps change the URL when something meaningful happens. SPAs often don't — clicking "Save" writes to localStorage, opening a dialog mutates the DOM, submitting a form fires a POST request. None of these change the URL.

Without goal rules, AI-UI can only detect route-based goals. Goal rules let you define success as observable effects.

### Rule kinds

| Kind | What it matches | Config fields |
|------|----------------|---------------|
| `storageWrite` | localStorage/sessionStorage writes | `storage.keyRegex`, `storage.valueRegex` |
| `fetch` | HTTP requests | `fetch.method[]`, `fetch.urlRegex`, `fetch.status[]` |
| `domEffect` | DOM mutations | `dom.selector`, `dom.textRegex`, `dom.goalId` |
| `composite` | AND of multiple kinds | Combine `storage` + `fetch` + `dom` |

### storageWrite example

Matches when the app writes to localStorage with a key matching the regex:

```json
{
  "id": "audio_change",
  "label": "Change Audio Preference",
  "kind": "storageWrite",
  "storage": { "keyRegex": "^lokey\\.audio\\." },
  "score": 5
}
```

### fetch example

Matches when the app makes a POST request to a URL matching the regex:

```json
{
  "id": "save_profile",
  "label": "Save User Profile",
  "kind": "fetch",
  "fetch": {
    "method": ["POST", "PUT"],
    "urlRegex": "/api/profile"
  },
  "score": 5
}
```

### domEffect example

Matches when a DOM mutation contains text matching the regex:

```json
{
  "id": "settings_open",
  "label": "Open Settings Panel",
  "kind": "domEffect",
  "dom": { "textRegex": "Settings" },
  "score": 2
}
```

You can also use `goalId` to match the `data-aiui-goal` attribute:

```json
{
  "id": "dialog_open",
  "label": "Open Dialog",
  "kind": "domEffect",
  "dom": { "goalId": "settings_dialog" }
}
```

This matches elements with `data-aiui-goal="settings_dialog"` in your HTML.

### composite example

AND logic — all sub-predicates must match:

```json
{
  "id": "settings_saved",
  "label": "Settings Saved",
  "kind": "composite",
  "storage": { "keyRegex": "^app\\.settings\\." },
  "dom": { "textRegex": "saved|updated" },
  "score": 10
}
```

This only fires when both a storage write AND a DOM mutation are observed.

### Scoring

Each rule has a `score` (default: 1). Scores are summed per flow. Higher scores mean more meaningful interactions.

**Scoring guidelines:**
- **1-2:** Low-value actions (opening a menu, hovering)
- **3-5:** Medium-value actions (changing a setting, toggling a feature)
- **5-10:** High-value actions (saving data, completing a flow)

### Unknown vs. not reached

Goal rules require runtime evidence to produce hits. If you haven't run `runtime-effects`, goals remain unevaluated — not "failed," just unknown. The design map shows `(unknown)` suffix for goals without runtime data.

This prevents false positives. No guessing.

## Advanced config sections

Beyond the core fields, `ai-ui.config.json` supports these additional sections. All are optional — defaults work out of the box.

### verify

Controls the `verify` command thresholds.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxOrphanRatio` | `number` | `0.25` | Maximum ratio of orphan features before failing |
| `maxUndocumentedSurfaces` | `number` | `10` | Maximum undocumented UI surfaces before failing |
| `failOnP0Orphans` | `boolean` | `true` | Fail if any P0-priority orphans exist |

### baseline

Controls baseline comparison behavior.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `failOnOrphanIncrease` | `boolean` | `true` | Fail if orphan count increased since baseline |
| `maxUndocumentedIncrease` | `number` | `5` | Maximum increase in undocumented surfaces |
| `warnOnCoverageDecrease` | `boolean` | `true` | Warn if coverage decreased since baseline |

### memory

Controls the decision-tracking memory system.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dir` | `string` | `"ai-ui-memory"` | Directory for memory files |
| `strict` | `boolean` | `false` | Fail if memory files don't parse |

### coverageGate

Controls CI coverage gates.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `minCoveragePercent` | `number` | `0` | Minimum coverage percentage to pass |
| `maxTotalActions` | `number` | `Infinity` | Maximum total recommended actions |
| `maxActionsByType` | `object \| null` | `null` | Per-type action limits |

### runtimeEffects

Controls the `runtime-effects` command.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `routes` | `string[]` | `["/"]` | Routes to exercise |
| `maxTriggersPerRoute` | `number` | `20` | Maximum triggers to click per route |
| `windowMs` | `number` | `2500` | Observation window after each click (ms) |
| `safe.denyLabelRegex` | `string` | `"delete\|remove\|destroy\|reset\|logout\|revoke\|disable\|unsubscribe\|billing"` | Regex for labels to skip |
| `safe.requireSafeAttrForDestructive` | `boolean` | `true` | Require `data-aiui-safe` for denied triggers |

### aiSuggest

Controls the `ai-suggest` command.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | `string` | `"qwen2.5:14b"` | Ollama model for semantic matching |
| `top` | `number` | `5` | Max suggestions per feature |
| `minConfidence` | `number` | `0.55` | Minimum confidence threshold |
| `timeout` | `number` | `60000` | Request timeout (ms) |

### aiEyes

Controls the `ai-eyes` command.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | `string` | `"llava:13b"` | Ollama vision model |
| `timeout` | `number` | `90000` | Request timeout (ms) |
| `maxElements` | `number` | `30` | Maximum elements to analyze |
| `saveScreenshots` | `boolean` | `true` | Save screenshots for visual analysis |

### aiHands

Controls the `ai-hands` command.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | `string` | `"qwen2.5-coder:7b"` | Ollama code model |
| `timeout` | `number` | `120000` | Request timeout (ms) |
| `maxFileSize` | `number` | `50000` | Max file size to process (bytes) |
| `allowExtensions` | `string[]` | `[".tsx", ".jsx", ".vue", ".svelte", ".html", ".ts", ".js", ".css"]` | File extensions to include |

## Danger zone

There are no settings in AI-UI that can hurt production, delete data, or publish anything. The entire tool is read-only analysis.

The closest thing to a dangerous setting is `runtime-effects`, which clicks real buttons in a browser. But it respects safety rules:
- Deny patterns skip destructive-looking triggers
- `data-aiui-safe` overrides for known-safe triggers
- `--dry-run` hovers instead of clicking
