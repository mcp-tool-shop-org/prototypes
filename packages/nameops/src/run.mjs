#!/usr/bin/env node
/**
 * NameOps orchestrator — run.mjs
 *
 * Reads a profile and name list, invokes COE batch + publish + validate,
 * and produces structured output for downstream consumption.
 *
 * Usage:
 *   node src/run.mjs --out <dir> --profile <path> --names <path>
 *
 * Requires `coe` (clearance-opinion-engine) to be installed globally
 * or available on PATH.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";

// ── CLI argument parsing ────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    out: "artifacts",
    profile: "data/profile.json",
    names: "data/names.txt",
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) opts.out = args[++i];
    else if (args[i] === "--profile" && args[i + 1]) opts.profile = args[++i];
    else if (args[i] === "--names" && args[i + 1]) opts.names = args[++i];
    else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`Usage: node src/run.mjs [options]

Options:
  --out <dir>       Output directory (default: artifacts)
  --profile <path>  Profile JSON file (default: data/profile.json)
  --names <path>    Names file (default: data/names.txt)
  --help            Show this help`);
      process.exit(0);
    }
  }

  return opts;
}

// ── Profile loading ─────────────────────────────────────────────

/**
 * Load and validate profile.json.
 * @param {string} profilePath
 * @returns {object} Parsed profile
 */
export function loadProfile(profilePath) {
  const abs = resolve(profilePath);
  if (!existsSync(abs)) {
    console.error(`Profile not found: ${abs}`);
    process.exit(1);
  }

  const profile = JSON.parse(readFileSync(abs, "utf8"));

  // Validate required fields
  const required = ["channels", "org", "risk", "concurrency", "maxAgeHours"];
  for (const field of required) {
    if (!(field in profile)) {
      console.error(`Profile missing required field: ${field}`);
      process.exit(1);
    }
  }

  return profile;
}

/**
 * Map profile fields to COE CLI flags.
 * @param {object} profile
 * @returns {string[]} CLI flag array
 */
export function profileToFlags(profile) {
  const flags = [];

  flags.push("--channels", String(profile.channels));
  flags.push("--org", String(profile.org));
  flags.push("--risk", String(profile.risk));
  flags.push("--concurrency", String(profile.concurrency));
  flags.push("--max-age-hours", String(profile.maxAgeHours));

  if (profile.dockerNamespace) {
    flags.push("--dockerNamespace", String(profile.dockerNamespace));
  }
  if (profile.hfOwner) {
    flags.push("--hfOwner", String(profile.hfOwner));
  }
  if (profile.variantBudget) {
    flags.push("--variantBudget", String(profile.variantBudget));
  }
  if (profile.fuzzyQueryMode) {
    flags.push("--fuzzyQueryMode", String(profile.fuzzyQueryMode));
  }
  if (profile.cacheDir) {
    flags.push("--cache-dir", String(profile.cacheDir));
  }
  if (profile.radar) {
    flags.push("--radar");
  }
  if (profile.suggest) {
    flags.push("--suggest");
  }

  return flags;
}

// ── Execution helpers ───────────────────────────────────────────

/**
 * Run a shell command, streaming stdout/stderr. Returns true on success.
 * @param {string} cmd
 * @param {object} [opts]
 * @returns {boolean}
 */
function run(cmd, opts = {}) {
  try {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, {
      stdio: "inherit",
      timeout: (opts.timeoutMinutes || 20) * 60 * 1000,
      ...opts,
    });
    return true;
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    console.error(err.message);
    return false;
  }
}

/**
 * List subdirectories in a directory (non-recursive).
 * @param {string} dir
 * @returns {string[]} Directory names
 */
function listSubdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// ── Main orchestration ──────────────────────────────────────────

/**
 * Run the full NameOps pipeline.
 *
 * @param {object} opts - { out, profile, names }
 * @returns {{ success: boolean, metadata: object }}
 */
export async function runPipeline(opts) {
  const startTime = Date.now();
  const outDir = resolve(opts.out);
  const batchDir = join(outDir, "batch");
  const publishDir = join(outDir, "published");

  mkdirSync(outDir, { recursive: true });
  mkdirSync(publishDir, { recursive: true });

  // 1. Load profile
  const profile = loadProfile(opts.profile);
  const flags = profileToFlags(profile);

  // 2. Run COE batch
  const namesPath = resolve(opts.names);
  const batchCmd = [
    "coe", "batch", `"${namesPath}"`,
    ...flags,
    "--output", `"${batchDir}"`,
  ].join(" ");

  console.log("\n=== Step 1: Running COE batch ===");
  const batchOk = run(batchCmd, {
    timeoutMinutes: profile.maxRuntimeMinutes || 15,
    env: {
      ...process.env,
      COE_CACHE_DIR: profile.cacheDir ? resolve(profile.cacheDir) : undefined,
    },
  });

  if (!batchOk) {
    console.error("Batch step failed.");
  }

  // 3. Find the batch output directory (batch creates a dated subdirectory)
  const batchSubdirs = listSubdirs(batchDir);
  const batchOutputDir = batchSubdirs.length > 0
    ? join(batchDir, batchSubdirs[batchSubdirs.length - 1])
    : batchDir;

  // 4. Publish per-name artifacts
  console.log("\n=== Step 2: Publishing artifacts ===");
  const slugDirs = listSubdirs(batchOutputDir).filter((d) => d !== "batch");
  let publishedCount = 0;
  let publishErrors = 0;

  for (const slug of slugDirs) {
    const slugDir = join(batchOutputDir, slug);
    const runJsonPath = join(slugDir, "run.json");

    if (!existsSync(runJsonPath)) continue;

    const pubDest = join(publishDir, slug);
    const runsIndex = join(publishDir, "runs.json");

    const publishCmd = [
      "coe", "publish",
      `"${slugDir}"`,
      `"${pubDest}"`,
      "--index", `"${runsIndex}"`,
    ].join(" ");

    if (run(publishCmd)) {
      publishedCount++;
    } else {
      publishErrors++;
    }
  }

  console.log(`Published ${publishedCount} artifacts (${publishErrors} errors).`);

  // 5. Validate published artifacts
  console.log("\n=== Step 3: Validating artifacts ===");
  let validationOk = true;

  for (const slug of listSubdirs(publishDir)) {
    const pubDir = join(publishDir, slug);
    const hasFiles = existsSync(join(pubDir, "run.json")) || existsSync(join(pubDir, "summary.json"));
    if (!hasFiles) continue;

    if (!run(`coe validate-artifacts "${pubDir}"`)) {
      validationOk = false;
    }
  }

  // Also validate the runs.json index
  if (existsSync(join(publishDir, "runs.json"))) {
    if (!run(`coe validate-artifacts "${publishDir}"`)) {
      validationOk = false;
    }
  }

  // 6. Write metadata
  const durationMs = Date.now() - startTime;
  const metadata = {
    date: new Date().toISOString(),
    durationMs,
    durationHuman: `${Math.round(durationMs / 1000)}s`,
    namesFile: opts.names,
    profileFile: opts.profile,
    batchOutputDir: batchOutputDir,
    publishDir,
    slugCount: slugDirs.length,
    publishedCount,
    publishErrors,
    validationOk,
    batchOk: batchOk !== false,
  };

  const metadataPath = join(outDir, "metadata.json");
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + "\n", "utf8");
  console.log(`\nMetadata written to ${metadataPath}`);
  console.log(`Duration: ${metadata.durationHuman}`);

  return { success: batchOk && validationOk && publishErrors === 0, metadata };
}

// ── Entry point ─────────────────────────────────────────────────

const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.dirname, "..", "src", "run.mjs");

if (isMain) {
  const opts = parseArgs(process.argv);
  const { success } = await runPipeline(opts);
  process.exit(success ? 0 : 1);
}
