#!/usr/bin/env node
// pnpm seed:doctor
// Health check: reports missing passports, low-confidence LLM entries, broken lineage,
// and seeds that are missing basic discovery fields. Does not fail the build.

import {
  listPackageDirs,
  loadPassports,
  packagesMissingPassports,
  fmt,
} from './lib.mjs';

const all = listPackageDirs();
const passports = loadPassports();
const missing = packagesMissingPassports();

const lowConfidence = [];
const needsReview = [];
const missingOneLiner = [];
const brokenLineage = [];

const allNames = new Set(all);
for (const { name, passport } of passports) {
  if (!passport) continue;
  if (passport.ingest?.confidence != null && passport.ingest.confidence < 0.7) {
    lowConfidence.push({ name, confidence: passport.ingest.confidence });
  }
  if (passport.ingest?.manualReview === true) {
    needsReview.push(name);
  }
  if (!passport.discovery?.oneLiner || passport.discovery.oneLiner.startsWith('TODO')) {
    missingOneLiner.push(name);
  }
  const refs = [
    ...(passport.lineage?.relatedSeeds ?? []),
    ...(passport.lineage?.deprecates ?? []),
    ...(passport.lineage?.successors ?? []),
  ];
  for (const ref of refs) {
    if (!allNames.has(ref)) {
      brokenLineage.push({ name, ref });
    }
  }
}

const H = (label) => console.log('\n' + fmt('cyan', label));
const bullet = (s) => console.log('  - ' + s);

console.log(fmt('cyan', `Seed Vault health — ${all.length} packages, ${passports.length} passports`));

H(`Missing passports (${missing.length})`);
if (missing.length === 0) bullet(fmt('green', 'none'));
else for (const n of missing.slice(0, 50)) bullet(n);
if (missing.length > 50) bullet(fmt('gray', `...and ${missing.length - 50} more`));

H(`Low-confidence LLM-backfilled (${lowConfidence.length})`);
if (lowConfidence.length === 0) bullet(fmt('green', 'none'));
else for (const { name, confidence } of lowConfidence) bullet(`${name} (confidence=${confidence})`);

H(`Flagged for manual review (${needsReview.length})`);
if (needsReview.length === 0) bullet(fmt('green', 'none'));
else for (const n of needsReview.slice(0, 50)) bullet(n);
if (needsReview.length > 50) bullet(fmt('gray', `...and ${needsReview.length - 50} more`));

H(`Missing / TODO one-liner (${missingOneLiner.length})`);
if (missingOneLiner.length === 0) bullet(fmt('green', 'none'));
else for (const n of missingOneLiner.slice(0, 50)) bullet(n);
if (missingOneLiner.length > 50) bullet(fmt('gray', `...and ${missingOneLiner.length - 50} more`));

H(`Broken lineage references (${brokenLineage.length})`);
if (brokenLineage.length === 0) bullet(fmt('green', 'none'));
else for (const { name, ref } of brokenLineage) bullet(`${name} → unknown seed "${ref}"`);

console.log('');
