#!/usr/bin/env node
// pnpm seed:relm
// Re-runs hermes3:8b on specific passports to repair broken oneLiners, descriptions,
// and patterns. Uses a sharper prompt focused on REPAIR (starts from what's there,
// fixes specific problems) rather than initial extraction.
//
// Reads scripts/review-report.json to pick targets:
//   - leakedOneLiner: JSON/README fragments
//   - tautologicalOneLiner: self-referential
//   - shortOneLiner: too terse to be useful

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  repoRoot,
  packagesDir,
  readJson,
  schemaPath,
  loadTaxonomy,
  nowIso,
  fmt,
} from './lib.mjs';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'hermes3:8b';

const report = readJson(join(repoRoot, 'scripts', 'review-report.json'));
const targets = new Set([
  ...report.leakedOneLiner.map((r) => r.name),
  ...report.tautologicalOneLiner.map((r) => r.name),
  ...report.shortOneLiner.map((r) => r.name),
]);

const taxonomy = loadTaxonomy();

// Partial schema for the repair — just oneLiner, description, and agentCapsule.insight
// (we're not repairing tags/languages; autofix already handled those).
const repairSchema = {
  type: 'object',
  required: ['oneLiner', 'description', 'whyItMatters', 'agentInsight'],
  properties: {
    oneLiner: { type: 'string', minLength: 15, maxLength: 200 },
    description: { type: 'string', minLength: 30, maxLength: 800 },
    whyItMatters: { type: ['string', 'null'], maxLength: 500 },
    agentInsight: { type: ['string', 'null'], maxLength: 200 },
  },
};

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '\n…[truncated]' : s;
}

function buildCorpus(slug) {
  const pkgDir = join(packagesDir, slug);
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pyprojectPath = join(pkgDir, 'pyproject.toml');
  const readmePath = join(pkgDir, 'README.md');
  let pkgJson = null;
  let pyproject = '';
  let readme = '';
  if (existsSync(pkgJsonPath)) { try { pkgJson = readJson(pkgJsonPath); } catch {} }
  if (existsSync(pyprojectPath)) { try { pyproject = readFileSync(pyprojectPath, 'utf8'); } catch {} }
  if (existsSync(readmePath)) { try { readme = readFileSync(readmePath, 'utf8'); } catch {} }
  return { slug, pkgJson, pyproject: truncate(pyproject, 1500), readme: truncate(readme, 7000) };
}

function buildRepairPrompt(slug, corpus, currentPassport) {
  const currentOne = currentPassport.discovery?.oneLiner ?? '(missing)';
  const currentDesc = currentPassport.description ?? '(missing)';
  const kind = currentPassport.technical?.kind ?? 'unknown';
  const langs = (currentPassport.technical?.programmingLanguages ?? []).join(', ');
  const category = currentPassport.taxonomy?.category ?? 'unknown';

  return `You are REPAIRING metadata for an archived prototype in the MCP Tool Shop seed vault. The current oneLiner or description is broken (leaked JSON/README fragments, tautological, too short, or missing). Generate a clean replacement grounded ONLY in the actual source material below.

PACKAGE: ${slug}
Known facts (do not change): kind=${kind}, languages=${langs}, category=${category}.

=== package.json ===
${corpus.pkgJson ? JSON.stringify(corpus.pkgJson, null, 2).slice(0, 1500) : '(none)'}

=== pyproject.toml ===
${corpus.pyproject || '(none)'}

=== README.md ===
${corpus.readme || '(none)'}

=== currently broken (for context — do NOT copy) ===
oneLiner: ${currentOne}
description: ${currentDesc}

=== instructions ===
Emit a JSON object with EXACTLY these fields:
- "oneLiner" (15-200 chars): one clean sentence describing what this package DOES, grounded in the README. No meta-commentary, no "This is a...", no copying fragments, no mentioning the package name tautologically. Just: describe what it does.
- "description" (30-800 chars): 1-3 sentences. What does the package do? What problem did it solve? Pulled from the README's first substantive paragraph.
- "whyItMatters" (nullable, max 500 chars): why this prototype was worth building. Null if the README doesn't make this clear.
- "agentInsight" (nullable, max 200 chars): the 10-second core trick an agent should know. Null if nothing non-obvious.

NEVER:
- Echo any part of the instructions
- Start with "Yes,", "True,", "Go to", "Read the", or similar fragments
- Reference the package's own slug tautologically
- Mention file counts or ecosystem hints

Emit ONLY the JSON object. No prose, no markdown fencing.`;
}

async function callOllama(prompt) {
  const body = {
    model: MODEL,
    prompt,
    stream: false,
    format: repairSchema,
    options: { temperature: 0.1, top_p: 0.9, num_predict: 1500 },
  };
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.response);
}

console.log(fmt('cyan', `Re-LLMing ${targets.size} passports...`));
let ok = 0, fail = 0;
for (const slug of [...targets].sort()) {
  const pp = join(packagesDir, slug, 'passport.json');
  const passport = readJson(pp);
  const corpus = buildCorpus(slug);
  try {
    const started = Date.now();
    const repair = await callOllama(buildRepairPrompt(slug, corpus, passport));
    passport.discovery.oneLiner = repair.oneLiner.slice(0, 200);
    passport.description = repair.description.slice(0, 800);
    passport.discovery.whyItMatters = repair.whyItMatters?.slice(0, 500) ?? null;
    passport.agentCapsule.insight = repair.agentInsight?.slice(0, 200) ?? passport.agentCapsule.insight ?? null;
    passport.ingest.ingestedAt = nowIso();
    writeFileSync(pp, JSON.stringify(passport, null, 2) + '\n', 'utf8');
    const elapsed = Math.round((Date.now() - started) / 100) / 10;
    console.log(`${fmt('green', '[ok]')} ${slug} (${elapsed}s): ${repair.oneLiner.slice(0, 70)}`);
    ok++;
  } catch (e) {
    console.log(`${fmt('red', '[fail]')} ${slug}: ${e.message}`);
    fail++;
  }
}

console.log(fmt('cyan', `\nRepaired: ${ok}, Failed: ${fail}`));
if (fail > 0) process.exit(1);
