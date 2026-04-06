---
title: The Grammar
description: The 22 UI roles, annotation symbols, 5-tier classifier, and cleanup passes behind every WebSketch tree.
sidebar:
  order: 2
---

Every WebSketch capture is a tree of nodes annotated with a fixed grammar. This page documents the roles, symbols, classification logic, and cleanup passes that produce the final output.

## The 22 Roles

WebSketch maps every visible element to one of 22 UI primitives. The vocabulary is fixed -- the same roles appear on every website, so LLMs learn them once and apply them everywhere.

### Layout

| Role | Description |
|------|-------------|
| `PAGE` | The root node of every capture. |
| `HEADER` | Top-level banner, typically containing navigation and branding. |
| `FOOTER` | Bottom-level site information, links, and legal text. |
| `SECTION` | A thematic grouping of content. |
| `NAV` | A navigation region containing links. |

### Content

| Role | Description |
|------|-------------|
| `TEXT` | Headings, paragraphs, and other text content. |
| `IMAGE` | Photos, illustrations, and decorative images with meaningful alt text. |
| `ICON` | Small symbolic images (logos, favicons, UI icons). |
| `CARD` | A self-contained content unit, typically with an image, title, and description. |
| `LIST` | An ordered or unordered group of similar items. |
| `TABLE` | Tabular data with rows and columns. |

### Interactive

| Role | Description |
|------|-------------|
| `BUTTON` | A clickable control that triggers an action. |
| `LINK` | A clickable reference that navigates to another page or anchor. |
| `INPUT` | A text field, textarea, or other typeable control. |
| `CHECKBOX` | A toggleable on/off control. |
| `RADIO` | A single-select option within a group. |
| `FORM` | A container grouping related inputs and controls. |

### Overlays

| Role | Description |
|------|-------------|
| `MODAL` | A dialog or lightbox that overlays the page. |
| `TOAST` | A transient notification message. |
| `DROPDOWN` | A collapsible menu or select popover. |

### Navigation

| Role | Description |
|------|-------------|
| `PAGINATION` | Page navigation controls (next, previous, page numbers). |

### Fallback

| Role | Description |
|------|-------------|
| `UNKNOWN` | Elements that could not be classified into any other role. |

## Symbols

Each line in the tree carries dense, machine-parseable annotations:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Visible text
│    │       │         └─ Layout flags
│    │       └─ Semantic hint
│    └─ Interactive (*)
│
└─ Indentation = parent-child hierarchy
```

| Symbol | Meaning | Example |
|--------|---------|---------|
| `*` prefix | The element is interactive -- a user can click, type, or toggle it. | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | An HTML5 or ARIA semantic hint is preserved. | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Layout behavior flags. | `{sticky}`, `{scrollable}` |
| `"label"` | The visible text content of the element. | `"Sign up free"`, `"Search..."` |
| `(N items)` | The number of items in a list. | `LIST (12 items)` |
| Indentation | Nesting depth shows the parent-child hierarchy. | `HEADER > NAV > LIST > LINK` |

## The 5-Tier Classifier

WebSketch does not just dump the DOM. Every visible element passes through a 5-tier classification pipeline:

| Tier | Source | Example |
|------|--------|---------|
| 1. **ARIA role** | Explicit `role="navigation"` attributes. | `NAV` |
| 2. **HTML tag** | Semantic HTML elements like `<button>`, `<h1>`, `<nav>`. | `BUTTON`, `TEXT <h1>` |
| 3. **Class heuristics** | CSS class name patterns like `.card`, `.modal`, `.toast`. | `CARD`, `MODAL`, `TOAST` |
| 4. **Structural analysis** | Repeated sibling patterns (3+ same-role children). | `LIST` |
| 5. **Fallback** | Text-only or unclassifiable elements. | `TEXT`, `SECTION`, `UNKNOWN` |

Higher tiers take priority. If an element has `role="navigation"`, tier 1 wins regardless of its class names or tag.

## Cleanup Passes

After classification, WebSketch runs a series of cleanup passes to minimize noise:

- **Transparent table traversal** -- Intermediate elements like `TR`, `TD`, `TH`, and `LI` are skipped. Their children are promoted to the surface so the tree reflects content, not markup structure.
- **Zero-content pruning** -- Empty, non-interactive, and invisible nodes are dropped entirely.
- **Wrapper collapsing** -- Meaningless single-child `SECTION` wrappers are removed, pulling the child up one level.
- **Cascading prune** -- Hollow wrapper chains (nested containers with no actual content) are eliminated entirely.
- **Label extraction** -- Visible text is pulled from links, buttons, headings, images (alt text), and inputs (placeholder or value) and placed in the `"label"` annotation.

The result is the minimum set of nodes needed to understand the page.

---

[Back to landing page](/websketch-vscode/)
