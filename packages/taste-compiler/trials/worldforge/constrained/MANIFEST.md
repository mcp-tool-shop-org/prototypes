# EntityInspector — Entity Inspector Panel (Constrained)

## What it is

A read-only entity inspector for World Forge's right sidebar. Shows the selected entity's identity, zone context, nearby connections, and validation diagnostics. Does not mutate project state — the only interaction is selecting the parent zone on the canvas, which is a navigation action, not a data mutation.

## Files

| File | Purpose |
|------|---------|
| `EntityInspector.tsx` | React component — read-only inspector using styles.ts primitives |
| `MANIFEST.md` | This file |

## Architecture

### Separation of concerns

- Uses existing style primitives from `styles.ts` (`inspectorShell`, `sectionHeader`, `badgePill`, `cardItem`, `hintText`)
- Validation logic is a pure function (`diagnoseEntity`) — could be extracted to its own file if reused
- No sub-components defined inline — uses `PropRow` for simple property display

### State

- `expanded` — toggle for connections section (read-only UI state)

### Actions

- **Select parent zone** — single navigation button, changes canvas selection, does not mutate entity data

### Stores consumed

- `useProjectStore` — read-only access to `project` (no mutation methods destructured)
- `useEditorStore` — `setSelection` only (canvas navigation, not data mutation)

## Design decisions

1. **Read-only** — inspector shows context, does not edit. Editing stays in the existing property panels (EntityProperties, ZoneProperties) which are the established editing surfaces
2. **Uses styles.ts** — leverages existing `inspectorShell`, `sectionHeader`, `badgePill`, `cardItem` primitives rather than defining new inline styles
3. **All colors via tokens** — `var(--wf-*)` for all color references, `color-mix()` for severity tints
4. **Single action** — "Select parent zone on canvas" is the only button, and it navigates rather than mutates
5. **Canvas-serving** — the inspector exists to give context about what's selected on the canvas, not to replace spatial editing
