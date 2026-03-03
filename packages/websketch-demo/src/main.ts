import './styles.css';
import {
  validateCapture,
  renderAscii,
  type WebSketchCapture,
  type WebSketchValidationIssue,
} from '@mcptoolshop/websketch-ir';
import { renderTree } from './tree';
import { renderCompare } from './compare';

const app = document.getElementById('app');

if (!app) {
  throw new Error('App container not found');
}

// =============================================================================
// Build UI (createElement — XSS-safe, never innerHTML with user data)
// =============================================================================

// Header
const header = document.createElement('header');
const h1 = document.createElement('h1');
h1.textContent = 'WebSketch Demo';
header.appendChild(h1);
const subtitle = document.createElement('p');
subtitle.className = 'subtitle';
subtitle.textContent = 'Interactive visualization of grammar-based UI representation';
header.appendChild(subtitle);
app.appendChild(header);

// Mode toggle
const modeToggle = document.createElement('div');
modeToggle.className = 'mode-toggle';

const singleBtn = document.createElement('button');
singleBtn.textContent = 'Single';
singleBtn.className = 'mode-btn active';

const compareBtn = document.createElement('button');
compareBtn.textContent = 'Compare';
compareBtn.className = 'mode-btn';

modeToggle.appendChild(singleBtn);
modeToggle.appendChild(compareBtn);
app.appendChild(modeToggle);

// Main content area
const main = document.createElement('main');
app.appendChild(main);

// Footer
const footer = document.createElement('footer');
const footerP = document.createElement('p');
footerP.textContent = 'Learn more: ';
const footerLink = document.createElement('a');
footerLink.href = 'https://github.com/mcp-tool-shop-org/websketch-ir';
footerLink.target = '_blank';
footerLink.rel = 'noopener';
footerLink.textContent = 'WebSketch IR on GitHub';
footerP.appendChild(footerLink);
footer.appendChild(footerP);
app.appendChild(footer);

// =============================================================================
// State
// =============================================================================

let mode: 'single' | 'compare' = 'single';

// =============================================================================
// Single Mode
// =============================================================================

function buildSingleMode(): void {
  main.textContent = '';

  const panes = document.createElement('div');
  panes.className = 'three-pane';

  // Input pane
  const inputPane = document.createElement('div');
  inputPane.className = 'pane';
  const inputLabel = document.createElement('h2');
  inputLabel.textContent = 'Input';
  inputPane.appendChild(inputLabel);
  const textarea = document.createElement('textarea');
  textarea.id = 'ir-input';
  textarea.placeholder = '{"version": "0.1", "url": "...", "root": {...}}';
  textarea.rows = 16;
  inputPane.appendChild(textarea);
  const visualizeBtn = document.createElement('button');
  visualizeBtn.textContent = 'Visualize';
  visualizeBtn.id = 'visualize-btn';
  inputPane.appendChild(visualizeBtn);

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export Bundle';
  exportBtn.id = 'export-btn';
  exportBtn.className = 'secondary-btn';
  exportBtn.disabled = true;
  inputPane.appendChild(exportBtn);

  // Issues pane
  const issuesPane = document.createElement('div');
  issuesPane.className = 'pane';
  const issuesLabel = document.createElement('h2');
  issuesLabel.textContent = 'Issues';
  issuesPane.appendChild(issuesLabel);
  const issuesList = document.createElement('div');
  issuesList.id = 'issues-list';
  issuesList.className = 'issues-list';
  issuesPane.appendChild(issuesList);

  // Preview pane
  const previewPane = document.createElement('div');
  previewPane.className = 'pane';
  const previewLabel = document.createElement('h2');
  previewLabel.textContent = 'Preview';
  previewPane.appendChild(previewLabel);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';
  const treeTab = document.createElement('button');
  treeTab.textContent = 'Tree';
  treeTab.className = 'tab-btn active';
  const asciiTab = document.createElement('button');
  asciiTab.textContent = 'ASCII';
  asciiTab.className = 'tab-btn';
  tabBar.appendChild(treeTab);
  tabBar.appendChild(asciiTab);
  previewPane.appendChild(tabBar);

  const previewContent = document.createElement('div');
  previewContent.id = 'preview-content';
  previewContent.className = 'preview-content';
  previewPane.appendChild(previewContent);

  panes.appendChild(inputPane);
  panes.appendChild(issuesPane);
  panes.appendChild(previewPane);
  main.appendChild(panes);

  // State for tree/ascii content
  let treeElement: HTMLElement | null = null;
  let asciiElement: HTMLElement | null = null;
  let activeTab: 'tree' | 'ascii' = 'tree';

  function showTab(tab: 'tree' | 'ascii'): void {
    activeTab = tab;
    treeTab.className = tab === 'tree' ? 'tab-btn active' : 'tab-btn';
    asciiTab.className = tab === 'ascii' ? 'tab-btn active' : 'tab-btn';
    previewContent.textContent = '';
    if (tab === 'tree' && treeElement) {
      previewContent.appendChild(treeElement);
    } else if (tab === 'ascii' && asciiElement) {
      previewContent.appendChild(asciiElement);
    }
  }

  treeTab.addEventListener('click', () => showTab('tree'));
  asciiTab.addEventListener('click', () => showTab('ascii'));

  // Visualize handler
  visualizeBtn.addEventListener('click', () => {
    issuesList.textContent = '';
    previewContent.textContent = '';
    treeElement = null;
    asciiElement = null;

    // Step 1: Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(textarea.value);
    } catch (error) {
      const errDiv = document.createElement('div');
      errDiv.className = 'issue-item error';
      errDiv.textContent = `Invalid JSON: ${(error as Error).message}`;
      issuesList.appendChild(errDiv);
      return;
    }

    // Step 2: Validate
    const issues = validateCapture(data);
    if (issues.length > 0) {
      showIssues(issuesList, issues);
      return;
    }

    // Step 3: Render (validated data)
    const capture = data as WebSketchCapture;

    const okDiv = document.createElement('div');
    okDiv.className = 'issue-item success';
    okDiv.textContent = 'Valid capture — no issues.';
    issuesList.appendChild(okDiv);

    // Surface embedded warnings (e.g. truncation from extension)
    const rawCapture = data as Record<string, unknown>;
    if (Array.isArray(rawCapture.warnings)) {
      for (const w of rawCapture.warnings) {
        const warnDiv = document.createElement('div');
        warnDiv.className = 'issue-item warning';
        warnDiv.textContent = `Warning: ${String(w)}`;
        issuesList.appendChild(warnDiv);
      }
    }

    treeElement = renderTree(capture);
    asciiElement = document.createElement('pre');
    asciiElement.className = 'ascii-output';
    asciiElement.textContent = renderAscii(capture);

    exportBtn.disabled = false;

    showTab(activeTab);
  });

  // Export bundle handler
  exportBtn.addEventListener('click', () => {
    let data: unknown;
    try {
      data = JSON.parse(textarea.value);
    } catch {
      return;
    }
    const bundle = {
      schemaVersion: '0.1',
      createdAt: new Date().toISOString(),
      tool: 'websketch-demo',
      captures: [{ source: 'editor', capture: data }],
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bundle.ws.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// =============================================================================
// Compare Mode
// =============================================================================

function buildCompareMode(): void {
  main.textContent = '';

  const panes = document.createElement('div');
  panes.className = 'compare-pane';

  // Input A
  const inputAPane = document.createElement('div');
  inputAPane.className = 'pane';
  const labelA = document.createElement('h2');
  labelA.textContent = 'Capture A';
  inputAPane.appendChild(labelA);
  const textareaA = document.createElement('textarea');
  textareaA.id = 'input-a';
  textareaA.placeholder = 'Paste first capture JSON...';
  textareaA.rows = 12;
  inputAPane.appendChild(textareaA);

  // Input B
  const inputBPane = document.createElement('div');
  inputBPane.className = 'pane';
  const labelB = document.createElement('h2');
  labelB.textContent = 'Capture B';
  inputBPane.appendChild(labelB);
  const textareaB = document.createElement('textarea');
  textareaB.id = 'input-b';
  textareaB.placeholder = 'Paste second capture JSON...';
  textareaB.rows = 12;
  inputBPane.appendChild(textareaB);

  // Result pane
  const resultPane = document.createElement('div');
  resultPane.className = 'pane';
  const resultLabel = document.createElement('h2');
  resultLabel.textContent = 'Comparison';
  resultPane.appendChild(resultLabel);
  const compareResult = document.createElement('div');
  compareResult.id = 'compare-result';
  resultPane.appendChild(compareResult);

  // Compare button (in a shared row below the two inputs)
  const compareAction = document.createElement('button');
  compareAction.textContent = 'Compare';
  compareAction.id = 'compare-btn';
  inputAPane.appendChild(compareAction);

  panes.appendChild(inputAPane);
  panes.appendChild(inputBPane);
  panes.appendChild(resultPane);
  main.appendChild(panes);

  // Compare handler
  compareAction.addEventListener('click', () => {
    compareResult.textContent = '';

    // Parse + validate A
    let dataA: unknown;
    try {
      dataA = JSON.parse(textareaA.value);
    } catch (error) {
      const errDiv = document.createElement('div');
      errDiv.className = 'issue-item error';
      errDiv.textContent = `Capture A — Invalid JSON: ${(error as Error).message}`;
      compareResult.appendChild(errDiv);
      return;
    }
    const issuesA = validateCapture(dataA);
    if (issuesA.length > 0) {
      const errDiv = document.createElement('div');
      errDiv.className = 'issue-item error';
      errDiv.textContent = `Capture A — ${issuesA.length} validation issue(s)`;
      compareResult.appendChild(errDiv);
      return;
    }

    // Parse + validate B
    let dataB: unknown;
    try {
      dataB = JSON.parse(textareaB.value);
    } catch (error) {
      const errDiv = document.createElement('div');
      errDiv.className = 'issue-item error';
      errDiv.textContent = `Capture B — Invalid JSON: ${(error as Error).message}`;
      compareResult.appendChild(errDiv);
      return;
    }
    const issuesB = validateCapture(dataB);
    if (issuesB.length > 0) {
      const errDiv = document.createElement('div');
      errDiv.className = 'issue-item error';
      errDiv.textContent = `Capture B — ${issuesB.length} validation issue(s)`;
      compareResult.appendChild(errDiv);
      return;
    }

    // Render comparison
    const comparison = renderCompare(dataA as WebSketchCapture, dataB as WebSketchCapture);
    compareResult.appendChild(comparison);
  });
}

// =============================================================================
// Helpers
// =============================================================================

function showIssues(container: HTMLElement, issues: WebSketchValidationIssue[]): void {
  const header = document.createElement('div');
  header.className = 'validation-header';
  header.textContent = `Validation failed (${issues.length} issue${issues.length > 1 ? 's' : ''}):`;
  container.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'validation-issues';
  for (const issue of issues.slice(0, 10)) {
    const li = document.createElement('li');
    li.textContent = `${issue.path}: expected ${issue.expected}, got ${issue.received}`;
    list.appendChild(li);
  }
  container.appendChild(list);

  if (issues.length > 10) {
    const more = document.createElement('div');
    more.className = 'validation-overflow';
    more.textContent = `... and ${issues.length - 10} more issue${issues.length - 10 > 1 ? 's' : ''}`;
    container.appendChild(more);
  }
}

// =============================================================================
// Mode switching
// =============================================================================

function setMode(newMode: 'single' | 'compare'): void {
  mode = newMode;
  singleBtn.className = mode === 'single' ? 'mode-btn active' : 'mode-btn';
  compareBtn.className = mode === 'compare' ? 'mode-btn active' : 'mode-btn';
  if (mode === 'single') {
    buildSingleMode();
  } else {
    buildCompareMode();
  }
}

singleBtn.addEventListener('click', () => setMode('single'));
compareBtn.addEventListener('click', () => setMode('compare'));

// Initialize
buildSingleMode();
