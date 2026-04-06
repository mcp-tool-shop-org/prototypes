#!/usr/bin/env node

import { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  BearingsStore,
  indexProject,
  generateModuleCard,
  generateFunctionCard,
  generateSystemMap,
  generateChangeBrief,
  formatModuleCard,
  formatFunctionCard,
  formatChangeBrief,
  formatSystemMap,
  buildModuleGraphs,
  generateModeContent,
} from "@code-bearings/core";
import type { ReviewMode } from "@code-bearings/core";

const DEFAULT_DB = ".code-bearings/bearings.db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("code-bearings")
  .description(
    "Get your bearings back in your code — source-grounded review, learning, and control"
  )
  .version(pkg.version);

// ── analyze ──
program
  .command("analyze")
  .description("Index a TypeScript project and build the code graph")
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-t, --tsconfig <path>", "Path to tsconfig.json")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .action((opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`Indexing project: ${projectRoot}`);

    const store = new BearingsStore(dbPath);
    store.clear();

    const startTime = Date.now();
    indexProject(store, {
      projectRoot,
      tsConfigPath: opts.tsconfig
        ? path.resolve(opts.tsconfig)
        : undefined,
    });
    const elapsed = Date.now() - startTime;

    const fileCount = store.getMeta("fileCount") ?? "0";
    const modules = store.getAllModules();

    console.log(`Indexed ${fileCount} files in ${elapsed}ms`);
    console.log(`Found ${modules.length} modules`);
    console.log(`Database: ${dbPath}`);

    // Print system map overview
    const systemMap = generateSystemMap(store);
    console.log("");
    console.log(formatSystemMap(systemMap));

    store.close();
  });

// ── module ──
program
  .command("module <name>")
  .description("Show the module card for a named module")
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("--json", "Output as JSON")
  .action((name, opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const store = new BearingsStore(dbPath);
    const card = generateModuleCard(store, name);

    if (!card) {
      // Try partial match
      const allModules = store.getAllModules();
      const matches = allModules.filter((m) =>
        m.name.toLowerCase().includes(name.toLowerCase())
      );
      if (matches.length > 0) {
        console.error(`Module "${name}" not found. Did you mean:`);
        for (const m of matches) {
          console.error(`  - ${m.name}`);
        }
      } else {
        console.error(`Module "${name}" not found.`);
        console.error("Available modules:");
        for (const m of allModules) {
          console.error(`  - ${m.name}`);
        }
      }
      store.close();
      process.exit(1);
    }

    if (opts.json) {
      console.log(JSON.stringify(card, null, 2));
    } else {
      console.log(formatModuleCard(card));
    }

    store.close();
  });

// ── function ──
program
  .command("function <name>")
  .description("Show the function card for a named function")
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("-f, --file <path>", "Filter by file path")
  .option("--json", "Output as JSON")
  .action((name, opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const store = new BearingsStore(dbPath);
    const card = generateFunctionCard(store, name, opts.file);

    if (!card) {
      console.error(`Function "${name}" not found.`);
      store.close();
      process.exit(1);
    }

    if (opts.json) {
      console.log(JSON.stringify(card, null, 2));
    } else {
      console.log(formatFunctionCard(card));
    }

    store.close();
  });

// ── review ──
program
  .command("review [target]")
  .description(
    `Generate a change brief from a diff.

Examples:
  code-bearings review                     # staged + unstaged vs HEAD
  code-bearings review --staged            # staged changes only
  code-bearings review HEAD~1..HEAD        # last commit
  code-bearings review main..feature       # branch comparison
  code-bearings review HEAD~3              # last 3 commits vs working tree
  code-bearings review --stdin             # read diff from stdin (piped)
  git diff main | code-bearings review --stdin`
  )
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("--staged", "Only review staged changes")
  .option("--stdin", "Read diff from stdin instead of git")
  .option("--json", "Output as JSON")
  .option("--format <mode>", "Output format: full, compact, markdown, html", "full")
  .option("--mode <lens>", "Review mode: general, bug-hunter, learning, architecture, exploration", "general")
  .option("-o, --output <path>", "Write output to file instead of stdout")
  .action(async (target, opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    // Get diff from the right source
    let diffText: string;

    if (opts.stdin) {
      // Read from stdin (piped diff)
      diffText = await readStdin();
    } else {
      try {
        diffText = resolveGitDiff(projectRoot, target, opts.staged);
      } catch (err) {
        console.error("Failed to get diff:", (err as Error).message);
        process.exit(1);
      }
    }

    if (!diffText.trim()) {
      console.log("No changes detected.");
      process.exit(0);
    }

    const store = new BearingsStore(dbPath);
    const brief = generateChangeBrief(store, diffText);
    const moduleGraphs = buildModuleGraphs(store, brief);
    const reviewMode = (opts.mode ?? "general") as ReviewMode;
    const modeContent = generateModeContent(reviewMode, brief, store);

    let output: string;
    if (opts.json) {
      output = JSON.stringify(brief, null, 2);
    } else {
      output = formatChangeBrief(brief, opts.format, moduleGraphs, reviewMode, modeContent);
    }

    if (opts.output) {
      const outPath = path.resolve(opts.output);
      fs.writeFileSync(outPath, output, "utf-8");
      console.error(`Review brief written to ${outPath}`);
    } else {
      console.log(output);
    }

    store.close();
  });

// ── compare ──
program
  .command("compare [base] [head]")
  .description(
    `Compare two branches or commits and generate a review brief.

Examples:
  code-bearings compare                    # current branch vs main/master
  code-bearings compare main               # current branch vs main
  code-bearings compare main feature       # explicit base and head
  code-bearings compare HEAD~5 HEAD        # last 5 commits`
  )
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("--json", "Output as JSON")
  .option("--format <mode>", "Output format: full, compact, markdown, html", "full")
  .option("--mode <lens>", "Review mode: general, bug-hunter, learning, architecture, exploration", "general")
  .option("-o, --output <path>", "Write output to file instead of stdout")
  .action((base, head, opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const gitOpts = {
      cwd: projectRoot,
      encoding: "utf-8" as const,
      maxBuffer: 10 * 1024 * 1024,
    };

    // Resolve base branch
    if (!base) {
      base = detectBaseBranch(projectRoot);
      console.error(`Auto-detected base branch: ${base}`);
    }

    // Resolve head
    if (!head) {
      head = "HEAD";
    }

    const diffTarget = `${base}...${head}`;
    let diffText: string;
    try {
      diffText = execSync(`git diff -M ${diffTarget}`, gitOpts);
    } catch {
      // Fall back to two-dot diff
      try {
        diffText = execSync(`git diff -M ${base}..${head}`, gitOpts);
      } catch (err) {
        console.error("Failed to get diff:", (err as Error).message);
        process.exit(1);
      }
    }

    if (!diffText.trim()) {
      console.log(`No differences between ${base} and ${head}.`);
      process.exit(0);
    }

    const store = new BearingsStore(dbPath);
    const brief = generateChangeBrief(store, diffText);
    const moduleGraphs = buildModuleGraphs(store, brief);
    const reviewMode = (opts.mode ?? "general") as ReviewMode;
    const modeContent = generateModeContent(reviewMode, brief, store);

    let output: string;
    if (opts.json) {
      output = JSON.stringify(brief, null, 2);
    } else {
      output = formatChangeBrief(brief, opts.format, moduleGraphs, reviewMode, modeContent);
    }

    if (opts.output) {
      const outPath = path.resolve(opts.output);
      fs.writeFileSync(outPath, output, "utf-8");
      console.error(`Review brief written to ${outPath}`);
    } else {
      console.log(output);
    }

    store.close();
  });

// ── overview ──
program
  .command("overview")
  .description("Show the system map overview")
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("--json", "Output as JSON")
  .action((opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const store = new BearingsStore(dbPath);
    const systemMap = generateSystemMap(store);

    if (opts.json) {
      console.log(JSON.stringify(systemMap, null, 2));
    } else {
      console.log(formatSystemMap(systemMap));
    }

    store.close();
  });

// ── modules (list) ──
program
  .command("modules")
  .description("List all indexed modules")
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .action((opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const store = new BearingsStore(dbPath);
    const modules = store.getAllModules();

    for (const mod of modules) {
      const metrics = store.getModuleMetrics(mod.id);
      console.log(
        `  ${mod.name} (${mod.boundaryKind}) — ${metrics.symbolCount} symbols, ${metrics.exportedSymbolCount} exported, fan-in: ${metrics.fanIn}, tests: ${metrics.testCount}`
      );
    }

    store.close();
  });

// ── ci ──
program
  .command("ci")
  .description(
    `Generate review artifacts for CI/CD pipelines.

Produces markdown, JSON, and HTML briefs in an output directory.
Designed to be called in a CI pipeline after indexing.

Examples:
  code-bearings ci                         # compare HEAD vs base branch
  code-bearings ci --base main             # explicit base
  code-bearings ci --out ./review-artifacts`
  )
  .option("-p, --project <path>", "Project root directory", ".")
  .option("-d, --db <path>", "Database path", DEFAULT_DB)
  .option("--base <ref>", "Base branch or commit to compare against")
  .option("--head <ref>", "Head commit (default: HEAD)", "HEAD")
  .option("--out <dir>", "Output directory for artifacts", ".code-bearings/ci")
  .option("--fail-on-risk <level>", "Exit non-zero if risk exceeds: high, medium, low")
  .action((opts) => {
    const projectRoot = path.resolve(opts.project);
    const dbPath = path.resolve(projectRoot, opts.db);

    if (!fs.existsSync(dbPath)) {
      console.error(
        `No bearings database found at ${dbPath}. Run "code-bearings analyze" first.`
      );
      process.exit(1);
    }

    const gitOpts = {
      cwd: projectRoot,
      encoding: "utf-8" as const,
      maxBuffer: 10 * 1024 * 1024,
    };

    const base = opts.base || detectBaseBranch(projectRoot);
    const head = opts.head;
    const diffTarget = `${base}...${head}`;

    let diffText: string;
    try {
      diffText = execSync(`git diff -M ${diffTarget}`, gitOpts);
    } catch {
      try {
        diffText = execSync(`git diff -M ${base}..${head}`, gitOpts);
      } catch (err) {
        console.error("Failed to get diff:", (err as Error).message);
        process.exit(1);
      }
    }

    if (!diffText.trim()) {
      console.log("No changes detected. Skipping artifact generation.");
      process.exit(0);
    }

    const store = new BearingsStore(dbPath);
    const brief = generateChangeBrief(store, diffText);
    const moduleGraphs = buildModuleGraphs(store, brief);
    // CI always uses General Review — canonical truth only
    const ciModeContent = generateModeContent("general", brief, store);

    // Write artifacts
    const outDir = path.resolve(projectRoot, opts.out);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outDir, "change-brief.md"),
      formatChangeBrief(brief, "full"),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(outDir, "change-brief.json"),
      JSON.stringify(brief, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(outDir, "change-brief.html"),
      formatChangeBrief(brief, "html", moduleGraphs, "general", ciModeContent),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(outDir, "change-brief-compact.txt"),
      formatChangeBrief(brief, "compact"),
      "utf-8"
    );

    console.log(`Review artifacts written to ${outDir}/`);
    console.log(`  change-brief.md`);
    console.log(`  change-brief.json`);
    console.log(`  change-brief.html`);
    console.log(`  change-brief-compact.txt`);
    console.log("");
    console.log(`Summary: ${brief.summary}`);
    console.log(`Confidence: ${brief.confidence}`);

    const maxRisk = brief.changedModules.length > 0
      ? Math.max(...brief.changedModules.map((cm) => cm.riskScore))
      : 0;
    console.log(`Max risk score: ${maxRisk}`);

    store.close();

    // Optional risk-based exit code
    if (opts.failOnRisk) {
      const thresholds: Record<string, number> = {
        low: 5,
        medium: 15,
        high: 30,
      };
      const threshold = thresholds[opts.failOnRisk];
      if (threshold !== undefined && maxRisk >= threshold) {
        console.error(
          `Risk threshold exceeded: max score ${maxRisk} >= ${opts.failOnRisk} threshold (${threshold})`
        );
        process.exit(1);
      }
    }
  });

// ── Helpers ──

/**
 * Resolve a git diff based on target and options.
 * Supports: staged, uncommitted, ref ranges (base..head), single refs.
 * Always uses -M (rename detection).
 */
function resolveGitDiff(
  projectRoot: string,
  target: string | undefined,
  staged: boolean
): string {
  const gitOpts = {
    cwd: projectRoot,
    encoding: "utf-8" as const,
    maxBuffer: 10 * 1024 * 1024,
  };

  if (staged) {
    // Staged changes only
    return execSync("git diff --cached -M", gitOpts);
  }

  if (target) {
    // Commit range (base..head) or ref comparison
    return execSync(`git diff -M ${target}`, gitOpts);
  }

  // Default: all uncommitted changes (staged + unstaged) vs HEAD
  // Fall back to diffing against empty tree if HEAD doesn't exist (initial commit)
  try {
    return execSync("git diff HEAD -M", gitOpts);
  } catch {
    // No HEAD yet (initial commit scenario) — diff staged
    return execSync("git diff --cached -M", gitOpts);
  }
}

/**
 * Detect the base branch for comparison (main, master, or develop).
 */
function detectBaseBranch(projectRoot: string): string {
  const gitOpts = {
    cwd: projectRoot,
    encoding: "utf-8" as const,
  };

  // Check for common base branch names
  for (const candidate of ["main", "master", "develop"]) {
    try {
      execSync(`git rev-parse --verify ${candidate}`, { ...gitOpts, stdio: "pipe" });
      return candidate;
    } catch {
      // branch doesn't exist, try next
    }
  }

  // Fall back to HEAD~1
  return "HEAD~1";
}

/**
 * Read all of stdin as a string (for piped diffs).
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}

program.parse();
