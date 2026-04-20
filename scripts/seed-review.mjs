#!/usr/bin/env node
// pnpm seed:review
// Detects quality issues across all passports and emits a structured report
// distinguishing mechanical (auto-fixable) from semantic (human-judgment) issues.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  repoRoot,
  packagesDir,
  loadPassports,
  fmt,
} from './lib.mjs';

const LEAK_PATTERNS = [
  { re: /ecosystem package/i, label: 'prompt-hint leak' },
  { re: /\.(?:ts|js|mjs|cjs|py|rs|cs)\s*=\s*\d/i, label: 'file-count leak' },
  { re: /package\.json (?:present|indicating)/i, label: 'prompt-hint leak' },
  { re: /^go to https?:\/\//i, label: 'readme-fragment leak' },
  { re: /^read the readme/i, label: 'readme-fragment leak' },
  { re: /^yes,\b/i, label: 'q-and-a fragment' },
  { re: /^true,/i, label: 'json-fragment leak' },
  { re: /^\.\w+=/, label: 'file-count leak' },
];

const TAUTOLOGICAL_PATTERNS = [
  // "A ... CLI for the 'X' ..." where X matches the slug
  (slug, s) => new RegExp(`for the ['"\`]?${escapeRe(slug)}['"\`]?`, 'i').test(s),
  // "CLI tool for the X developer tool" type self-reference
  (slug, s) => {
    const tokens = slug.split(/[-_]/).filter(Boolean);
    const words = tokens.length;
    if (words < 2) return false;
    const slugRegex = tokens.map(escapeRe).join('[-_\\s]');
    return new RegExp(`\\b${slugRegex}\\b.{0,40}(?:tool|library|cli|package)`, 'i').test(s);
  },
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Heuristic: if package.json exists and declares deps/type, primary language is TS/JS.
// Flag tags that contradict (python/rust/go/csharp).
const CONTRADICTORY_LANG_TAGS = {
  js: ['python', 'rust', 'go', 'csharp'],
  ts: ['python', 'rust', 'go', 'csharp'],
  py: ['typescript', 'javascript', 'csharp', 'rust', 'go'],
  rs: ['typescript', 'javascript', 'python', 'csharp', 'go'],
  cs: ['typescript', 'javascript', 'python', 'rust', 'go'],
};

function detectPrimaryEcosystem(slug) {
  const pkgDir = join(packagesDir, slug);
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (existsSync(pkgJsonPath)) return 'js'; // Node/TS
  try {
    const entries = readdirSync(pkgDir);
    if (entries.some((e) => e.endsWith('.csproj') || e.endsWith('.sln'))) return 'cs';
    if (entries.includes('Cargo.toml')) return 'rs';
    if (entries.includes('pyproject.toml') || entries.includes('setup.py')) return 'py';
    if (entries.includes('go.mod')) return 'go';
  } catch { /* ignore */ }
  return 'unknown';
}

const issues = {
  leakedOneLiner: [],
  tautologicalOneLiner: [],
  contradictoryLangTags: [],
  contradictoryLangs: [],
  shortOneLiner: [],
  missingPatterns: [],
  lowConfidence: [],
};

const passports = loadPassports();

for (const { name, passport } of passports) {
  if (!passport) continue;
  const one = passport.discovery?.oneLiner || '';
  const desc = passport.description || '';
  const tags = passport.taxonomy?.tags || [];
  const langs = (passport.technical?.programmingLanguages || []).map((l) => l.toLowerCase());
  const eco = detectPrimaryEcosystem(name);

  // Leak patterns
  for (const { re, label } of LEAK_PATTERNS) {
    if (re.test(one) || re.test(desc)) {
      issues.leakedOneLiner.push({ name, label, oneLiner: one });
      break;
    }
  }

  // Tautology
  for (const fn of TAUTOLOGICAL_PATTERNS) {
    if (fn(name, one)) {
      issues.tautologicalOneLiner.push({ name, oneLiner: one });
      break;
    }
  }

  // Short / vague (< 20 chars of real content)
  if (one.trim().length < 25 && one.length > 0) {
    issues.shortOneLiner.push({ name, oneLiner: one });
  }

  // Contradictory tags
  if (eco !== 'unknown' && CONTRADICTORY_LANG_TAGS[eco]) {
    const bad = tags.filter((t) => CONTRADICTORY_LANG_TAGS[eco].includes(t));
    if (bad.length) issues.contradictoryLangTags.push({ name, eco, badTags: bad });
  }

  // Contradictory technical.programmingLanguages
  if (eco === 'js' && langs.some((l) => ['python', 'rust', 'go', 'c#', 'csharp'].includes(l))) {
    const bad = langs.filter((l) => ['python', 'rust', 'go', 'c#', 'csharp'].includes(l));
    issues.contradictoryLangs.push({ name, eco, badLangs: bad });
  }

  // Low confidence
  const conf = passport.ingest?.confidence ?? 1;
  if (conf < 0.8) {
    issues.lowConfidence.push({ name, confidence: conf });
  }
}

// Report
const H = (label, arr) => {
  console.log(fmt('cyan', `\n${label} (${arr.length})`));
  if (arr.length === 0) console.log('  ' + fmt('green', 'none'));
  else for (const row of arr) console.log('  ' + JSON.stringify(row));
};

console.log(fmt('cyan', `Quality pass — ${passports.length} passports`));
H('Leaked oneLiner (auto-retry candidates)', issues.leakedOneLiner);
H('Tautological oneLiner (may need re-LLM)', issues.tautologicalOneLiner);
H('Short/vague oneLiner', issues.shortOneLiner);
H('Contradictory language tags (auto-fix)', issues.contradictoryLangTags);
H('Contradictory programmingLanguages (auto-fix)', issues.contradictoryLangs);
H('Low confidence (<0.8)', issues.lowConfidence);

const reportPath = join(repoRoot, 'scripts', 'review-report.json');
writeFileSync(reportPath, JSON.stringify(issues, null, 2) + '\n', 'utf8');

console.log('\n' + fmt('gray', `Report written to ${reportPath}`));

const totalAuto = issues.leakedOneLiner.length + issues.contradictoryLangTags.length + issues.contradictoryLangs.length;
const totalReLlm = issues.tautologicalOneLiner.length + issues.shortOneLiner.length;
console.log(fmt('cyan', `\nSummary: ${totalAuto} auto-fixable, ${totalReLlm} re-LLM candidates, ${passports.length - totalAuto - totalReLlm - issues.lowConfidence.length} likely clean`));
