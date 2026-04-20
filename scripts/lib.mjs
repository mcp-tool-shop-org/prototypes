import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '..');
export const packagesDir = join(repoRoot, 'packages');
export const schemaPath = join(repoRoot, 'schemas', 'passport.schema.json');
export const taxonomyPath = join(repoRoot, 'taxonomy.json');

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listPackageDirs() {
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir)
    .filter((name) => statSync(join(packagesDir, name)).isDirectory())
    .sort();
}

export function loadTaxonomy() {
  const t = readJson(taxonomyPath);
  return {
    categories: new Set(t.categories.map((c) => c.id)),
    categoryList: t.categories,
    tags: new Set(Object.keys(t.tagRegistry)),
    patternCategories: new Set((t.patternCategories ?? []).map((c) => c.id)),
    patternCategoryList: t.patternCategories ?? [],
    raw: t,
  };
}

export function loadPassports() {
  const results = [];
  for (const name of listPackageDirs()) {
    const passportPath = join(packagesDir, name, 'passport.json');
    if (!existsSync(passportPath)) continue;
    try {
      results.push({ name, path: passportPath, passport: readJson(passportPath) });
    } catch (err) {
      results.push({ name, path: passportPath, error: err.message });
    }
  }
  return results;
}

export function packagesMissingPassports() {
  return listPackageDirs().filter(
    (name) => !existsSync(join(packagesDir, name, 'passport.json'))
  );
}

export function gitLastCommitIso(path) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${path}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

const TEST_PATTERNS = [/\.test\./, /\.spec\./, /_test\./, /\/tests?\//i, /\/__tests__\//];
const README_NAMES = new Set(['README.md', 'README.MD', 'Readme.md', 'readme.md', 'README']);
const LICENSE_NAMES = new Set(['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING']);

export function detectHealthSignals(pkgDir) {
  const skipDirs = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.astro', 'target', 'bin', 'obj', '.git']);
  let hasTests = false;
  let hasReadme = false;
  let hasLicense = false;
  const walk = (dir, depth) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skipDirs.has(entry)) continue;
      const full = join(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        if (depth < 4) walk(full, depth + 1);
      } else if (s.isFile()) {
        if (depth === 0 && README_NAMES.has(entry)) hasReadme = true;
        if (depth === 0 && LICENSE_NAMES.has(entry)) hasLicense = true;
        if (!hasTests) {
          const full2 = full.replace(/\\/g, '/');
          if (TEST_PATTERNS.some((re) => re.test(full2))) hasTests = true;
        }
      }
    }
  };
  walk(pkgDir, 0);
  return { hasTests, hasReadme, hasLicense };
}

export function countLines(pkgDir) {
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.rs', '.cs', '.go', '.java', '.rb', '.cpp', '.c', '.h', '.hpp']);
  const skipDirs = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.astro', 'target', 'bin', 'obj', '.git']);
  let total = 0;
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skipDirs.has(entry)) continue;
      const full = join(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        walk(full);
      } else if (s.isFile()) {
        const dot = entry.lastIndexOf('.');
        if (dot > 0 && exts.has(entry.slice(dot))) {
          try {
            total += readFileSync(full, 'utf8').split('\n').length;
          } catch {
            /* ignore unreadable */
          }
        }
      }
    }
  };
  walk(pkgDir);
  return total;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString();
}

export function fmt(color, msg) {
  const codes = { red: 31, green: 32, yellow: 33, cyan: 36, gray: 90 };
  const code = codes[color] ?? 0;
  return process.stdout.isTTY ? `\x1b[${code}m${msg}\x1b[0m` : msg;
}
