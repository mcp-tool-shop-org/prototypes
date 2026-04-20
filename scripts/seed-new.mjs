#!/usr/bin/env node
// pnpm seed:new <slug> [--category X] [--kind Y] [--title T] [--description D]
// Scaffolds a new seed folder with a valid-by-construction passport stub.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  packagesDir,
  loadTaxonomy,
  loadPassports,
  todayIso,
  nowIso,
  fmt,
} from './lib.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = value;
    } else {
      args._.push(a);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const slug = args._[0];

if (!slug) {
  console.error(fmt('red', 'Usage: pnpm seed:new <slug> [--category X] [--kind Y] [--title T] [--description D]'));
  process.exit(2);
}

if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(slug)) {
  console.error(fmt('red', `Invalid slug: ${slug}. Must match ^[a-zA-Z0-9][a-zA-Z0-9._-]*$`));
  process.exit(2);
}

const pkgDir = join(packagesDir, slug);
if (existsSync(pkgDir)) {
  console.error(fmt('red', `Folder already exists: packages/${slug}`));
  process.exit(2);
}

const taxonomy = loadTaxonomy();
const category = args.category ?? 'developer-tools';
if (!taxonomy.categories.has(category)) {
  console.error(
    fmt(
      'red',
      `Unknown category: ${category}. Choose from: ${[...taxonomy.categories].sort().join(', ')}`
    )
  );
  process.exit(2);
}

const existingIds = new Set(loadPassports().map((r) => r.passport?.id).filter(Boolean));
const version = '0.1.0';
const id = `seed:${slug}:${version}`;
if (existingIds.has(id)) {
  console.error(fmt('red', `ID collision: ${id} already used by another seed.`));
  process.exit(2);
}

const title = args.title ?? slug;
const description =
  args.description ??
  `TODO: describe ${slug} in 80-800 characters. What does it do, what problem did it solve, what did we learn from it?`;
const kind = args.kind ?? 'library';
const today = todayIso();

const passport = {
  $schema: '../../schemas/passport.schema.json',
  conformsTo: ['codemeta:3.0', 'ro-crate:1.1', 'mcp-prototypes:passport:1'],
  id,
  swhid: null,
  name: slug,
  title,
  description,
  version,
  license: 'MIT',
  datePublished: today,
  dateModified: today,
  codeRepository: `https://github.com/mcp-tool-shop-org/prototypes/tree/main/packages/${slug}`,
  author: [{ name: 'mcp-tool-shop' }],
  keywords: [],
  lifecycle: {
    state: 'sapling',
    stateSince: today,
    maturity: 'prototype',
    caretaker: null,
    graduatedTo: null,
    resurrectionNotes: null,
  },
  taxonomy: {
    category,
    domains: [],
    tags: [],
  },
  technical: {
    kind,
    programmingLanguages: ['TypeScript'],
    runtimes: ['node>=20'],
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
    consolidatedAt: null,
    relatedSeeds: [],
    deprecates: [],
    successors: [],
  },
  sbom: {
    format: 'none',
    url: null,
    hash: null,
  },
  discovery: {
    oneLiner: `TODO: one line about ${slug}.`,
    whyItMatters: null,
  },
  patterns: [],
  failureModes: [],
  priorArt: [],
  agentCapsule: {
    insight: null,
    excerpt: null,
  },
  ingest: {
    method: 'generator',
    model: null,
    confidence: 1.0,
    manualReview: true,
    ingestedAt: nowIso(),
  },
};

mkdirSync(pkgDir, { recursive: true });
writeFileSync(
  join(pkgDir, 'passport.json'),
  JSON.stringify(passport, null, 2) + '\n',
  'utf8'
);
writeFileSync(
  join(pkgDir, 'package.json'),
  JSON.stringify(
    {
      name: slug,
      version,
      private: true,
      description: title,
      license: 'MIT',
      type: 'module',
    },
    null,
    2
  ) + '\n',
  'utf8'
);
writeFileSync(
  join(pkgDir, 'README.md'),
  `# ${title}\n\n${description}\n\n> Seed — lifecycle: sapling. See \`passport.json\` for full metadata.\n`,
  'utf8'
);

console.log(fmt('green', `Created seed: packages/${slug}`));
console.log(`  passport.json (${id})`);
console.log(`  package.json`);
console.log(`  README.md`);
console.log(fmt('cyan', 'Next: fill discovery.oneLiner, description, tags — then pnpm seed:validate'));
