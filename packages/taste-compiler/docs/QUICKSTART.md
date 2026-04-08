# Taste Compiler — External Pilot Quickstart

Get a Taste Pack running on your repo in 15 minutes.

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- A React/TSX codebase with a clear product identity

## Step 1: Clone and install

```bash
git clone https://github.com/mcp-tool-shop-org/taste-compiler.git
cd taste-compiler
pnpm install
pnpm build
```

## Step 2: Initialize a taste workspace in your repo

```bash
cd /path/to/your/repo
npx /path/to/taste-compiler/packages/cli/dist/bin.js init
```

This creates:

```
taste/
  source/
    product.yaml        # Product name, summary, identity statement
    principles.yaml     # 3-5 design principles
    anti-examples.yaml  # 3-5 things your product must NOT become
    flows.yaml          # 1-3 golden user paths
    budgets.yaml        # Complexity limits
  pack/                 # Compiled output goes here
  goldens/              # Golden flow baselines go here
```

## Step 3: Author your taste source

### product.yaml

```yaml
name: "Your Product"
summary: "One sentence about what this product is and who it's for."
identity: "This is a [type] tool that feels [adjective], not [anti-adjective]."
```

### principles.yaml

Write 3-5 principles. Each needs a statement and rationale.

```yaml
- id: focused-not-feature-rich
  statement: "Every screen has one job. No multi-purpose dashboards."
  rationale: "Feature density signals enterprise; we serve individual makers."

- id: tools-not-assistants
  statement: "The product is a tool, not a personality."
  rationale: "Users trust deterministic tools more than opinionated assistants."
```

### anti-examples.yaml

What your product must never become. Be specific.

```yaml
- id: enterprise-dashboard
  uri: "ref://generic-saas-dashboard"
  reason: "Too many panels, too many stats, too many actions per screen."

- id: chatbot-as-ui
  uri: "ref://chat-interface-primary"
  reason: "Chat is a communication pattern, not a product pattern."
```

### budgets.yaml

```yaml
maxTopLevelNavItems: 5
maxPrimaryActionsPerScreen: 2
maxModalDepth: 2
maxDistinctInteractionModesPerFlow: 3
```

### flows.yaml (golden paths)

```yaml
- id: core-creation-flow
  name: "Create and save a new item"
  steps:
    - route: "/new"
      purpose: "Blank canvas for new item"
    - route: "/edit/:id"
      purpose: "Active editing with auto-save"
    - route: "/items"
      purpose: "Confirmation: item appears in list"
  invariants:
    - "New item is never lost between steps"
    - "Edit screen does not show unrelated items"
    - "List reflects the save immediately"
```

## Step 4: Compile

```bash
npx taste-compiler compile --dir taste/source --out taste/pack
```

This produces `taste/pack/taste-pack.json` — your compiled Taste Pack.

## Step 5: Check your codebase

```bash
npx taste-compiler check --pack taste/pack/taste-pack.json --dir src/
```

Output: JSON or markdown report showing violations by rule class, with file evidence, rationale, and suggested fixes.

## Step 6: Run a paired trial

1. **Baseline:** Ask your AI tool to build a feature with no taste constraints
2. **Constrained:** Ask the same AI tool to build the same feature, but include the Taste Pack summary in the prompt + use plan-first + diff-first workflow
3. **Score both** using the scorecard template (`docs/PILOT-SCORECARD.md`)

## What to look for

- **Tokens (TOK):** Raw hex colors, off-scale spacing in inline styles
- **Grammar (GRAM):** Banned component imports, too many primary actions
- **Laws (LAW):** Delete buttons without confirmation, forms submitting without validation, empty states with no CTA
- **Copy (COPY):** "AI-powered" without qualifier, "blazing fast", first-person assistant voice
- **Budgets (BUD):** Too many nav items, too many actions per screen, deep modal stacking
- **Forbidden (FP):** Patterns you explicitly banned (dashboard grids, chat overlays, etc.)
- **Goldens:** Routes missing from golden paths, invariants violated

## Reporting

Fill out `docs/PILOT-SCORECARD.md` for each repo you pilot. The most valuable feedback is:

1. **False positives** that erode trust
2. **Missed drift** that should have been caught
3. **Pack authoring pain** that makes the tool not worth the effort
4. Whether you would keep using it on real work
