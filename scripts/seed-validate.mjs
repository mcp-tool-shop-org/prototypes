#!/usr/bin/env node
// pnpm seed:validate
// Validates every packages/*/passport.json against the schema, taxonomy, and cross-seed invariants.
// Exit 0 when there are zero passports (Wave 1 state) or all passports pass; exit 1 on any failure.

import { existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readJson, loadPassports, loadTaxonomy, schemaPath, fmt } from './lib.mjs';

const STALE_RESURRECTION_DAYS = 183; // ~6 months

const schema = readJson(schemaPath);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const passports = loadPassports();
const taxonomy = loadTaxonomy();
const errors = [];
const warnings = [];

function err(slug, msg) {
  errors.push({ slug, msg });
}
function warn(slug, msg) {
  warnings.push({ slug, msg });
}

if (passports.length === 0) {
  console.log(fmt('gray', 'No passport.json files found. Validation skipped (pre-Wave-2 state).'));
  process.exit(0);
}

const seenIds = new Map();

for (const { name, passport, error: readError } of passports) {
  if (readError) {
    err(name, `passport.json is not valid JSON: ${readError}`);
    continue;
  }

  // Schema
  const ok = validate(passport);
  if (!ok) {
    for (const e of validate.errors ?? []) {
      err(name, `schema ${e.instancePath || '(root)'}: ${e.message}`);
    }
  }

  // Folder name MUST equal passport.name
  if (passport.name && passport.name !== name) {
    err(name, `passport.name "${passport.name}" does not match folder name "${name}"`);
  }

  // Taxonomy category
  if (passport.taxonomy?.category && !taxonomy.categories.has(passport.taxonomy.category)) {
    err(
      name,
      `unknown taxonomy.category "${passport.taxonomy.category}" (must be in taxonomy.json)`
    );
  }

  // Tag registry
  for (const tag of passport.taxonomy?.tags ?? []) {
    if (!taxonomy.tags.has(tag)) {
      err(name, `unregistered tag "${tag}" — add to taxonomy.json:tagRegistry first`);
    }
  }

  // Pattern category registry
  for (const p of passport.patterns ?? []) {
    if (p.category && !taxonomy.patternCategories.has(p.category)) {
      err(
        name,
        `patterns[].category "${p.category}" is not in taxonomy.json:patternCategories`
      );
    }
  }

  // Unique IDs
  if (passport.id) {
    if (seenIds.has(passport.id)) {
      err(name, `duplicate id "${passport.id}" (also used by ${seenIds.get(passport.id)})`);
    } else {
      seenIds.set(passport.id, name);
    }
  }

  // Stale resurrection_candidate
  if (passport.lifecycle?.state === 'resurrection_candidate') {
    const since = new Date(passport.lifecycle.stateSince);
    if (!isNaN(since.valueOf())) {
      const daysOld = (Date.now() - since.valueOf()) / 86_400_000;
      if (daysOld > STALE_RESURRECTION_DAYS) {
        warn(
          name,
          `lifecycle.stateSince is ${Math.floor(daysOld)}d old — decide: activate, archive, or refresh stateSince`
        );
      }
    }
  }

  // Graduated seeds must declare graduatedTo
  if (passport.lifecycle?.state === 'graduated' && !passport.lifecycle.graduatedTo) {
    err(name, 'lifecycle.state=graduated requires lifecycle.graduatedTo (repo URL)');
  }
}

// Lineage cross-references
const allNames = new Set(passports.map((p) => p.name));
for (const { name, passport } of passports) {
  if (!passport) continue;
  const allRefs = [
    ...(passport.lineage?.relatedSeeds ?? []),
    ...(passport.lineage?.deprecates ?? []),
    ...(passport.lineage?.successors ?? []),
  ];
  for (const ref of allRefs) {
    if (!allNames.has(ref)) {
      warn(name, `lineage references unknown seed "${ref}"`);
    }
  }
}

// Report
console.log(`Validated ${passports.length} passport(s)`);
if (warnings.length) {
  console.log('\n' + fmt('yellow', `Warnings (${warnings.length}):`));
  for (const { slug, msg } of warnings) {
    console.log(`  ${fmt('yellow', '[WARN]')} ${slug}: ${msg}`);
  }
}
if (errors.length) {
  console.log('\n' + fmt('red', `Errors (${errors.length}):`));
  for (const { slug, msg } of errors) {
    console.log(`  ${fmt('red', '[FAIL]')} ${slug}: ${msg}`);
  }
  console.log('\n' + fmt('red', 'RESULT: FAIL'));
  process.exit(1);
}

console.log('\n' + fmt('green', 'RESULT: OK'));
