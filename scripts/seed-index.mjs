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
  enriched.push({
    ...passport,
    technical: {
      ...passport.technical,
      lastCommitAt,
      lineCount,
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
  for (const seed of enriched) {
    const cat = seed.taxonomy?.category ?? 'uncategorized';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(seed);
  }
  const lines = [
    START,
    '',
    '<!-- Regenerate with: pnpm seed:index — do not edit between the markers. -->',
    '',
    `_${enriched.length} seed${enriched.length === 1 ? '' : 's'} across ${byCategory.size} categor${byCategory.size === 1 ? 'y' : 'ies'} — generated ${nowIso().slice(0, 10)}_`,
    '',
  ];
  for (const cat of taxonomy.categoryList) {
    const seeds = byCategory.get(cat.id);
    if (!seeds || seeds.length === 0) continue;
    lines.push(`### ${cat.label} (${seeds.length})`);
    lines.push('');
    lines.push('| Seed | Lifecycle | One-liner |');
    lines.push('|------|-----------|-----------|');
    for (const s of seeds.sort((a, b) => a.name.localeCompare(b.name))) {
      const state = s.lifecycle?.state ?? '?';
      const one = (s.discovery?.oneLiner ?? s.title ?? '').replace(/\|/g, '\\|');
      lines.push(`| [${s.name}](packages/${s.name}) | ${state} | ${one} |`);
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
