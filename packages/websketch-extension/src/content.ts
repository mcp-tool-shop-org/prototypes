/**
 * Content script - Captures the current page as WebSketch IR
 *
 * Note: This produces a raw DOM capture (RawCapture), not a compiled
 * WebSketchCapture. Compilation to the IR grammar is a separate step.
 */

import { loadSettings } from './settings';

// =============================================================================
// Types
// =============================================================================

interface Message {
  type: string;
  data?: unknown;
}

/** Raw capture produced by the extension (pre-compilation). */
interface RawCapture {
  root: RawNode;
  metadata: {
    url: string;
    title: string;
    timestamp: string;
    schemaVersion: string;
    viewport: { width: number; height: number };
  };
  warnings?: string[];
}

/** Raw DOM node capture. */
interface RawNode {
  type: string;
  id?: string;
  classes?: string[];
  text?: string;
  bounds: DOMRect;
  styles: {
    display: string;
    position: string;
    visibility: string;
  };
  children?: RawNode[];
}

interface CaptureState {
  nodeCount: number;
  warnings: string[];
  maxDepth: number;
  maxNodes: number;
  maxStringLength: number;
}

// =============================================================================
// Message Handler
// =============================================================================

// Listen for capture requests from popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_PAGE') {
    loadSettings()
      .then((limits) => {
        try {
          const capture = capturePage(limits.maxDepth, limits.maxNodes, limits.maxStringLength);
          sendResponse({ success: true, capture });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          sendResponse({ success: false, error: errorMessage });
        }
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        sendResponse({ success: false, error: errorMessage });
      });
    return true; // Keep channel open for async response
  }
});

// =============================================================================
// Capture
// =============================================================================

/**
 * Capture the current page as a raw DOM representation.
 */
function capturePage(maxDepth: number, maxNodes: number, maxStringLength: number): RawCapture {
  const state: CaptureState = { nodeCount: 0, warnings: [], maxDepth, maxNodes, maxStringLength };
  const root = captureElement(document.documentElement, 0, state);

  const capture: RawCapture = {
    root,
    metadata: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      schemaVersion: '0.1',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
  };

  if (state.warnings.length > 0) {
    capture.warnings = state.warnings;
  }

  return capture;
}

/**
 * Recursively capture an element and its children.
 * Respects depth and node count limits.
 */
function captureElement(element: Element, depth: number, state: CaptureState): RawNode {
  state.nodeCount++;

  const computedStyle = window.getComputedStyle(element);

  // Basic element info
  const node: RawNode = {
    type: element.tagName,
    id: element.id || undefined,
    classes: element.className ? element.className.split(' ').filter(Boolean) : undefined,
    text: getTextContent(element, state.maxStringLength),
    bounds: element.getBoundingClientRect(),
    styles: {
      display: computedStyle.display,
      position: computedStyle.position,
      visibility: computedStyle.visibility,
    },
  };

  // Check limits before recursing into children
  if (depth >= state.maxDepth) {
    if (element.children.length > 0) {
      state.warnings.push(
        `Depth limit (${state.maxDepth}) reached at ${element.tagName}#${element.id || '?'} — ${element.children.length} children skipped`,
      );
    }
    return node;
  }

  if (state.nodeCount >= state.maxNodes) {
    if (element.children.length > 0) {
      state.warnings.push(`Node limit (${state.maxNodes}) reached — remaining children skipped`);
    }
    return node;
  }

  // Capture children (indexed loop — HTMLCollection lacks [Symbol.iterator] in ES2022)
  const children: RawNode[] = [];
  for (let i = 0; i < element.children.length; i++) {
    if (state.nodeCount >= state.maxNodes) {
      state.warnings.push(
        `Node limit (${state.maxNodes}) reached — ${element.children.length - children.length} siblings skipped`,
      );
      break;
    }
    const child = element.children[i];
    if (child instanceof Element) {
      children.push(captureElement(child, depth + 1, state));
    }
  }

  if (children.length > 0) {
    node.children = children;
  }

  return node;
}

/**
 * Get direct text content (not including children), truncated to maxStringLength.
 */
function getTextContent(element: Element, maxStringLength: number): string | undefined {
  let text = '';
  for (let i = 0; i < element.childNodes.length; i++) {
    const childNode = element.childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      text += childNode.textContent?.trim() || '';
    }
  }
  if (!text) return undefined;
  if (text.length > maxStringLength) {
    return text.slice(0, maxStringLength);
  }
  return text;
}

console.log('WebSketch content script loaded');
