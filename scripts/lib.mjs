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
