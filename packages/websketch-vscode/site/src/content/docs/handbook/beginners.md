---
title: For Beginners
description: New to WebSketch? Start here for a gentle introduction.
sidebar:
  order: 99
---

New to WebSketch? This guide walks you through every step from installation to pasting your first capture into an LLM prompt.

## What Is This Tool?

WebSketch turns any web page into a compact text tree that describes the page's structure using plain labels like `HEADER`, `NAV`, `BUTTON`, and `TEXT`. Instead of feeding raw HTML (tens of thousands of tokens of nested `div` soup) or a screenshot (which only vision models can read), you get a clean tree of 200--800 tokens that any text model can reason about.

The problem it solves: LLMs struggle with web pages. Raw HTML drowns them in irrelevant markup. Screenshots require vision models and lose interactivity information. Readability extracts strip all structure. WebSketch gives you a middle ground -- a semantic tree that preserves layout, headings, interactive elements, and content hierarchy in a format compact enough for any text model to process.

## Who Is This For?

- **Prompt engineers** who want to include web page context in LLM prompts without blowing their token budget.
- **Developers** who want to generate test plans, scaffold components, or audit accessibility by feeding page structure to an LLM.
- **AI agent builders** who need their agents to understand and reason about web page layouts as part of automated workflows.
- **Anyone using LLMs** who has ever tried pasting raw HTML into a prompt and gotten poor results.

No prior experience with browser automation, DOM inspection, or accessibility trees is needed. If you can use VS Code and paste text into an LLM, you can use WebSketch.

## Prerequisites

Before you begin, make sure you have:

- **VS Code 1.85 or later** -- WebSketch is a VS Code extension and runs inside the editor. Download it from [code.visualstudio.com](https://code.visualstudio.com/) if you do not have it yet.
- **Google Chrome or Microsoft Edge** -- WebSketch uses your existing browser (via `puppeteer-core`) to load pages in headless mode. It does not bundle a browser, so one must be installed on your system.
- **Basic terminal skills** -- You only need to know how to open the VS Code Command Palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS). No command-line usage is required beyond that.

No additional dependencies, accounts, API keys, or configuration files are required.

## Your First 5 Minutes

### Step 1: Install the extension

1. Open VS Code.
2. Open the Extensions sidebar (`Ctrl+Shift+X` on Windows/Linux, `Cmd+Shift+X` on macOS).
3. Search for **WebSketch**.
4. Click **Install** on the result published by `mcp-tool-shop`.

Alternatively, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
ext install mcp-tool-shop.websketch-vscode
```

No restart is needed. The extension activates on first use.

### Step 2: Capture a page

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Type **WebSketch: Capture URL** and select it.
3. Paste a URL into the input box (for example, `https://example.com`) and press Enter.
4. A progress notification appears while WebSketch launches a headless browser, loads the page, walks the DOM, and compiles the semantic tree.
5. When the capture completes, a panel opens beside your editor with four tabs: **LLM**, **ASCII**, **Tree**, and **JSON**.

The **LLM tab** is selected by default. It shows the semantic tree -- the output you will paste into prompts.

### Step 3: Read the tree

Here is what a typical tree looks like:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  └─ *BUTTON "Get Started"
└─ FOOTER
   └─ *LINK "Privacy"
```

Each line follows a consistent pattern:

- **Indentation** shows nesting. `HEADER` is a child of `PAGE`; `*LINK "Home"` is a child of `HEADER`.
- **`*` prefix** means the element is interactive -- a user can click, type, or toggle it.
- **ROLE** (in capitals) is the element type. WebSketch uses 22 fixed roles like `HEADER`, `NAV`, `BUTTON`, `TEXT`, `CARD`, and `LIST`.
- **`<semantic>`** preserves HTML5 or ARIA meaning. `<h1>` means a top-level heading; `<main>` means the primary content region.
- **`{flags}`** show layout behavior. `{sticky}` means the element stays visible while scrolling.
- **`"label"`** is the visible text. `"Home"` is what the user sees on screen.

### Step 4: Copy and paste into an LLM

1. Click the **Copy for LLM** button at the top of the LLM tab.
2. Open your LLM of choice (ChatGPT, Claude, Gemini, or any text model).
3. Paste the tree into your prompt along with your question.

Example prompt:

```
Here is the structure of a web page:

PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  └─ *LINK "Pricing"
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome"
│  └─ *BUTTON "Sign Up"
└─ FOOTER
   └─ *LINK "Terms"

What actions can a user take on this page?
```

The model can reason about the structure, list interactive elements, and answer layout questions -- all without needing raw HTML or a screenshot.

### Step 5: Explore the other views

Besides the LLM tab, the capture panel offers three additional views:

- **ASCII** -- A box-drawing wireframe showing spatial layout. Useful for understanding how elements are positioned on screen.
- **Tree** -- A collapsible node tree with color-coded role badges. Useful for debugging captures and exploring the hierarchy interactively.
- **JSON** -- The full `WebSketchCapture` IR with syntax highlighting. Contains bounding boxes, content hashes, and metadata. Useful for programmatic pipelines or integration with other WebSketch tools.

## Common Mistakes

### 1. Capture fails with "Could not find Chrome or Edge"

WebSketch needs a Chromium-based browser installed on your system. If you use Firefox as your default browser, you still need Chrome or Edge installed. If you have it installed in a non-standard location, set the path manually: open VS Code settings (`Ctrl+,`), search for `websketch.chromePath`, and enter the full path to your Chrome or Edge executable.

### 2. Capture returns an empty or minimal tree

Some sites load content dynamically via JavaScript after the initial page load. Try increasing the `websketch.waitAfterLoad` setting (default is 1000ms). For heavy single-page applications, values of 3000--5000ms often help. You can also increase `websketch.timeout` if the site is slow to respond.

### 3. Pasting the tree into an LLM without context

The tree alone is useful, but you get better results when you pair it with a specific question. Instead of just pasting the tree, add a clear instruction like "List every interactive element" or "Describe the navigation structure" or "What form fields does this page contain?"

### 4. Expecting pixel-perfect layout information

WebSketch captures semantic structure, not visual design. It tells you that a `HEADER` is sticky and contains three links, but it does not tell you the exact pixel coordinates, colors, or font sizes. For visual layout questions, use the ASCII view which shows spatial relationships, or pair the tree with a screenshot for vision-capable models.

### 5. Using the JSON export when you need the LLM tree

The JSON export contains the full IR with bounding boxes, hashes, and metadata -- it is meant for programmatic use. For LLM prompts, always use the LLM tab or the **Copy LLM Tree to Clipboard** command, which gives you the compact tree format.

## Next Steps

Now that you can capture pages and paste trees into prompts, explore the rest of the handbook:

- **[Getting Started](/websketch-vscode/handbook/getting-started/)** -- Deeper coverage of installation, settings, and configuration options.
- **[The Grammar](/websketch-vscode/handbook/grammar/)** -- Learn all 22 roles, symbols, the 5-tier classifier, and the cleanup passes that produce the tree.
- **[Commands](/websketch-vscode/handbook/commands/)** -- All 6 commands, the 4 export views, and practical use cases for prompt engineering, development, and AI agents.
- **[Ecosystem](/websketch-vscode/handbook/ecosystem/)** -- The WebSketch family of tools (CLI, Chrome extension, MCP server) and how they share a common IR.

## Glossary

| Term | Definition |
|------|-----------|
| **Semantic tree** | A hierarchical representation of a web page where each node is labeled with a meaningful UI role (like `HEADER`, `NAV`, `BUTTON`) instead of raw HTML tags. |
| **IR (Intermediate Representation)** | The structured data format (`WebSketchCapture`) that all WebSketch tools produce. It includes the semantic tree, bounding boxes, content hashes, and metadata. |
| **Role** | One of the 22 fixed UI primitives that WebSketch uses to classify every visible element. Examples: `PAGE`, `HEADER`, `BUTTON`, `TEXT`, `CARD`, `LIST`. |
| **Interactive element** | An element a user can click, type into, or toggle. Marked with a `*` prefix in the tree. Links, buttons, inputs, checkboxes, and radio buttons are interactive. |
| **Semantic hint** | Extra meaning preserved from the original HTML or ARIA attributes, shown in angle brackets. For example, `<h1>` indicates a top-level heading, `<main>` indicates the primary content area. |
| **Flag** | A layout behavior annotation shown in curly braces. `{sticky}` means the element stays visible while scrolling; `{scrollable}` means the element has its own scroll area. |
| **Label** | The visible text content of an element, shown in double quotes. For a button, this is the text on the button; for an input, this is the placeholder text. |
| **Puppeteer-core** | A Node.js library that controls Chrome or Edge programmatically. WebSketch uses it to load pages in headless mode without bundling a separate browser. |
| **Headless mode** | Running a browser without a visible window. WebSketch launches Chrome/Edge in headless mode to capture pages in the background. |
| **DOM (Document Object Model)** | The browser's internal tree structure representing a web page. WebSketch walks the DOM and classifies each visible element into a semantic role. |
| **Token** | A unit of text that LLMs process. Fewer tokens means faster, cheaper, and more focused responses. WebSketch reduces a page from 50,000+ HTML tokens to 200--800 semantic tokens. |

---

[Back to landing page](/websketch-vscode/)
