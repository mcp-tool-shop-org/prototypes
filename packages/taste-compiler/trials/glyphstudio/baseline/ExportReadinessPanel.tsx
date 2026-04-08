import { useCallback, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { useLayerStore, useProjectStore, useTimelineStore, useExportStore, useSliceStore } from '@glyphstudio/state';
import { useSpriteEditorStore } from '@glyphstudio/state';
import type { ExportLayout, ExportScope, ExportResult } from '@glyphstudio/domain';

// ── Types ──

type ReadinessLevel = 'ready' | 'warning' | 'blocked';

interface ReadinessCheck {
  id: string;
  label: string;
  level: ReadinessLevel;
  detail: string;
  /** Which section this check belongs to. */
  section: 'canvas' | 'layers' | 'frames' | 'export';
}

interface ExportManifest {
  canvasWidth: number;
  canvasHeight: number;
  totalFrames: number;
  totalLayers: number;
  visibleLayers: number;
  sketchLayers: number;
  hiddenLayers: number;
  emptyFrameIndices: number[];
  sliceCount: number;
  hasPaletteSets: boolean;
  hasVariants: boolean;
  isDirty: boolean;
}

// ── Readiness engine ──

const COMMON_SPRITE_SIZES = [8, 16, 24, 32, 48, 64, 96, 128, 256];
const MAX_REASONABLE_SIZE = 512;

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function isCommonSpriteSize(n: number): boolean {
  return COMMON_SPRITE_SIZES.includes(n);
}

function buildManifest(
  doc: ReturnType<typeof useSpriteEditorStore.getState>['document'],
  layerById: Record<string, { visible: boolean; type: string; opacity: number; name: string }>,
  rootLayerIds: string[],
  frames: { id: string; index: number }[],
  sliceCount: number,
  isDirty: boolean,
): ExportManifest | null {
  if (!doc) return null;

  const layers = rootLayerIds.map((id) => layerById[id]).filter(Boolean);
  const visibleLayers = layers.filter((l) => l.visible && l.type !== 'sketch');
  const sketchLayers = layers.filter((l) => l.type === 'sketch');
  const hiddenLayers = layers.filter((l) => !l.visible && l.type !== 'sketch');

  // Detect empty frames: frames where all visible layers have no pixel data
  // We approximate this from the document's frame list
  const emptyFrameIndices: number[] = [];
  for (const frame of doc.frames) {
    const hasContent = frame.layers.some((l) => {
      const storeLayer = layerById[l.id];
      return storeLayer && storeLayer.visible && storeLayer.type !== 'sketch';
    });
    if (!hasContent && frame.layers.length === 0) {
      emptyFrameIndices.push(frame.index);
    }
  }

  return {
    canvasWidth: doc.width,
    canvasHeight: doc.height,
    totalFrames: doc.frames.length,
    totalLayers: layers.length,
    visibleLayers: visibleLayers.length,
    sketchLayers: sketchLayers.length,
    hiddenLayers: hiddenLayers.length,
    emptyFrameIndices,
    sliceCount,
    hasPaletteSets: (doc.paletteSets ?? []).length > 0,
    hasVariants: (doc.variants ?? []).length > 0,
    isDirty,
  };
}

function runChecks(manifest: ExportManifest): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];

  // ── Canvas checks ──

  if (manifest.canvasWidth > MAX_REASONABLE_SIZE || manifest.canvasHeight > MAX_REASONABLE_SIZE) {
    checks.push({
      id: 'canvas-oversize',
      label: 'Large canvas',
      level: 'warning',
      detail: `${manifest.canvasWidth}\u00d7${manifest.canvasHeight} is larger than typical sprite sizes. Export files will be large.`,
      section: 'canvas',
    });
  }

  if (manifest.canvasWidth !== manifest.canvasHeight) {
    checks.push({
      id: 'canvas-non-square',
      label: 'Non-square canvas',
      level: 'warning',
      detail: `${manifest.canvasWidth}\u00d7${manifest.canvasHeight} \u2014 some game engines expect square sprites.`,
      section: 'canvas',
    });
  }

  if (!isPowerOfTwo(manifest.canvasWidth) || !isPowerOfTwo(manifest.canvasHeight)) {
    if (!isCommonSpriteSize(manifest.canvasWidth) || !isCommonSpriteSize(manifest.canvasHeight)) {
      checks.push({
        id: 'canvas-odd-size',
        label: 'Uncommon dimensions',
        level: 'warning',
        detail: `${manifest.canvasWidth}\u00d7${manifest.canvasHeight} is not a standard sprite size (8, 16, 32, 64, 128, 256).`,
        section: 'canvas',
      });
    }
  }

  // ── Layer checks ──

  if (manifest.totalLayers === 0) {
    checks.push({
      id: 'no-layers',
      label: 'No layers',
      level: 'blocked',
      detail: 'Document has no layers. Nothing to export.',
      section: 'layers',
    });
  }

  if (manifest.visibleLayers === 0 && manifest.totalLayers > 0) {
    checks.push({
      id: 'all-hidden',
      label: 'All layers hidden',
      level: 'blocked',
      detail: 'Every layer is hidden or sketch-only. Export will be blank.',
      section: 'layers',
    });
  }

  if (manifest.sketchLayers > 0) {
    checks.push({
      id: 'sketch-present',
      label: `${manifest.sketchLayers} sketch layer${manifest.sketchLayers > 1 ? 's' : ''}`,
      level: 'warning',
      detail: 'Sketch layers are excluded from export. Make sure final art is on normal layers.',
      section: 'layers',
    });
  }

  if (manifest.hiddenLayers > 0) {
    checks.push({
      id: 'hidden-layers',
      label: `${manifest.hiddenLayers} hidden layer${manifest.hiddenLayers > 1 ? 's' : ''}`,
      level: 'warning',
      detail: 'Hidden layers will not appear in the export. Toggle visibility if they contain needed content.',
      section: 'layers',
    });
  }

  // ── Frame checks ──

  if (manifest.totalFrames === 0) {
    checks.push({
      id: 'no-frames',
      label: 'No frames',
      level: 'blocked',
      detail: 'Document has no frames. Nothing to export.',
      section: 'frames',
    });
  }

  if (manifest.emptyFrameIndices.length > 0) {
    const frameList = manifest.emptyFrameIndices.length <= 5
      ? manifest.emptyFrameIndices.map((i) => `#${i + 1}`).join(', ')
      : `${manifest.emptyFrameIndices.length} frames`;
    checks.push({
      id: 'empty-frames',
      label: 'Empty frames detected',
      level: 'warning',
      detail: `Frame${manifest.emptyFrameIndices.length > 1 ? 's' : ''} ${frameList} appear to have no layer content.`,
      section: 'frames',
    });
  }

  if (manifest.totalFrames === 1) {
    checks.push({
      id: 'single-frame',
      label: 'Single frame',
      level: 'warning',
      detail: 'Only one frame \u2014 sprite sheet export will just be a single tile. Consider exporting as PNG instead.',
      section: 'frames',
    });
  }

  // ── Export checks ──

  if (manifest.isDirty) {
    checks.push({
      id: 'unsaved',
      label: 'Unsaved changes',
      level: 'warning',
      detail: 'Project has unsaved changes. Save before exporting to avoid losing work.',
      section: 'export',
    });
  }

  if (manifest.hasPaletteSets) {
    checks.push({
      id: 'palette-sets',
      label: 'Palette sets available',
      level: 'warning',
      detail: 'This document has palette sets. Use Bundle export to include all color variants.',
      section: 'export',
    });
  }

  if (manifest.hasVariants) {
    checks.push({
      id: 'variants-present',
      label: 'Document variants present',
      level: 'warning',
      detail: 'This document has variants (directions/poses). Use Bundle export to include all variants.',
      section: 'export',
    });
  }

  // If no issues found, add a positive check
  if (checks.length === 0) {
    checks.push({
      id: 'all-clear',
      label: 'Ready to export',
      level: 'ready',
      detail: 'No issues detected. Your sprite is ready for export.',
      section: 'export',
    });
  }

  return checks;
}

// ── Sub-components ──

function ReadinessIndicator({ level }: { level: ReadinessLevel }) {
  const cls = `erpanel-indicator erpanel-indicator-${level}`;
  const symbols: Record<ReadinessLevel, string> = {
    ready: '\u2713',
    warning: '\u26a0',
    blocked: '\u2717',
  };
  return <span className={cls}>{symbols[level]}</span>;
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`erpanel-check-row erpanel-check-${check.level}`}
      data-testid={`export-check-${check.id}`}
    >
      <div className="erpanel-check-header" onClick={() => setExpanded((e) => !e)}>
        <ReadinessIndicator level={check.level} />
        <span className="erpanel-check-label">{check.label}</span>
        <span className={`erpanel-chevron ${expanded ? 'open' : ''}`}>{'\u25b8'}</span>
      </div>
      {expanded && (
        <div className="erpanel-check-detail">{check.detail}</div>
      )}
    </div>
  );
}

function ManifestSummary({ manifest }: { manifest: ExportManifest }) {
  return (
    <div className="erpanel-manifest" data-testid="export-manifest">
      <div className="erpanel-manifest-grid">
        <div className="erpanel-manifest-cell">
          <span className="erpanel-manifest-value">{manifest.canvasWidth}\u00d7{manifest.canvasHeight}</span>
          <span className="erpanel-manifest-label">Canvas</span>
        </div>
        <div className="erpanel-manifest-cell">
          <span className="erpanel-manifest-value">{manifest.totalFrames}</span>
          <span className="erpanel-manifest-label">{manifest.totalFrames === 1 ? 'Frame' : 'Frames'}</span>
        </div>
        <div className="erpanel-manifest-cell">
          <span className="erpanel-manifest-value">{manifest.visibleLayers}</span>
          <span className="erpanel-manifest-label">Visible Layers</span>
        </div>
        <div className="erpanel-manifest-cell">
          <span className="erpanel-manifest-value">{manifest.sliceCount}</span>
          <span className="erpanel-manifest-label">Slices</span>
        </div>
      </div>
      {(manifest.sketchLayers > 0 || manifest.hiddenLayers > 0) && (
        <div className="erpanel-manifest-aside">
          {manifest.sketchLayers > 0 && (
            <span className="erpanel-aside-tag sketch">{manifest.sketchLayers} sketch</span>
          )}
          {manifest.hiddenLayers > 0 && (
            <span className="erpanel-aside-tag hidden">{manifest.hiddenLayers} hidden</span>
          )}
        </div>
      )}
    </div>
  );
}

function QuickExportSection({
  manifest,
  overallLevel,
}: {
  manifest: ExportManifest;
  overallLevel: ReadinessLevel;
}) {
  const [exporting, setExporting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const projectName = useProjectStore((s) => s.name);
  const setReadiness = useExportStore((s) => s.setReadiness);

  // Update the shared export readiness store
  useMemo(() => {
    setReadiness(overallLevel);
  }, [overallLevel, setReadiness]);

  const handleQuickExportPng = useCallback(async () => {
    if (overallLevel === 'blocked') return;
    setExporting(true);
    setLastResult(null);
    try {
      const defaultName = `${projectName || 'sprite'}.png`;
      const filePath = await save({
        title: 'Quick Export \u2014 PNG',
        defaultPath: defaultName,
        filters: [{ name: 'PNG', extensions: ['png'] }],
      });
      if (!filePath) {
        setExporting(false);
        return;
      }
      const scope: ExportScope = { type: 'current_frame' };
      const result = await invoke<ExportResult>('export_sprite_sheet', {
        scope,
        layout: { type: 'horizontal_strip' } as ExportLayout,
        filePath,
        emitManifest: false,
      });
      setLastResult(`Exported to ${filePath}`);
    } catch (err) {
      setLastResult(`Export failed: ${err}`);
    }
    setExporting(false);
  }, [overallLevel, projectName]);

  const handleQuickExportSheet = useCallback(async () => {
    if (overallLevel === 'blocked' || manifest.totalFrames < 2) return;
    setExporting(true);
    setLastResult(null);
    try {
      const defaultName = `${projectName || 'sprite'}_sheet.png`;
      const filePath = await save({
        title: 'Quick Export \u2014 Sprite Sheet',
        defaultPath: defaultName,
        filters: [{ name: 'PNG', extensions: ['png'] }],
      });
      if (!filePath) {
        setExporting(false);
        return;
      }
      const scope: ExportScope = { type: 'all_clips' };
      const layout: ExportLayout = { type: 'horizontal_strip' };
      await invoke<ExportResult>('export_sprite_sheet', {
        scope,
        layout,
        filePath,
        emitManifest: false,
      });
      setLastResult(`Exported to ${filePath}`);
    } catch (err) {
      setLastResult(`Export failed: ${err}`);
    }
    setExporting(false);
  }, [overallLevel, manifest.totalFrames, projectName]);

  return (
    <div className="erpanel-quick-export" data-testid="export-quick-actions">
      <div className="erpanel-section-header">Quick Export</div>
      <div className="erpanel-quick-buttons">
        <button
          className="erpanel-quick-btn"
          onClick={handleQuickExportPng}
          disabled={exporting || overallLevel === 'blocked'}
          data-testid="quick-export-png"
          title="Export current frame as PNG"
        >
          PNG Frame
        </button>
        <button
          className="erpanel-quick-btn"
          onClick={handleQuickExportSheet}
          disabled={exporting || overallLevel === 'blocked' || manifest.totalFrames < 2}
          data-testid="quick-export-sheet"
          title="Export all frames as a horizontal sprite sheet"
        >
          Sprite Sheet
        </button>
      </div>
      {exporting && <span className="erpanel-export-status">Exporting...</span>}
      {lastResult && <span className="erpanel-export-result">{lastResult}</span>}
      {overallLevel === 'blocked' && (
        <span className="erpanel-export-blocked-hint">Fix blocking issues above before exporting.</span>
      )}
    </div>
  );
}

// ── Main panel ──

export function ExportReadinessPanel() {
  const doc = useSpriteEditorStore((s) => s.document);
  const layerById = useLayerStore((s) => s.layerById);
  const rootLayerIds = useLayerStore((s) => s.rootLayerIds);
  const frames = useTimelineStore((s) => s.frames);
  const sliceRegions = useSliceStore((s) => s.sliceRegions);
  const isDirty = useProjectStore((s) => s.isDirty);

  const manifest = useMemo(
    () => buildManifest(doc, layerById, rootLayerIds, frames, sliceRegions.length, isDirty),
    [doc, layerById, rootLayerIds, frames, sliceRegions.length, isDirty],
  );

  const checks = useMemo(() => (manifest ? runChecks(manifest) : []), [manifest]);

  const overallLevel: ReadinessLevel = useMemo(() => {
    if (checks.some((c) => c.level === 'blocked')) return 'blocked';
    if (checks.some((c) => c.level === 'warning')) return 'warning';
    return 'ready';
  }, [checks]);

  // Group checks by section for organized display
  const sections = useMemo(() => {
    const grouped: Record<string, ReadinessCheck[]> = { canvas: [], layers: [], frames: [], export: [] };
    for (const check of checks) {
      (grouped[check.section] ??= []).push(check);
    }
    return grouped;
  }, [checks]);

  const sectionLabels: Record<string, string> = {
    canvas: 'Canvas',
    layers: 'Layers',
    frames: 'Frames',
    export: 'Export',
  };

  if (!doc) {
    return (
      <div className="erpanel" data-testid="export-readiness-panel">
        <span className="erpanel-empty">No document loaded</span>
      </div>
    );
  }

  return (
    <div className="erpanel" data-testid="export-readiness-panel">
      {/* Overall readiness badge */}
      <div className={`erpanel-overall erpanel-overall-${overallLevel}`} data-testid="export-overall-status">
        <ReadinessIndicator level={overallLevel} />
        <span className="erpanel-overall-label">
          {overallLevel === 'ready' && 'Export Ready'}
          {overallLevel === 'warning' && 'Review Before Export'}
          {overallLevel === 'blocked' && 'Export Blocked'}
        </span>
        <span className="erpanel-overall-count">
          {checks.filter((c) => c.level !== 'ready').length} issue{checks.filter((c) => c.level !== 'ready').length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Manifest summary */}
      {manifest && <ManifestSummary manifest={manifest} />}

      {/* Sectioned checks */}
      <div className="erpanel-checks" data-testid="export-checks">
        {(['canvas', 'layers', 'frames', 'export'] as const).map((section) => {
          const sectionChecks = sections[section];
          if (!sectionChecks || sectionChecks.length === 0) return null;
          return (
            <div key={section} className="erpanel-section">
              <div className="erpanel-section-header">{sectionLabels[section]}</div>
              {sectionChecks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Quick export actions */}
      {manifest && (
        <QuickExportSection manifest={manifest} overallLevel={overallLevel} />
      )}
    </div>
  );
}
