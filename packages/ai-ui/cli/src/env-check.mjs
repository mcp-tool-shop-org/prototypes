// @ts-check
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Run environment diagnostics and print results.
 * @param {import('./types.mjs').AiUiConfig} config
 */
export function runEnvCheck(config) {
  let passed = 0;
  let warned = 0;

  /** @param {string} msg */
  function ok(msg) { passed++; console.log(`  [OK] ${msg}`); }
  /** @param {string} msg @param {string} fix */
  function warn(msg, fix) { warned++; console.log(`  [WARN] ${msg}`); console.log(`    Fix: ${fix}`); }
  /** @param {string} msg */
  function info(msg) { console.log(`  [INFO] ${msg}`); }

  console.log('ai-ui — Environment Diagnostic\n');

  // 1. Node.js version
  console.log('Runtime:');
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);
  if (major >= 20) {
    ok(`Node.js v${nodeVersion} (>= 20 required)`);
  } else {
    warn(`Node.js v${nodeVersion} — version 20+ is required.`, 'Upgrade Node.js to v20 or later.');
  }

  // 2. Config file
  console.log('\nConfiguration:');
  const configPath = resolve(process.cwd(), 'ai-ui.config.json');
  if (existsSync(configPath)) {
    ok(`Config file found: ai-ui.config.json`);
  } else {
    info('No ai-ui.config.json found — using defaults.');
  }

  // 3. Docs globs
  const docsGlobs = config.docs?.globs || [];
  info(`Docs globs: ${docsGlobs.join(', ') || '(none)'}`);

  // 4. Output directory
  const outputDir = resolve(process.cwd(), 'ai-ui-output');
  if (existsSync(outputDir)) {
    ok('Output directory exists: ai-ui-output/');
  } else {
    info('Output directory ai-ui-output/ will be created on first run.');
  }

  // 5. Memory directory
  console.log('\nMemory:');
  const memoryDir = resolve(process.cwd(), config.memory?.dir || 'ai-ui-memory');
  if (existsSync(memoryDir)) {
    ok(`Memory directory exists: ${config.memory?.dir || 'ai-ui-memory'}/`);
  } else {
    info(`Memory directory not found. Run 'ai-ui init-memory' to create it.`);
  }

  // 6. Probe / base URL
  console.log('\nProbe:');
  const baseUrl = config.probe?.baseUrl || 'http://localhost:4321';
  info(`Base URL: ${baseUrl}`);
  const routes = config.probe?.routes || ['/'];
  info(`Routes: ${routes.join(', ')}`);

  // 7. AI models (Ollama)
  console.log('\nAI Models (Ollama):');
  info(`ai-suggest model: ${config.aiSuggest?.model || 'qwen2.5:14b'}`);
  info(`ai-eyes model: ${config.aiEyes?.model || 'llava:13b'}`);
  info(`ai-hands model: ${config.aiHands?.model || 'qwen2.5-coder:7b'}`);

  // 8. Playwright
  console.log('\nPlaywright:');
  try {
    const pwPath = resolve(process.cwd(), 'node_modules', 'playwright');
    if (existsSync(pwPath)) {
      ok('Playwright is installed.');
    } else {
      warn('Playwright not found in node_modules.', 'Run: npm install playwright');
    }
  } catch {
    warn('Could not check Playwright installation.', 'Run: npm install playwright');
  }

  // Summary
  console.log(`\nSummary: ${passed} passed, ${warned} warnings`);
  if (warned === 0) {
    console.log('Environment looks good for ai-ui.');
  } else {
    console.log('Some issues found — see [WARN] items above.');
  }
}
