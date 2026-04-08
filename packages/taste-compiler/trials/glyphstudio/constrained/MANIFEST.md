# Export Readiness Panel — Constrained Trial

## What this builds

An **ExportReadinessPanel** — a contextual right-dock panel that appears in `edit` mode (alongside existing panels) to let users inspect export-relevant details without switching to the Export workspace mode.

The panel provides a read-only summary of the current document's export profile: canvas dimensions, frame count, layer inventory, and a set of practical readiness checks that flag obvious issues before the user commits to an export.

## Files

| File | Purpose |
|------|---------|
| `ExportReadinessPanel.tsx` | React component — right-dock panel |
| `export-readiness.css` | All panel styles using CSS variable tokens |
| `MANIFEST.md` | This file |

## Integration with existing workspace

**Panel registry:** Add to `PANEL_REGISTRY` in `RightDock.tsx`:
```ts
'Export Ready': ExportReadinessPanel,
```

**Mode tabs:** Add `'Export Ready'` to `MODE_TABS.edit` array. This places it in the overflow menu (edit mode already has 15 tabs, well beyond the 6-tab threshold). It does NOT appear in the `export` mode tab set — that mode has its own dedicated `Export Settings` and `Bundle` panels. This keeps export concerns from leaking into or conflicting with the full export flow.

**Data source:** Reads from `useSpriteEditorStore` (document, pixelBuffers) — the same store every other panel uses. No new stores, no new state.

**No mutations:** The panel is entirely read-only. It inspects the document but never modifies it. The distinction between "what you see" and "what would change" is moot — nothing changes. This is made explicit in the panel header copy.

## How each constraint is satisfied

| Constraint | How satisfied |
|------------|---------------|
| Canvas-first | Panel lives in the right dock, same size as all other panels. Canvas area is untouched. |
| Editing explicit/inspectable | Panel is read-only — zero mutations. |
| Mode coherence | Panel appears in `edit` mode only (in overflow). Export mode keeps its own panels. |
| No KPI/dashboard tiles | Summary uses a simple property list, not stat cards or grid tiles. |
| No chat/assistant | No conversational UI, no floating bubbles. |
| No auto-edits | Panel states "Read-only preview" explicitly. Nothing is changed. |
| Preview vs commit explicit | Header says "Preview only — no changes applied." The single action button navigates to Export mode. |
| Max 2 primary actions | One primary action: "Go to Export". One secondary: "Run Checks" (re-scan). |
| All colors via CSS vars | Every color references var(--bg-*), var(--text-*), var(--accent-*), var(--border-*). Zero hex/rgb literals. |
| No dead AI buttons | No AI features in this panel. |
| Copy tone | Uses "considered", "intentional" language. No "blazing fast" etc. |

## Readiness checks implemented

1. **Empty layers** — flags layers with no pixel data (empty buffers or all-transparent)
2. **Single frame** — warns if only one frame exists (may be intentional, but worth surfacing)
3. **Sketch layers visible** — warns if sketch/guide layers are visible (they export by default unless hidden)
4. **Hidden layers** — informs the user which layers are hidden and will be excluded
5. **Large canvas** — warns if canvas exceeds 256x256 (common sprite budget boundary)
6. **No frames** — error if the document has zero frames
7. **Inconsistent frame durations** — warns if frame timings vary (may cause unexpected animation speed)

## Self-Check

- [x] Zero raw hex/rgb color literals — all colors use var(--)
- [x] No dashboard-like grid layouts (no stat cards, KPI tiles)
- [x] Preview/commit distinction is explicit in copy
- [x] Canvas remains visually primary
- [x] Surface supports workspace, doesn't compete with it
- [x] Max 2 primary actions visible
- [x] No forbidden patterns present
