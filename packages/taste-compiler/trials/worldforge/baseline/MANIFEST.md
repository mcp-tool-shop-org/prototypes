# EntityInspector — Entity Inspector Panel (Baseline)

## What it is

A detailed entity inspector panel for World Forge's right sidebar that shows selected entity properties, zone context, nearby connections, validation issues, and a full set of entity management actions. It combines informational display with editing capabilities in a single panel.

## Files

| File | Purpose |
|------|---------|
| `EntityInspector.tsx` | React component with inline validation, stat cards, role reassignment, name editing, duplicate, delete |
| `MANIFEST.md` | This file |

## Architecture

### Inline everything

The component contains:
- Role color/icon mapping constants
- Helper functions for zone lookups, connection lookups, zone entity counts
- Validation engine (`validateEntity`) with 3 rules (missing zone, missing name, boss/merchant density)
- `StatCard` sub-component for the dashboard row
- `SeverityBadge` sub-component for issue rendering
- Main `EntityInspector` component with name editing, role reassignment, duplication, deletion

### State

- `editingName` / `nameValue` — inline name editing toggle
- `showConfirmDelete` — two-step delete confirmation
- `selectedRole` — role reassignment state

### Actions

1. **Edit name** — click name to toggle inline edit, Enter to save
2. **Change role** — pill buttons to reassign entity role
3. **Edit position** — number inputs for X/Y coordinates
4. **Duplicate** — creates a copy offset by 20px
5. **Select Zone** — switches selection to the parent zone
6. **Delete Entity** — two-step confirmation, removes entity and clears selection

### Stores consumed

- `useProjectStore` — project data + `updateEntity`, `removeEntity`, `addEntity`
- `useEditorStore` — `setSelection`, `setRightTab`

## Design decisions

1. **Stat dashboard** — 3-card summary row (zone entities, connections, issues) for at-a-glance context
2. **Inline editing** — name and position are directly editable in the inspector
3. **Role pills** — visual role reassignment with color-coded buttons matching the role color scheme
4. **Two-step delete** — requires confirmation click to prevent accidental removal
5. **All inline styles** — uses raw hex values for colors matching the dark theme
