#!/usr/bin/env node
// pnpm seed:backfill [--limit N] [--only slug1,slug2] [--force]
// Wave 2 backfill — reads each packages/<slug>/, builds a small corpus,
// asks hermes3:8b (via local Ollama HTTP API) to emit structured passport
// fields, merges with deterministic defaults, validates, writes passport.json.
//
// The LLM emits a narrow subset of fields (title, description, taxonomy,
// technical kind/languages, patterns, discovery narrative, agent capsule).
// Everything else is filled deterministically by this script.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  repoRoot,
  packagesDir,
  listPackageDirs,
  loadTaxonomy,
  readJson,
  schemaPath,
  todayIso,
  nowIso,
  fmt,
} from './lib.mjs';

// ---------- CLI ----------
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = value;
    } else args._.push(a);
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));
const limit = args.limit ? parseInt(args.limit, 10) : null;
const only = args.only ? new Set(args.only.split(',')) : null;
const force = args.force === 'true';

// ---------- Config ----------
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'hermes3:8b';
const CONSOLIDATION_DATE = '2026-04-08';
const README_MAX = 6000;
const SOURCE_FILE_MAX = 2000;
const SOURCE_FILES_PER_PKG = 3;

// ---------- Corpus ----------
const ENTRYPOINT_HINTS = [
  'index.ts', 'index.js', 'index.mjs', 'main.ts', 'main.js', 'main.py',
  'cli.ts', 'cli.js', 'server.ts', 'server.js', 'lib.rs', 'main.rs',
  'Program.cs', 'App.xaml.cs', 'Startup.cs', 'mod.ts',
];
const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.mjs', '.py', '.rs', '.cs', '.go', '.java'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.astro', 'target', 'bin', 'obj', '.git', 'test', 'tests', '__tests__']);

function findSourceFiles(dir) {
  const found = [];
  const walk = (d, depth) => {
    if (depth > 3) return;
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e)) continue;
      const full = join(d, e);
      let s;
      try { s = statSync(full); } catch { continue; }
      if (s.isDirectory()) walk(full, depth + 1);
      else if (s.isFile() && SOURCE_EXTS.some((x) => e.endsWith(x))) {
        found.push({ path: full, name: e, depth });
      }
    }
  };
  walk(dir, 0);
  // Prefer entrypoints, then shallow files, then shorter names
  found.sort((a, b) => {
    const ea = ENTRYPOINT_HINTS.indexOf(a.name);
    const eb = ENTRYPOINT_HINTS.indexOf(b.name);
    const ra = ea === -1 ? 99 : ea;
    const rb = eb === -1 ? 99 : eb;
    if (ra !== rb) return ra - rb;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.name.length - b.name.length;
  });
  return found.slice(0, SOURCE_FILES_PER_PKG);
}

function truncate(s, max) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n\n…[truncated, original ${s.length} chars]`;
}

function buildCorpus(slug) {
  const pkgDir = join(packagesDir, slug);
  const pkgJsonPath = join(pkgDir, 'package.json');
  const readmePath = join(pkgDir, 'README.md');
  let pkgJson = null;
  let readme = '';
  if (existsSync(pkgJsonPath)) {
    try { pkgJson = readJson(pkgJsonPath); } catch { /* ignore */ }
  }
  if (existsSync(readmePath)) {
    try { readme = readFileSync(readmePath, 'utf8'); } catch { /* ignore */ }
  }
  const sources = [];
  for (const f of findSourceFiles(pkgDir)) {
    try {
      const content = readFileSync(f.path, 'utf8');
      const rel = f.path.replace(pkgDir, '').replace(/\\/g, '/').replace(/^\//, '');
      sources.push({ path: rel, content: truncate(content, SOURCE_FILE_MAX) });
    } catch { /* ignore */ }
  }
  return { slug, pkgJson, readme: truncate(readme, README_MAX), sources };
}

// ---------- Partial schema (what the LLM fills) ----------
const partialSchema = {
  type: 'object',
  required: ['title', 'description', 'taxonomy', 'technical', 'discovery', 'patterns', 'confidence'],
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 120 },
    description: { type: 'string', minLength: 30, maxLength: 800 },
    keywords: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    taxonomy: {
      type: 'object',
      required: ['category'],
      properties: {
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 6 },
      },
    },
    technical: {
      type: 'object',
      required: ['kind', 'programmingLanguages'],
      properties: {
        kind: { type: 'string' },
        programmingLanguages: { type: 'array', items: { type: 'string' }, minItems: 1 },
      },
    },
    discovery: {
      type: 'object',
      required: ['oneLiner'],
      properties: {
        oneLiner: { type: 'string', minLength: 10, maxLength: 200 },
        whyItMatters: { type: ['string', 'null'], maxLength: 500 },
      },
    },
    patterns: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        required: ['name', 'category', 'summary'],
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          summary: { type: 'string' },
        },
      },
    },
    agentCapsule: {
      type: ['object', 'null'],
      properties: {
        insight: { type: ['string', 'null'] },
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};

// ---------- Prompt ----------
function buildPrompt(corpus, taxonomy) {
  const categories = taxonomy.categoryList.map((c) => `${c.id} (${c.label})`).join(', ');
  const patternCats = taxonomy.patternCategoryList.map((c) => c.id).join(', ');
  const tags = [...taxonomy.tags].slice(0, 40).join(', ');
  const kinds = 'cli | library | mcp-server | desktop | vscode | plugin | service | dataset | extension';

  const sourceBlocks = corpus.sources
    .map((s) => `--- ${s.path} ---\n${s.content}`)
    .join('\n\n');

  return `You are extracting structured metadata from an archived software prototype in the MCP Tool Shop "seed vault" (monorepo of 104 prototypes consolidated from a GitHub org reduction in April 2026). Read the package materials and emit ONE JSON object. Ground every claim in what the materials say. Prefer shorter + accurate over longer + speculative. NEVER echo instructions, file counts, or meta-observations back into your output — describe the actual software.

PACKAGE: ${corpus.slug}

=== package.json ===
${corpus.pkgJson ? JSON.stringify(corpus.pkgJson, null, 2).slice(0, 2000) : '(missing)'}

=== README.md ===
${corpus.readme || '(missing)'}

=== source files ===
${sourceBlocks || '(none found)'}

=== rules (read carefully) ===
CATEGORY — pick ONE from: ${categories}.
  • If the package is about voice/TTS/audio/soundboard/soundtrack → voice-and-sound.
  • If it's a TypeScript/JS CLI, MCP server, or dev utility → developer-tools.
  • If it's a desktop GUI app (Tauri, WinUI, MAUI) → desktop-apps.
  • If it's a VS Code extension → vscode-extensions.
  • If it's about payroll, ledgers, receipts, provenance-signing → crypto-and-provenance.
  • If it's about policy, attestation, routing, throttles → governance-and-policy.
  • If in doubt, pick the BEST fit — never "original-archive" unless truly uncategorizable.

TAGS — only from: ${tags}. NEVER include a language tag that contradicts the evidence. If package.json exists the primary language is typescript or javascript — don't tag "python" or "rust".

KIND — ONE of: ${kinds}. "library" = importable package, "cli" = has a bin entry or acts as a command, "mcp-server" = implements MCP, "desktop" = native desktop app, "vscode" = VS Code extension.

LANGUAGES — only list languages you can verify from file extensions above OR from explicit mentions in package.json/README. If package.json is present, primary language is TypeScript or JavaScript. Don't mix unless evidence is strong.

PATTERNS — 0-4 items, each with category from: ${patternCats}. A pattern is a non-obvious technique this prototype demonstrates (e.g. "async-refresh-on-read" in caching, "event-sourced state" in data-model). Pick patterns that are genuinely interesting to steal, not generic ones like "uses TypeScript".

CONFIDENCE — 1.0 = README was rich and specific. 0.7 = basics clear, some fields guessed. 0.4 = very sparse materials. 0.2 = mostly inference.

Emit ONLY the JSON object. No prose, no markdown fencing, no comments.`;
}

// ---------- Ollama call ----------
async function callOllama(prompt) {
  const body = {
    model: MODEL,
    prompt,
    stream: false,
    format: partialSchema,
    options: { temperature: 0.1, top_p: 0.9, num_predict: 2500 },
  };
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.response;
}

// ---------- Deterministic merge ----------
function mergeWithDefaults(slug, llm, corpus, taxonomy) {
  const pkgJson = corpus.pkgJson || {};
  const version = typeof pkgJson.version === 'string' && /^\d+\.\d+\.\d+/.test(pkgJson.version)
    ? pkgJson.version.split(/[-+]/)[0]
    : '0.1.0';
  const license = typeof pkgJson.license === 'string' ? pkgJson.license : 'MIT';
  const today = todayIso();

  // Guardrails
  const category = taxonomy.categories.has(llm?.taxonomy?.category)
    ? llm.taxonomy.category
    : 'original-archive';
  const kind = ['cli', 'library', 'mcp-server', 'desktop', 'vscode', 'plugin', 'service', 'dataset', 'extension'].includes(llm?.technical?.kind)
    ? llm.technical.kind
    : 'library';
  const filteredTags = (llm?.taxonomy?.tags || []).filter((t) => taxonomy.tags.has(t));
  const filteredPatterns = (llm?.patterns || [])
    .filter((p) => p && p.name && p.category && p.summary)
    .filter((p) => taxonomy.patternCategories.has(p.category))
    .slice(0, 4);

  return {
    $schema: '../../schemas/passport.schema.json',
    conformsTo: ['codemeta:3.0', 'ro-crate:1.1', 'mcp-prototypes:passport:1'],
    id: `seed:${slug}:${version}`,
    swhid: null,
    name: slug,
    title: (llm?.title || pkgJson.description || slug).slice(0, 120),
    description: (llm?.description || pkgJson.description || `Archived prototype: ${slug}.`).slice(0, 800).padEnd(30, ' '),
    version,
    license,
    datePublished: today,
    dateModified: today,
    codeRepository: `https://github.com/mcp-tool-shop-org/prototypes/tree/main/packages/${slug}`,
    author: [{ name: 'mcp-tool-shop' }],
    keywords: Array.isArray(llm?.keywords) ? llm.keywords.slice(0, 8) : [],
    lifecycle: {
      state: 'dormant',
      stateSince: CONSOLIDATION_DATE,
      maturity: 'prototype',
      caretaker: null,
      graduatedTo: null,
      resurrectionNotes: null,
    },
    taxonomy: {
      category,
      domains: [],
      tags: filteredTags,
    },
    technical: {
      kind,
      programmingLanguages: Array.isArray(llm?.technical?.programmingLanguages) && llm.technical.programmingLanguages.length
        ? llm.technical.programmingLanguages.slice(0, 5)
        : ['TypeScript'],
      runtimes: [],
      operatingSystems: ['any'],
    },
    health: {
      lineCount: null,
      lastCommitAt: null,
      commitRecencyDays: null,
      hasTests: null,
      hasReadme: null,
      hasLicense: null,
      buildable: null,
    },
    lineage: {
      sourceRepo: null,
      consolidatedAt: CONSOLIDATION_DATE,
      relatedSeeds: [],
      deprecates: [],
      successors: [],
    },
    sbom: { format: 'none', url: null, hash: null },
    discovery: {
      oneLiner: (llm?.discovery?.oneLiner || `Archived prototype: ${slug}.`).slice(0, 200),
      whyItMatters: llm?.discovery?.whyItMatters?.slice(0, 500) || null,
    },
    patterns: filteredPatterns,
    failureModes: [],
    priorArt: [],
    agentCapsule: {
      insight: llm?.agentCapsule?.insight?.slice(0, 200) || null,
      excerpt: null,
    },
    ingest: {
      method: 'ollama-backfill',
      model: MODEL,
      confidence: typeof llm?.confidence === 'number' ? Math.max(0, Math.min(1, llm.confidence)) : 0.3,
      manualReview: true,
      ingestedAt: nowIso(),
    },
  };
}

// ---------- Runner ----------
async function main() {
  const taxonomy = loadTaxonomy();
  const schema = readJson(schemaPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const validatePartial = new Ajv({ allErrors: true, strict: false }).compile(partialSchema);

  let slugs = listPackageDirs();
  if (only) slugs = slugs.filter((s) => only.has(s));
  if (limit) slugs = slugs.slice(0, limit);

  const report = { startedAt: nowIso(), model: MODEL, total: slugs.length, results: [] };
  let okCount = 0, failCount = 0, skipCount = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const passportPath = join(packagesDir, slug, 'passport.json');
    if (existsSync(passportPath) && !force) {
      console.log(`${fmt('gray', `[${i + 1}/${slugs.length}]`)} ${slug} — passport exists, skip`);
      skipCount++;
      report.results.push({ slug, status: 'skipped' });
      continue;
    }

    const started = Date.now();
    process.stdout.write(`${fmt('cyan', `[${i + 1}/${slugs.length}]`)} ${slug} — `);
    const corpus = buildCorpus(slug);
    let llm = null;
    let rawResponse = null;
    let error = null;
    try {
      rawResponse = await callOllama(buildPrompt(corpus, taxonomy));
      llm = JSON.parse(rawResponse);
      if (!validatePartial(llm)) {
        error = `partial-schema invalid: ${JSON.stringify(validatePartial.errors?.slice(0, 2))}`;
      }
    } catch (e) {
      error = e.message || String(e);
    }

    if (error) {
      console.log(fmt('red', `FAIL (${(Date.now() - started) / 1000}s) — ${error.slice(0, 120)}`));
      failCount++;
      report.results.push({
        slug, status: 'failed', error, rawResponse: rawResponse?.slice(0, 500),
      });
      continue;
    }

    const passport = mergeWithDefaults(slug, llm, corpus, taxonomy);
    const finalOk = validate(passport);
    if (!finalOk) {
      console.log(fmt('red', `FAIL — final schema invalid: ${JSON.stringify(validate.errors?.slice(0, 2))}`));
      failCount++;
      report.results.push({
        slug, status: 'failed', error: 'final-schema-invalid',
        schemaErrors: validate.errors, llm,
      });
      continue;
    }
    writeFileSync(passportPath, JSON.stringify(passport, null, 2) + '\n', 'utf8');
    const elapsed = Math.round((Date.now() - started) / 100) / 10;
    const conf = passport.ingest.confidence.toFixed(2);
    console.log(fmt('green', `ok`) + ` (${elapsed}s, conf=${conf}, ${passport.technical.kind}, ${passport.taxonomy.category})`);
    okCount++;
    report.results.push({
      slug, status: 'ok', confidence: passport.ingest.confidence,
      category: passport.taxonomy.category, kind: passport.technical.kind,
    });
  }

  report.finishedAt = nowIso();
  report.summary = { ok: okCount, failed: failCount, skipped: skipCount };
  const reportPath = join(repoRoot, 'scripts', 'backfill-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('');
  console.log(fmt('cyan', `Summary: ${okCount} ok, ${failCount} failed, ${skipCount} skipped`));
  console.log(`Report written to ${reportPath}`);
  if (failCount > 0) process.exit(1);
}

main().catch((e) => {
  console.error(fmt('red', `Fatal: ${e.message}`));
  console.error(e.stack);
  process.exit(1);
});
