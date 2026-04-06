/**
 * Diagnostic: prints the full node tree from a capture.
 * Usage: node test-tree.mjs [url]
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { buildSync } from 'esbuild';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error('No Chrome/Edge found');
}

const built = buildSync({
  entryPoints: ['./src/dom-walker.ts'],
  bundle: false, platform: 'node', format: 'cjs', write: false, target: 'es2022',
});
const m = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(m, m.exports);
const walkerScript = m.exports.getDomWalkerScript();

const url = process.argv[2] || 'https://news.ycombinator.com';

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const raw = await page.evaluate(walkerScript);

  function printTree(node, depth = 0) {
    const pad = '  '.repeat(depth);
    const kids = node.children?.length ?? 0;
    const text = node.text ? ` [${node.text.kind}:${node.text.len}]` : '';
    const sem = node.semantic ? ` <${node.semantic}>` : '';
    const inter = node.interactive ? ' *' : '';
    const flags = node.flags ? ` {${Object.keys(node.flags).join(',')}}` : '';
    const bbox = node.bbox.map(v => (v * 100).toFixed(0) + '%').join(',');
    console.log(`${pad}${node.role}${text}${sem}${inter}${flags} (${bbox})${kids ? ' [' + kids + ' children]' : ''}`);
    if (node.children) node.children.forEach(c => printTree(c, depth + 1));
  }

  console.log(`\nURL: ${raw.url}`);
  console.log(`Nodes: ${countAll(raw.root)}\n`);
  printTree(raw.root);

  function countAll(n) { let c = 1; if (n.children) n.children.forEach(ch => c += countAll(ch)); return c; }

  // Role distribution
  const roles = {};
  function countRoles(n) { roles[n.role] = (roles[n.role] || 0) + 1; if (n.children) n.children.forEach(countRoles); }
  countRoles(raw.root);
  console.log('\nRole distribution:', roles);
} finally {
  await browser.close();
}
