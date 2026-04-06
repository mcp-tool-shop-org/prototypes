/**
 * Integration test — captures a URL and validates the full pipeline.
 * Usage: node test-capture.mjs [url]
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { buildSync } from 'esbuild';
import { assignNodeIds, hashSync, validateCapture, renderForLLM } from '@mcptoolshop/websketch-ir';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error('No Chrome/Edge found');
}

// Build the dom-walker to JS
const walkerBuilt = buildSync({
  entryPoints: ['./src/dom-walker.ts'],
  bundle: false,
  platform: 'node',
  format: 'cjs',
  write: false,
  target: 'es2022',
});
const walkerModule = { exports: {} };
new Function('module', 'exports', walkerBuilt.outputFiles[0].text)(walkerModule, walkerModule.exports);
const walkerScript = walkerModule.exports.getDomWalkerScript();

// Build the LLM tree renderer (bundles dom-walker dependency)
const rendererBuilt = buildSync({
  entryPoints: ['./src/render-llm-tree.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  target: 'es2022',
});
const rendererModule = { exports: {} };
new Function('module', 'exports', rendererBuilt.outputFiles[0].text)(rendererModule, rendererModule.exports);
const renderLlmTree = rendererModule.exports.renderLlmTree;

const url = process.argv[2] || 'https://news.ycombinator.com';
console.log(`Capturing: ${url}`);
console.log(`Browser: ${findChrome()}`);
console.log(`Walker script: ${walkerScript.length} chars`);

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const rawCapture = await page.evaluate(walkerScript);

  console.log('\n--- Raw Capture ---');
  console.log('  URL:', rawCapture.url);
  console.log('  Viewport:', `${rawCapture.viewport.w_px}x${rawCapture.viewport.h_px}`);
  console.log('  Root role:', rawCapture.root.role);
  console.log('  Root children:', rawCapture.root.children?.length ?? 0);

  function countNodes(node) {
    let count = 1;
    if (node.children) for (const c of node.children) count += countNodes(c);
    return count;
  }
  function countLabels(node) {
    let count = node.label ? 1 : 0;
    if (node.children) for (const c of node.children) count += countLabels(c);
    return count;
  }
  console.log('  Total nodes:', countNodes(rawCapture.root));
  console.log('  Nodes with labels:', countLabels(rawCapture.root));

  // --- LLM Tree ---
  const llmTree = renderLlmTree(rawCapture);
  console.log('\n--- LLM Tree (first 50 lines) ---');
  console.log(llmTree.split('\n').slice(0, 50).join('\n'));
  console.log(`... (${llmTree.split('\n').length} total lines)`);

  // --- Compile to IR ---
  const VALID_ROLES = new Set(['PAGE','NAV','HEADER','FOOTER','SECTION','CARD','LIST','TABLE','MODAL','TOAST','DROPDOWN','FORM','INPUT','BUTTON','LINK','CHECKBOX','RADIO','ICON','IMAGE','TEXT','PAGINATION','UNKNOWN']);

  function compileNode(raw) {
    const node = {
      id: raw.id,
      role: VALID_ROLES.has(raw.role) ? raw.role : 'UNKNOWN',
      bbox: raw.bbox.map(v => Math.max(0, Math.min(1, v))),
      interactive: raw.interactive,
      visible: raw.visible,
    };
    if (raw.enabled === false) node.enabled = false;
    if (raw.focusable) node.focusable = true;
    if (raw.semantic) node.semantic = raw.semantic;
    if (raw.text) node.text = raw.text;
    if (raw.flags) node.flags = raw.flags;
    if (raw.z !== undefined) node.z = raw.z;
    if (raw.children?.length > 0) node.children = raw.children.map(compileNode);
    return node;
  }

  const root = compileNode(rawCapture.root);
  assignNodeIds(root);

  const capture = {
    version: '0.1',
    url: rawCapture.url,
    timestamp_ms: rawCapture.timestamp_ms,
    viewport: {
      w_px: rawCapture.viewport.w_px,
      h_px: rawCapture.viewport.h_px,
      aspect: Math.round((rawCapture.viewport.w_px / rawCapture.viewport.h_px) * 100) / 100,
    },
    compiler: {
      name: 'websketch-ir',
      version: '0.1.0',
      options_hash: hashSync('1280x800'),
    },
    root,
  };

  const issues = validateCapture(capture);
  console.log('\n--- Validation ---');
  console.log(issues.length === 0 ? 'PASSED (0 issues)' : `${issues.length} issues:`);
  if (issues.length > 0) {
    issues.slice(0, 10).forEach(i => console.log('  -', i.code, i.message));
  }

  console.log('\nSUCCESS');
} finally {
  await browser.close();
}
