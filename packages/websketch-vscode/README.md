<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## The Problem

You want an LLM to reason about a web page &mdash; its layout, navigation, interactive elements, content hierarchy. Your current options all fall short:

| Approach | Tokens | What you lose |
|----------|--------|---------------|
| **Screenshot** | 1,000+ (vision) | Can't read small text, guesses layout, zero interactivity info |
| **Raw HTML** | 50,000&ndash;500,000 | Drowns in `div` soup, inline styles, scripts, SVG noise |
| **Readability extract** | 2,000&ndash;10,000 | Strips all structure &mdash; no nav, no buttons, no forms |
| **DOM dump** | 10,000&ndash;100,000 | Class names, data attributes, framework artifacts everywhere |

The core issue: **none of these speak the language of UI**. LLMs don't need `<div class="sc-bdnxRM jJFqsI">` &mdash; they need `NAV`, `BUTTON`, `CARD`, `LIST`.

## The Solution

WebSketch captures the page into a **semantic tree** using 22 UI primitives. One click in VS Code, paste into any LLM:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200&ndash;800 tokens.** Not 50,000. Not a pixel grid. A clean tree that any text model can reason about.

### Head-to-Head

| Metric | WebSketch | Raw HTML | Screenshot |
|--------|-----------|----------|------------|
| **Tokens** | 200&ndash;800 | 50,000+ | 1,000+ (vision) |
| **Structure** | Full semantic tree | Nested div chaos | Pixel grid |
| **Text content** | Quoted, labeled | Buried in markup | OCR-dependent |
| **Interactive elements** | Marked with `*` | Hidden in attributes | Invisible |
| **Heading hierarchy** | `<h1>` through `<h6>` | Lost in class names | Guessed from size |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Requires DOM expertise | Not available |
| **Works with** | Any text LLM | Nothing useful | Vision models only |

## Quick Start

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) or run:
   ```
   ext install mcp-tool-shop.websketch-vscode
   ```
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run **WebSketch: Capture URL**
4. Paste a URL and hit Enter
5. Click **Copy for LLM** and paste into your prompt

The LLM tab is the default view. One click copies the tree to your clipboard, ready for any model.

## How It Reads

Every line in the tree is information-dense and machine-parseable:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### The Grammar

| Symbol | Meaning | Example |
|--------|---------|---------|
| `*` prefix | User can interact with it | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | HTML5/ARIA meaning preserved | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Layout behavior | `{sticky}`, `{scrollable}` |
| `"label"` | Visible text content | `"Sign up free"`, `"Search..."` |
| `(N items)` | List item count | `LIST (12 items)` |
| Indentation | Parent-child hierarchy | `HEADER > NAV > LIST > LINK` |

### The 22 Roles

| Category | Roles |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

These 22 roles are a fixed vocabulary &mdash; the same across every website. LLMs learn them once and can reason about any page.

## What Gets Captured

WebSketch doesn't just dump the DOM. It runs a **5-tier classifier** on every visible element:

| Tier | Source | Example |
|------|--------|---------|
| 1. **ARIA role** | `role="navigation"` | &rarr; `NAV` |
| 2. **HTML tag** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TEXT <h1>` |
| 3. **Class heuristics** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **Structural analysis** | 3+ same-role siblings | &rarr; `LIST` |
| 5. **Fallback** | Text-only elements | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

Then it cleans up:

- **Transparent table traversal** &mdash; `TR`/`TD`/`TH`/`LI` are skipped, children promoted to the surface
- **Zero-content pruning** &mdash; empty, non-interactive, invisible nodes dropped
- **Wrapper collapsing** &mdash; meaningless single-child `SECTION` wrappers removed
- **Cascading prune** &mdash; hollow wrapper chains with no content are eliminated entirely
- **Label extraction** &mdash; visible text pulled from links, buttons, headings, images, inputs

The result: a clean tree with the minimum nodes needed to understand the page.

## Use Cases

### For Prompt Engineers

**"Describe this page's layout"** &mdash; Paste the tree. The LLM sees exact structure, headings, and navigation without drowning in HTML. Works with ChatGPT, Claude, Gemini, Llama &mdash; any text model.

**"What can a user do on this page?"** &mdash; Every interactive element is marked with `*`. Links, buttons, inputs, checkboxes &mdash; all labeled with their visible text. The LLM can enumerate every possible user action.

**"Compare these two pages"** &mdash; Two trees side by side. The LLM can diff structure, spot missing elements, compare navigation patterns &mdash; all in a few hundred tokens.

### For Developers

**"Generate a test plan for this UI"** &mdash; The tree maps directly to test targets. `*BUTTON "Submit"`, `*INPUT <email> "Enter email"`, `*LINK "Terms"` &mdash; each is a testable interaction with its visible label.

**"Build something that looks like this"** &mdash; The semantic tree is close to a component hierarchy. `HEADER > NAV > LIST > LINK` maps directly to React/Vue/Svelte components. The LLM can scaffold a matching layout.

**"Audit this page for accessibility"** &mdash; Missing landmarks, unlabeled inputs, heading hierarchy gaps &mdash; all visible in the tree. Semantic hints like `<main>`, `<nav>`, `<search>` show what ARIA roles are present (or absent).

### For AI Agents

**MCP integration** &mdash; Use [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) to give your AI agent the ability to capture and reason about any web page as part of its tool chain.

**Automated monitoring** &mdash; Use [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) to capture pages on a schedule, diff the trees, and detect structural changes.

## Four Views

| Tab | What it shows | Best for |
|-----|---------------|----------|
| **LLM** (default) | Indented semantic tree with labels, semantics, flags | Pasting into LLM prompts |
| **ASCII** | Box-drawing wireframe with spatial layout | Visual layout understanding |
| **Tree** | Collapsible node tree with color-coded role badges | Debugging captures |
| **JSON** | Full `WebSketchCapture` IR with syntax highlighting | Programmatic use and pipelines |

## Commands

| Command | Description |
|---------|-------------|
| `WebSketch: Capture URL` | Prompt for URL, capture, and display |
| `WebSketch: Capture URL from Clipboard` | Capture whatever URL is on your clipboard |
| `WebSketch: Copy LLM Tree to Clipboard` | Copy the tree &mdash; paste straight into ChatGPT, Claude, etc. |
| `WebSketch: Export LLM Tree` | Save as `.md` for prompt libraries or docs |
| `WebSketch: Export Capture as JSON` | Full IR capture with bboxes, hashes, metadata |
| `WebSketch: Export ASCII Wireframe` | Box-drawing layout view |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `websketch.chromePath` | Auto-detect | Path to Chrome or Edge executable |
| `websketch.viewportWidth` | `1280` | Viewport width in pixels |
| `websketch.viewportHeight` | `800` | Viewport height in pixels |
| `websketch.timeout` | `30000` | Navigation timeout (ms) |
| `websketch.waitAfterLoad` | `1000` | Extra wait for JS rendering (ms) |

## Ecosystem

WebSketch is a family of tools built on a shared grammar:

| Package | What it does |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Core IR &mdash; grammar, validation, rendering, diffing, fingerprinting |
| **websketch-vscode** | VS Code extension &mdash; capture pages from your editor (this repo) |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | Command-line capture and rendering |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Chrome extension for in-browser capture |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | MCP server for LLM agent integration |

All tools produce the same `WebSketchCapture` IR, so outputs are interchangeable between pipelines.

## Requirements

- VS Code 1.85+
- Chrome or Edge installed on your system

No bundled browser. No 200MB download. WebSketch uses `puppeteer-core` with whatever browser you already have.

## Security & Data Scope

**Data touched:** URLs entered by the user (navigated via puppeteer-core using local Chrome/Edge in headless mode), captured page content converted to IR tree, exports written to workspace files or clipboard. **Data NOT touched:** no files outside the workspace, no OS credentials, no browser login sessions (headless mode with no profile). **Network:** navigates to user-specified URLs only — no other outbound requests. **No telemetry** is collected or sent.

## License

MIT License &mdash; see [LICENSE](LICENSE) for details.

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
