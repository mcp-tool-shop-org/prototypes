import type { WebSketchCapture, UINode } from '@mcptoolshop/websketch-ir';
import { renderForLLM } from '@mcptoolshop/websketch-ir';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function syntaxHighlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g,
    '<span class="json-key">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g,
    ': <span class="json-string">$1</span>'
  ).replace(
    /:\s*(\d+\.?\d*)/g,
    ': <span class="json-number">$1</span>'
  ).replace(
    /:\s*(true|false)/g,
    ': <span class="json-bool">$1</span>'
  ).replace(
    /:\s*(null)/g,
    ': <span class="json-null">$1</span>'
  );
}

const ROLE_COLORS: Record<string, string> = {
  PAGE: '#6c7086', NAV: '#89b4fa', HEADER: '#89b4fa', FOOTER: '#6c7086',
  SECTION: '#a6adc8', CARD: '#cba6f7', LIST: '#a6e3a1', TABLE: '#a6e3a1',
  MODAL: '#fab387', TOAST: '#fab387', DROPDOWN: '#fab387',
  FORM: '#f9e2af', INPUT: '#f9e2af', BUTTON: '#a6e3a1', LINK: '#89dceb',
  CHECKBOX: '#f9e2af', RADIO: '#f9e2af', ICON: '#cba6f7',
  IMAGE: '#f38ba8', TEXT: '#cdd6f4', PAGINATION: '#89dceb', UNKNOWN: '#585b70',
};

function renderTreeNode(node: UINode, depth: number = 0): string {
  const color = ROLE_COLORS[node.role] ?? '#cdd6f4';
  const bbox = node.bbox.map(v => `${Math.round(v * 100)}%`).join(', ');
  const semantic = node.semantic ? ` <span class="tree-semantic">${escapeHtml(node.semantic)}</span>` : '';
  const textInfo = node.text ? ` <span class="tree-text">[${node.text.kind}:${node.text.len}]</span>` : '';
  const flags: string[] = [];
  if (node.interactive) { flags.push('interactive'); }
  if (node.flags?.sticky) { flags.push('sticky'); }
  if (node.flags?.scrollable) { flags.push('scroll'); }
  const flagStr = flags.length > 0 ? ` <span class="tree-flags">${flags.join(' ')}</span>` : '';

  const hasChildren = node.children && node.children.length > 0;
  const badge = `<span class="role-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${node.role}</span>`;
  const label = `${badge} <span class="tree-bbox">(${bbox})</span>${semantic}${textInfo}${flagStr}`;

  if (!hasChildren) {
    return `<div class="tree-leaf" style="padding-left:${depth * 16}px">${label}</div>`;
  }

  const childrenHtml = node.children!.map(c => renderTreeNode(c, depth + 1)).join('');
  const open = depth < 2 ? ' open' : '';
  return `<details${open} style="padding-left:${depth * 16}px">
    <summary>${label} <span class="tree-count">(${node.children!.length})</span></summary>
    ${childrenHtml}
  </details>`;
}

export function generateHtml(capture: WebSketchCapture, llmTree: string, nonce: string): string {
  const llmContent = escapeHtml(llmTree);
  const asciiContent = escapeHtml(renderForLLM(capture));
  const jsonContent = syntaxHighlightJson(escapeHtml(JSON.stringify(capture, null, 2)));
  const treeContent = renderTreeNode(capture.root);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <style nonce="${nonce}">
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editorGroupHeader-tabsBackground);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .tab {
      padding: 8px 16px;
      cursor: pointer;
      border: none;
      background: none;
      color: var(--vscode-tab-inactiveForeground);
      font-size: 13px;
      font-family: var(--vscode-font-family);
      border-bottom: 2px solid transparent;
    }
    .tab:hover { color: var(--vscode-tab-activeForeground); }
    .tab.active {
      color: var(--vscode-tab-activeForeground);
      border-bottom-color: var(--vscode-focusBorder);
    }
    .tab-content { display: none; padding: 12px; }
    .tab-content.active { display: block; }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 12px;
      background: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .copy-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      font-family: var(--vscode-font-family);
    }
    .copy-btn:hover { background: var(--vscode-button-hoverBackground); }
    pre {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      line-height: 1.5;
      white-space: pre;
      overflow: auto;
      padding: 8px;
    }
    .json-key { color: var(--vscode-symbolIcon-propertyForeground, #9cdcfe); }
    .json-string { color: var(--vscode-symbolIcon-stringForeground, #ce9178); }
    .json-number { color: var(--vscode-symbolIcon-numberForeground, #b5cea8); }
    .json-bool { color: var(--vscode-symbolIcon-booleanForeground, #569cd6); }
    .json-null { color: var(--vscode-symbolIcon-nullForeground, #569cd6); }
    details { cursor: pointer; }
    summary { padding: 3px 0; user-select: none; }
    summary:hover { background: var(--vscode-list-hoverBackground); }
    .tree-leaf { padding: 3px 0; }
    .role-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--vscode-editor-font-family);
    }
    .tree-bbox { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .tree-semantic { color: #cba6f7; font-style: italic; }
    .tree-text { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .tree-flags { color: #fab387; font-size: 10px; }
    .tree-count { color: var(--vscode-descriptionForeground); font-size: 11px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <span>${escapeHtml(capture.url)} — ${capture.viewport.w_px}×${capture.viewport.h_px}</span>
    <span>${new Date(capture.timestamp_ms).toLocaleTimeString()}</span>
  </div>
  <div class="tab-bar">
    <button class="tab active" data-tab="llm">LLM</button>
    <button class="tab" data-tab="ascii">ASCII</button>
    <button class="tab" data-tab="tree">Tree</button>
    <button class="tab" data-tab="json">JSON</button>
  </div>
  <div id="llm" class="tab-content active">
    <div style="text-align:right;padding:4px 8px">
      <button class="copy-btn" data-copy="llm-pre">Copy for LLM</button>
    </div>
    <pre id="llm-pre">${llmContent}</pre>
  </div>
  <div id="ascii" class="tab-content">
    <div style="text-align:right;padding:4px 8px">
      <button class="copy-btn" data-copy="ascii-pre">Copy</button>
    </div>
    <pre id="ascii-pre">${asciiContent}</pre>
  </div>
  <div id="tree" class="tab-content">
    ${treeContent}
  </div>
  <div id="json" class="tab-content">
    <div style="text-align:right;padding:4px 8px">
      <button class="copy-btn" data-copy="json-pre">Copy</button>
    </div>
    <pre id="json-pre">${jsonContent}</pre>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.copy);
        if (target) {
          vscode.postMessage({ type: 'copy', content: target.textContent });
          const origText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = origText; }, 1500);
        }
      });
    });
  </script>
</body>
</html>`;
}
