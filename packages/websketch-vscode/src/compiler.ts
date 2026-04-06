import type { WebSketchCapture, UINode, UIRole, BBox01, TextSignal, TextKind } from '@mcptoolshop/websketch-ir';
import { assignNodeIds, hashSync, validateCapture } from '@mcptoolshop/websketch-ir';
import type { RawNode, RawCapture } from './dom-walker';

const VALID_ROLES = new Set<string>([
  'PAGE', 'NAV', 'HEADER', 'FOOTER', 'SECTION', 'CARD', 'LIST', 'TABLE',
  'MODAL', 'TOAST', 'DROPDOWN', 'FORM', 'INPUT', 'BUTTON', 'LINK',
  'CHECKBOX', 'RADIO', 'ICON', 'IMAGE', 'TEXT', 'PAGINATION', 'UNKNOWN',
]);

export function toUIRole(role: string): UIRole {
  return VALID_ROLES.has(role) ? (role as UIRole) : 'UNKNOWN';
}

export function toBBox01(bbox: [number, number, number, number]): BBox01 {
  return [
    Math.max(0, Math.min(1, bbox[0])),
    Math.max(0, Math.min(1, bbox[1])),
    Math.max(0, Math.min(1, bbox[2])),
    Math.max(0, Math.min(1, bbox[3])),
  ] as unknown as BBox01;
}

export function toTextSignal(text: { hash: string; len: number; kind: string }): TextSignal {
  const validKinds = new Set(['none', 'short', 'sentence', 'paragraph', 'mixed']);
  return {
    hash: text.hash,
    len: text.len,
    kind: (validKinds.has(text.kind) ? text.kind : 'short') as TextKind,
  };
}

export function compileNode(raw: RawNode): UINode {
  const node: UINode = {
    id: raw.id,
    role: toUIRole(raw.role),
    bbox: toBBox01(raw.bbox),
    interactive: raw.interactive,
    visible: raw.visible,
  };

  if (raw.enabled === false) { node.enabled = false; }
  if (raw.focusable) { node.focusable = true; }
  if (raw.semantic) { node.semantic = raw.semantic; }
  if (raw.text) { node.text = toTextSignal(raw.text); }
  if (raw.flags) { node.flags = raw.flags; }
  if (raw.z !== undefined) { node.z = raw.z; }

  if (raw.children && raw.children.length > 0) {
    node.children = raw.children.map(compileNode);
  }

  return node;
}

export function compile(raw: RawCapture): WebSketchCapture {
  const root = compileNode(raw.root);

  // Assign content-addressed IDs using the IR library
  assignNodeIds(root);

  const capture: WebSketchCapture = {
    version: '0.1' as const,
    url: raw.url,
    timestamp_ms: raw.timestamp_ms,
    viewport: {
      w_px: raw.viewport.w_px,
      h_px: raw.viewport.h_px,
      aspect: Math.round((raw.viewport.w_px / raw.viewport.h_px) * 100) / 100,
    },
    compiler: {
      name: 'websketch-ir',
      version: '0.1.0',
      options_hash: hashSync(`${raw.viewport.w_px}x${raw.viewport.h_px}`),
    },
    root,
  };

  // Validate the output
  const issues = validateCapture(capture);
  if (issues.length > 0) {
    console.warn('WebSketch validation issues:', issues);
  }

  return capture;
}
