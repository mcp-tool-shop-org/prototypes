import { useCallback, useMemo, useState } from 'react';
import { useSpriteEditorStore } from '@glyphstudio/state';
import type { SpriteDocument, SpriteFrame, SpriteLayer, SpritePixelBuffer } from '@glyphstudio/domain';

// ── Readiness check types ──

type CheckSeverity = 'error' | 'warning' | 'info';

interface ReadinessCheck {
  id: string;
  severity: CheckSeverity;
  message: string;
}

const SEVERITY_ICONS: Record<CheckSeverity, string> = {
  error: '\u2715',   // ✕
  warning: '\u26A0', // ⚠
  info: '\u2139',    // ℹ
};

// ── Check functions ──

function checkNoFrames(doc: SpriteDocument): ReadinessCheck[] {
  if (doc.frames.length === 0) {
    return [{
      id: 'no-frames',
      severity: 'error',
      message: 'Document has no frames — nothing to export.',
    }];
  }
  return [];
}

function checkSingleFrame(doc: SpriteDocument): ReadinessCheck[] {
  if (doc.frames.length === 1) {
    return [{
      id: 'single-frame',
      severity: 'info',
      message: 'Single frame — animation export will produce a static image.',
    }];
  }
  return [];
}

function checkLargeCanvas(doc: SpriteDocument): ReadinessCheck[] {
  if (doc.width > 256 || doc.height > 256) {
    return [{
      id: 'large-canvas',
      severity: 'warning',
      message: `Canvas is ${doc.width}\u00D7${doc.height} — larger than typical sprite budgets (256\u00D7256).`,
    }];
  }
  return [];
}

function checkSketchLayersVisible(doc: SpriteDocument): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  for (const frame of doc.frames) {
    const sketchVisible = frame.layers.filter((l) => l.sketch && l.visible);
    if (sketchVisible.length > 0) {
      const names = sketchVisible.map((l) => l.name).join(', ');
      checks.push({
        id: `sketch-visible-f${frame.index}`,
        severity: 'warning',
        message: `Frame ${frame.index}: sketch layer${sketchVisible.length > 1 ? 's' : ''} visible (${names}) — will be included in export.`,
      });
    }
  }
  return checks;
}

function checkHiddenLayers(doc: SpriteDocument): ReadinessCheck[] {
  // Collect unique hidden layer names across all frames
  const hiddenNames = new Set<string>();
  for (const frame of doc.frames) {
    for (const layer of frame.layers) {
      if (!layer.visible) {
        hiddenNames.add(layer.name);
      }
    }
  }
  if (hiddenNames.size > 0) {
    const names = Array.from(hiddenNames).join(', ');
    return [{
      id: 'hidden-layers',
      severity: 'info',
      message: `${hiddenNames.size} hidden layer${hiddenNames.size > 1 ? 's' : ''} will be excluded: ${names}.`,
    }];
  }
  return [];
}

function checkEmptyLayers(
  doc: SpriteDocument,
  pixelBuffers: Record<string, SpritePixelBuffer>,
): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  for (const frame of doc.frames) {
    for (const layer of frame.layers) {
      if (!layer.visible) continue; // hidden layers are already excluded
      const buf = pixelBuffers[layer.id];
      if (!buf) {
        checks.push({
          id: `empty-${layer.id}`,
          severity: 'warning',
          message: `Frame ${frame.index}, "${layer.name}" — no pixel data. This layer is empty.`,
        });
        continue;
      }
      // Check if all pixels are fully transparent
      let allTransparent = true;
      for (let i = 3; i < buf.data.length; i += 4) {
        if (buf.data[i] !== 0) {
          allTransparent = false;
          break;
        }
      }
      if (allTransparent) {
        checks.push({
          id: `transparent-${layer.id}`,
          severity: 'warning',
          message: `Frame ${frame.index}, "${layer.name}" — all pixels transparent. Consider removing or hiding.`,
        });
      }
    }
  }
  return checks;
}

function checkInconsistentDurations(doc: SpriteDocument): ReadinessCheck[] {
  if (doc.frames.length <= 1) return [];
  const durations = new Set(doc.frames.map((f) => f.durationMs));
  if (durations.size > 1) {
    const values = doc.frames.map((f) => `${f.durationMs}ms`).join(', ');
    return [{
      id: 'inconsistent-durations',
      severity: 'info',
      message: `Frame durations vary (${values}) — animation speed will not be uniform.`,
    }];
  }
  return [];
}

function runAllChecks(
  doc: SpriteDocument,
  pixelBuffers: Record<string, SpritePixelBuffer>,
): ReadinessCheck[] {
  return [
    ...checkNoFrames(doc),
    ...checkLargeCanvas(doc),
    ...checkSketchLayersVisible(doc),
    ...checkEmptyLayers(doc, pixelBuffers),
    ...checkHiddenLayers(doc),
    ...checkSingleFrame(doc),
    ...checkInconsistentDurations(doc),
  ];
}

// ── Severity ordering for stable sort ──

const SEVERITY_ORDER: Record<CheckSeverity, number> = { error: 0, warning: 1, info: 2 };

// ── Component ──

interface ExportReadinessPanelProps {
  /** Callback to switch workspace mode to 'export'. */
  onGoToExport?: () => void;
}

export function ExportReadinessPanel({ onGoToExport }: ExportReadinessPanelProps) {
  const doc = useSpriteEditorStore((s) => s.document);
  const pixelBuffers = useSpriteEditorStore((s) => s.pixelBuffers);

  const [checks, setChecks] = useState<ReadinessCheck[] | null>(null);

  const handleRunChecks = useCallback(() => {
    if (!doc) return;
    const results = runAllChecks(doc, pixelBuffers);
    results.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    setChecks(results);
  }, [doc, pixelBuffers]);

  // Current frame's layer inventory (frame 0 as representative)
  const currentFrame: SpriteFrame | null = doc?.frames[0] ?? null;

  // Document summary values
  const canvasSize = doc ? `${doc.width}\u00D7${doc.height}` : '\u2014';
  const frameCount = doc?.frames.length ?? 0;
  const variantCount = doc?.variants?.length ?? 0;
  const paletteSetCount = doc?.paletteSets?.length ?? 0;

  // Layers from frame 0 as representative
  const layers = currentFrame?.layers ?? [];

  if (!doc) {
    return (
      <div className="export-readiness-panel" data-testid="export-readiness-panel">
        <span className="export-readiness-empty">No document loaded</span>
      </div>
    );
  }

  const errorCount = checks?.filter((c) => c.severity === 'error').length ?? 0;
  const warningCount = checks?.filter((c) => c.severity === 'warning').length ?? 0;

  return (
    <div className="export-readiness-panel" data-testid="export-readiness-panel">
      {/* Header */}
      <div className="export-readiness-header">
        <span className="export-readiness-title">Export Readiness</span>
        <span className="export-readiness-subtitle">
          Preview only — no changes applied
        </span>
      </div>

      {/* Document summary */}
      <div className="export-readiness-summary" data-testid="export-readiness-summary">
        <div className="export-readiness-prop">
          <span className="export-readiness-prop-label">Canvas</span>
          <span className="export-readiness-prop-value">{canvasSize}</span>
        </div>
        <div className="export-readiness-prop">
          <span className="export-readiness-prop-label">Frames</span>
          <span className="export-readiness-prop-value">{frameCount}</span>
        </div>
        {frameCount > 0 && (
          <div className="export-readiness-prop">
            <span className="export-readiness-prop-label">Duration</span>
            <span className="export-readiness-prop-value">
              {doc.frames.reduce((sum, f) => sum + f.durationMs, 0)}ms total
            </span>
          </div>
        )}
        {variantCount > 0 && (
          <div className="export-readiness-prop">
            <span className="export-readiness-prop-label">Variants</span>
            <span className="export-readiness-prop-value">{variantCount}</span>
          </div>
        )}
        {paletteSetCount > 0 && (
          <div className="export-readiness-prop">
            <span className="export-readiness-prop-label">Palette sets</span>
            <span className="export-readiness-prop-value">{paletteSetCount}</span>
          </div>
        )}
      </div>

      {/* Layer inventory */}
      {layers.length > 0 && (
        <div className="export-readiness-layers-section">
          <span className="export-readiness-layers-title">
            Layers (frame 0)
          </span>
          {layers.map((layer) => (
            <div key={layer.id} className="export-readiness-layer-row">
              <span className="export-readiness-layer-name">{layer.name}</span>
              {layer.sketch && (
                <span className="export-readiness-layer-badge badge-sketch">sketch</span>
              )}
              {layer.visible ? (
                <span className="export-readiness-layer-badge badge-visible">visible</span>
              ) : (
                <span className="export-readiness-layer-badge badge-hidden">hidden</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Readiness checks */}
      <div className="export-readiness-checks-header">
        <span className="export-readiness-checks-title">Readiness Checks</span>
        <button
          className="export-readiness-run-btn"
          onClick={handleRunChecks}
          data-testid="export-readiness-run"
        >
          {checks === null ? 'Run Checks' : 'Re-check'}
        </button>
      </div>

      {checks === null && (
        <span className="export-readiness-checks-empty">
          Run checks to inspect for common export issues.
        </span>
      )}

      {checks !== null && checks.length === 0 && (
        <div className="export-readiness-all-clear" data-testid="export-readiness-clear">
          {'\u2713'} No issues found — ready to export.
        </div>
      )}

      {checks !== null && checks.length > 0 && (
        <div className="export-readiness-checks-list" data-testid="export-readiness-checks">
          {checks.map((check) => (
            <div key={check.id} className="export-readiness-check-row">
              <span className={`export-readiness-check-icon severity-${check.severity}`}>
                {SEVERITY_ICONS[check.severity]}
              </span>
              <span className="export-readiness-check-message">{check.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Primary action */}
      <div className="export-readiness-actions">
        <button
          className="export-readiness-go-btn"
          onClick={onGoToExport}
          disabled={!onGoToExport || errorCount > 0}
          data-testid="export-readiness-go"
          title={errorCount > 0 ? 'Resolve errors before exporting' : 'Switch to Export mode'}
        >
          {errorCount > 0
            ? `${errorCount} error${errorCount !== 1 ? 's' : ''} — resolve before export`
            : 'Go to Export'}
        </button>
      </div>
    </div>
  );
}
