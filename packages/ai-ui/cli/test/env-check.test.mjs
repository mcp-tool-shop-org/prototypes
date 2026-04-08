// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// We can't easily capture console.log in node:test, so we test the module imports
// and verify it doesn't throw with a minimal config.

describe('env-check', () => {
  it('module exports runEnvCheck', async () => {
    const mod = await import('../src/env-check.mjs');
    assert.equal(typeof mod.runEnvCheck, 'function');
  });

  it('runs without throwing on minimal config', async () => {
    const { runEnvCheck } = await import('../src/env-check.mjs');
    // Capture console output
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runEnvCheck({
        docs: { globs: ['README.md'], cliHelp: null },
        probe: { baseUrl: 'http://localhost:3000', routes: ['/'], maxDepth: 1, timeout: 5000, skipLabels: [], safeOverride: '', basePath: '', goalRoutes: [] },
        output: {},
        verify: { maxOrphanRatio: 0.25, maxUndocumentedSurfaces: 10, failOnP0Orphans: true },
        baseline: { failOnOrphanIncrease: true, maxUndocumentedIncrease: 5, warnOnCoverageDecrease: true },
        memory: { dir: 'ai-ui-memory', strict: false },
        featureAliases: {},
        mapping: {},
        coverageGate: { minCoveragePercent: 0, maxTotalActions: Infinity, maxActionsByType: null },
        runtimeEffects: { routes: ['/'], maxTriggersPerRoute: 20, windowMs: 2500, safe: { denyLabelRegex: '', requireSafeAttrForDestructive: true, denyHrefRegex: null, denyMethodPatterns: [] } },
        goalRules: [],
        aiSuggest: { model: 'qwen2.5:14b', top: 5, minConfidence: 0.55, timeout: 60000 },
        aiEyes: { model: 'llava:13b', timeout: 90000, maxElements: 30, saveScreenshots: true },
        aiHands: { model: 'qwen2.5-coder:7b', timeout: 120000, maxFileSize: 50000, allowExtensions: ['.tsx'] },
      });
    } finally {
      console.log = origLog;
    }
    assert.ok(logs.length > 0, 'Should produce output');
    assert.ok(logs.some(l => l.includes('Environment Diagnostic')), 'Should include header');
    assert.ok(logs.some(l => l.includes('Node.js')), 'Should check Node version');
    assert.ok(logs.some(l => l.includes('Summary:')), 'Should include summary');
  });

  it('reports Node version correctly', async () => {
    const { runEnvCheck } = await import('../src/env-check.mjs');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runEnvCheck({ docs: { globs: [] }, probe: {}, output: {}, verify: {}, baseline: {}, memory: {}, featureAliases: {}, mapping: {}, coverageGate: {}, runtimeEffects: {}, goalRules: [], aiSuggest: {}, aiEyes: {}, aiHands: {} });
    } finally {
      console.log = origLog;
    }
    const nodeLog = logs.find(l => l.includes('Node.js'));
    assert.ok(nodeLog, 'Should log Node version');
    assert.ok(nodeLog.includes(process.versions.node), 'Should include actual Node version');
  });
});
