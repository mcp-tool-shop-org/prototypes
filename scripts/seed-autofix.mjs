#!/usr/bin/env node
// pnpm seed:autofix
// Applies mechanical fixes based on scripts/review-report.json:
//   1. Remove contradictory language tags (e.g. "typescript" on a Python package)
//   2. Correct technical.programmingLanguages based on detected ecosystem + source scan
//   3. Clear ingest.manualReview on passports that passed every check (no leaked oneLiner,
//      no tautology, no short oneLiner, no contradictions, confidence >= 0.8)
//
// Re-LLM of the broken oneLiners is a separate script (seed-relm.mjs).

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  repoRoot,
  packagesDir,
  loadPassports,
  readJson,
  fmt,
} from './lib.mjs';

const report = readJson(join(repoRoot, 'scripts', 'review-report.json'));

// Build fast lookup sets
const leakedSet = new Set(report.leakedOneLiner.map((r) => r.name));
const tautologicalSet = new Set(report.tautologicalOneLiner.map((r) => r.name));
const shortSet = new Set(report.shortOneLiner.map((r) => r.name));
const contradictoryTagsMap = new Map(report.contradictoryLangTags.map((r) => [r.name, r]));
const contradictoryLangsMap = new Map(report.contradictoryLangs.map((r) => [r.name, r.badLangs]));
const lowConfSet = new Set(report.lowConfidence.map((r) => r.name));

const ECO_TO_LANG = {
  cs: 'C#',
  py: 'Python',
  rs: 'Rust',
  go: 'Go',
  js: 'TypeScript', // fallback for Node/JS ecosystem
};

function detectLangsFromFiles(pkgDir) {
  const skip = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.astro', 'target', 'bin', 'obj', '.git']);
  const counts = {};
  const walk = (d, depth) => {
    if (depth > 3) return;
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      if (skip.has(e)) continue;
      const full = join(d, e);
      let s; try { s = statSync(full); } catch { continue; }
      if (s.isDirectory()) walk(full, depth + 1);
      else if (s.isFile()) {
        const ext = e.slice(e.lastIndexOf('.'));
        const lang = extToLang(ext);
        if (lang) counts[lang] = (counts[lang] || 0) + 1;
      }
    }
  };
  walk(pkgDir, 0);
  return counts;
}
function extToLang(ext) {
  switch (ext) {
    case '.ts': case '.tsx': return 'TypeScript';
    case '.js': case '.jsx': case '.mjs': case '.cjs': return 'JavaScript';
    case '.py': return 'Python';
    case '.rs': return 'Rust';
    case '.cs': return 'C#';
    case '.go': return 'Go';
    case '.java': case '.kt': return 'Java';
    case '.xaml': return 'XAML';
    default: return null;
  }
}

let tagsFixed = 0, langsFixed = 0, cleared = 0, keptFlagged = 0;

for (const { name, passport } of loadPassports()) {
  if (!passport) continue;
  let changed = false;
  const pkgDir = join(packagesDir, name);

  // 1. Fix contradictory tags — remove tags that contradict detected ecosystem
  if (contradictoryTagsMap.has(name)) {
    const badSet = new Set(contradictoryTagsMap.get(name).badTags);
    const before = passport.taxonomy.tags.length;
    passport.taxonomy.tags = passport.taxonomy.tags.filter((t) => !badSet.has(t));
    if (passport.taxonomy.tags.length !== before) {
      tagsFixed++;
      changed = true;
    }
  }

  // 2. Fix technical.programmingLanguages — ground in actual source files
  const eco = contradictoryTagsMap.get(name)?.eco || contradictoryLangsMap.get(name) && 'js' || null;
  const needsLangFix = contradictoryTagsMap.has(name) || contradictoryLangsMap.has(name);
  if (needsLangFix) {
    const fileCounts = detectLangsFromFiles(pkgDir);
    const byCount = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
    if (byCount.length > 0) {
      // Take the top 2 languages by file count, ensuring the ecosystem-implied primary is included
      const ecoLang = ECO_TO_LANG[eco];
      const top = byCount.slice(0, 3).map(([l]) => l);
      const final = [];
      if (ecoLang && !top.includes(ecoLang) && fileCounts[ecoLang]) {
        final.push(ecoLang);
      } else if (ecoLang && !top.includes(ecoLang)) {
        final.push(ecoLang); // eco-implied even if no files sampled (sparse repos)
      }
      for (const l of top) if (!final.includes(l)) final.push(l);
      if (final.length > 0 && JSON.stringify(final.slice(0, 3)) !== JSON.stringify(passport.technical.programmingLanguages)) {
        passport.technical.programmingLanguages = final.slice(0, 3);
        langsFixed++;
        changed = true;
      }
    }
  }

  // 3. Clear manualReview on passports that passed every quality check
  const isClean = !leakedSet.has(name)
    && !tautologicalSet.has(name)
    && !shortSet.has(name)
    && !contradictoryTagsMap.has(name)
    && !contradictoryLangsMap.has(name)
    && !lowConfSet.has(name);

  if (isClean && passport.ingest.manualReview === true) {
    passport.ingest.manualReview = false;
    cleared++;
    changed = true;
  } else if (!isClean) {
    keptFlagged++;
  }

  if (changed) {
    writeFileSync(
      join(packagesDir, name, 'passport.json'),
      JSON.stringify(passport, null, 2) + '\n',
      'utf8'
    );
  }
}

console.log(fmt('cyan', 'Auto-fix summary:'));
console.log(`  ${fmt('green', tagsFixed)} passport(s) had contradictory tags removed`);
console.log(`  ${fmt('green', langsFixed)} passport(s) had programmingLanguages corrected from source scan`);
console.log(`  ${fmt('green', cleared)} passport(s) cleared of manualReview (schema-clean + no contradictions)`);
console.log(`  ${fmt('yellow', keptFlagged)} passport(s) still flagged for manual review`);
