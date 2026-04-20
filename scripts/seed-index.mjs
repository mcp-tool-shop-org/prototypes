#!/usr/bin/env node
// pnpm seed:index
// Reads every packages/*/passport.json, enriches with git metadata and line counts,
// and regenerates:
//   - site/src/data/seeds.json (faceted browser data)
//   - site/src/data/taxonomy.json (copy of root taxonomy for site)
//   - README.md tables (content between <!-- GENERATED:seeds-by-category --> markers)

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  repoRoot,
  packagesDir,
  loadPassports,
  loadTaxonomy,
  gitLastCommitIso,
  countLines,
  detectHealthSignals,
  nowIso,
  fmt,
} from './lib.mjs';

const passports = loadPassports();
const taxonomy = loadTaxonomy();

const enriched = [];
for (const { name, passport } of passports) {
  if (!passport) continue;
  const pkgDir = join(packagesDir, name);
  const lastCommitAt = gitLastCommitIso(pkgDir);
  const lineCount = countLines(pkgDir);
  const { hasTests, hasReadme, hasLicense } = detectHealthSignals(pkgDir);
  const commitRecencyDays = lastCommitAt
    ? Math.max(0, Math.floor((Date.now() - new Date(lastCommitAt).valueOf()) / 86_400_000))
    : null;
  enriched.push({
    ...passport,
    health: {
      lineCount,
      lastCommitAt,
      commitRecencyDays,
      hasTests,
      hasReadme,
      hasLicense,
      buildable: passport.health?.buildable ?? null,
    },
  });
}

enriched.sort((a, b) => a.name.localeCompare(b.name));

// --- Write site data ---
const siteDataDir = join(repoRoot, 'site', 'src', 'data');
mkdirSync(siteDataDir, { recursive: true });

const seedsOut = {
  generatedAt: nowIso(),
  schema: 'mcp-prototypes:seeds-index:1',
  count: enriched.length,
  seeds: enriched,
};
writeFileSync(join(siteDataDir, 'seeds.json'), JSON.stringify(seedsOut, null, 2) + '\n', 'utf8');
writeFileSync(
  join(siteDataDir, 'taxonomy.json'),
  JSON.stringify(taxonomy.raw, null, 2) + '\n',
  'utf8'
);

// --- Regenerate README category tables ---
const readmePath = join(repoRoot, 'README.md');
const START = '<!-- GENERATED:seeds-by-category:start -->';
const END = '<!-- GENERATED:seeds-by-category:end -->';

function buildReadmeSection() {
  const byCategory = new Map();
  const states = new Set();
  for (const seed of enriched) {
    const cat = seed.taxonomy?.category ?? 'uncategorized';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(seed);
    states.add(seed.lifecycle?.state ?? '?');
  }
  // Only show the Lifecycle column when there's actual diversity — otherwise it's noise.
  const showLifecycle = states.size > 1;
  const onlyState = states.size === 1 ? [...states][0] : null;

  const lines = [
    START,
    '',
    '<!-- Regenerate with: pnpm seed:index — do not edit between the markers. -->',
    '',
    `_${enriched.length} seed${enriched.length === 1 ? '' : 's'} across ${byCategory.size} categor${byCategory.size === 1 ? 'y' : 'ies'}${onlyState ? ` — all currently \`${onlyState}\`` : ''} — generated ${nowIso().slice(0, 10)}_`,
    '',
  ];
  for (const cat of taxonomy.categoryList) {
    const seeds = byCategory.get(cat.id);
    if (!seeds || seeds.length === 0) continue;
    lines.push(`### ${cat.label} (${seeds.length})`);
    lines.push('');
    if (showLifecycle) {
      lines.push('| Seed | Lifecycle | One-liner |');
      lines.push('|------|-----------|-----------|');
      for (const s of seeds.sort((a, b) => a.name.localeCompare(b.name))) {
        const state = s.lifecycle?.state ?? '?';
        const one = (s.discovery?.oneLiner ?? s.title ?? '').replace(/\|/g, '\\|');
        lines.push(`| [${s.name}](packages/${s.name}) | ${state} | ${one} |`);
      }
    } else {
      lines.push('| Seed | One-liner |');
      lines.push('|------|-----------|');
      for (const s of seeds.sort((a, b) => a.name.localeCompare(b.name))) {
        const one = (s.discovery?.oneLiner ?? s.title ?? '').replace(/\|/g, '\\|');
        lines.push(`| [${s.name}](packages/${s.name}) | ${one} |`);
      }
    }
    lines.push('');
  }
  lines.push(END);
  return lines.join('\n');
}

if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, 'utf8');
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    console.log(
      fmt(
        'yellow',
        `README.md is missing the ${START} / ${END} markers — README not regenerated. ` +
          'Add the markers around the generated section and re-run.'
      )
    );
  } else if (enriched.length === 0) {
    console.log(
      fmt('gray', 'Skipping README regeneration — 0 passports (pre-Wave-2 state).')
    );
  } else {
    const next =
      readme.slice(0, startIdx) + buildReadmeSection() + readme.slice(endIdx + END.length);
    writeFileSync(readmePath, next, 'utf8');
    console.log(fmt('green', `Updated README.md section (${enriched.length} seeds)`));
  }
}

console.log(fmt('green', `Wrote site/src/data/seeds.json (${enriched.length} seeds)`));
console.log(fmt('green', `Wrote site/src/data/taxonomy.json`));

// --- Generate /llms.txt at repo root (https://llmstxt.org) ---
function buildLlmsTxt() {
  const lines = [
    '# Prototypes — Seed Vault',
    '',
    '> Archived prototypes from the MCP Tool Shop organization. Every seed solved a real problem, proved a concept, or taught us something. Passports carry structured patterns, failure modes, and agent capsules so LLMs can extract reusable tricks without parsing source.',
    '',
    `Generated ${nowIso().slice(0, 10)} — ${enriched.length} seed${enriched.length === 1 ? '' : 's'} cataloged.`,
    '',
  ];
  const byCategory = new Map();
  for (const seed of enriched) {
    const cat = seed.taxonomy?.category ?? 'uncategorized';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(seed);
  }
  for (const cat of taxonomy.categoryList) {
    const seeds = byCategory.get(cat.id);
    if (!seeds || seeds.length === 0) continue;
    lines.push(`## ${cat.label}`);
    lines.push('');
    for (const s of seeds.sort((a, b) => a.name.localeCompare(b.name))) {
      const one = (s.discovery?.oneLiner ?? s.title ?? '').replace(/\n/g, ' ');
      lines.push(
        `- [${s.name}](https://github.com/mcp-tool-shop-org/prototypes/tree/main/packages/${s.name}): ${one}`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

const llmsPath = join(repoRoot, 'llms.txt');
writeFileSync(llmsPath, buildLlmsTxt(), 'utf8');
console.log(fmt('green', `Wrote llms.txt (${enriched.length} seeds)`));
