# Export Readiness Panel -- Baseline Trial

## What this is

A contextual export-readiness review surface for GlyphStudio's editor workspace. It gives users a live dashboard of what will be exported, surfaces obvious issues before they hit the export button, and provides quick-export actions without leaving the editing flow.

## Files created

| File | Purpose |
|------|---------|
| `ExportReadinessPanel.tsx` | React component -- the panel itself |
| `ExportReadinessPanel.css` | All styles, using GlyphStudio CSS variables |
| `MANIFEST.md` | This file |

## Integration into GlyphStudio

### 1. Register the panel in RightDock.tsx

Add the lazy import alongside the other panels:

```tsx
const ExportReadinessPanel = React.lazy(() =>
  import('./ExportReadinessPanel').then((m) => ({ default: m.ExportReadinessPanel }))
);
```

Add to PANEL_REGISTRY:

```tsx
'Readiness': ExportReadinessPanel,
```

### 2. Add the tab to relevant modes in MODE_TABS

The panel belongs in the `edit` and `export` mode tab lists:

```tsx
edit: ['Layers', 'Library', 'Slices', 'Readiness', 'Reference', ...],
export: ['Export Settings', 'Readiness', 'Bundle'],
```

### 3. Import the CSS

In `globals.css` or directly in the component:

```css
@import './ExportReadinessPanel.css';
```

Or append the contents of `ExportReadinessPanel.css` to `layout.css`.

## What it does

### Manifest summary (top section)
A 2x2 grid showing at a glance:
- Canvas dimensions (e.g. 32x32)
- Frame count
- Visible layer count
- Slice count
- Tags for sketch and hidden layers if present

### Readiness checks (middle section)
Grouped by domain (Canvas, Layers, Frames, Export), each check is expandable to show detail. Checks include:

**Canvas checks:**
- Oversize canvas (>512px) -- warning
- Non-square canvas -- warning
- Uncommon dimensions (not 8/16/32/64/128/256) -- warning

**Layer checks:**
- No layers at all -- blocked
- All layers hidden or sketch -- blocked
- Sketch layers present (excluded from export) -- warning
- Hidden layers present -- warning

**Frame checks:**
- No frames -- blocked
- Empty frames (no visible layer content) -- warning
- Single frame (sprite sheet export would be trivial) -- warning

**Export checks:**
- Unsaved changes -- warning
- Palette sets available (should use Bundle export) -- warning
- Document variants present (should use Bundle export) -- warning

### Overall readiness banner
Color-coded banner at the top:
- Green "Export Ready" -- no issues
- Amber "Review Before Export" -- warnings only
- Red "Export Blocked" -- blocking issues exist

### Quick export actions (bottom section)
Two buttons for the most common export operations:
- **PNG Frame** -- exports the current frame as a single PNG
- **Sprite Sheet** -- exports all frames as a horizontal strip

Both are disabled when export is blocked. The sprite sheet button is also disabled for single-frame documents.

Export results (success path or error) display inline.

## Architecture decisions

1. **Pure computation, no new Tauri commands.** The readiness checks run entirely from existing Zustand store data (layerStore, timelineStore, spriteEditorStore, sliceStore, projectStore). No backend round-trips needed for the checks themselves.

2. **Updates the shared exportStore.** The panel writes its computed readiness level into `useExportStore.setReadiness()`, so other parts of the UI (like the TopBar or Export mode) can reflect export readiness without duplicating logic.

3. **Follows existing panel patterns.** Uses the same lazy-loading, Suspense fallback, and dock tab registration pattern as ValidationPanel, BundlePanel, and other right-dock panels.

4. **CSS variables only.** All colors reference GlyphStudio's CSS variable system (`--bg-panel`, `--accent-warning`, etc.) so the panel stays consistent with the rest of the UI. The sketch-layer tag intentionally reuses the `#d4a052` sketch color from the tool rail.

5. **Expandable check rows.** Each check has a clickable header and expandable detail, keeping the panel compact when things are fine but informative when issues exist.

## Stores consumed

- `useSpriteEditorStore` -- document structure (width, height, frames, layers, paletteSets, variants)
- `useLayerStore` -- layer visibility, type, opacity
- `useTimelineStore` -- frame list
- `useSliceStore` -- slice region count
- `useProjectStore` -- dirty state, project name
- `useExportStore` -- writes computed readiness level
