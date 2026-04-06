#!/usr/bin/env node
/**
 * WebSketch CLI
 *
 * Commands:
 *   validate <capture.json>       - Validate capture file
 *   render <capture.json>         - Render capture to ASCII
 *   fingerprint <capture.json>    - Compute structural fingerprint
 *   diff <a.json> <b.json>        - Compare two captures
 *
 * Global flags:
 *   --json    Machine-readable JSON output
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);
const pkg = _require("../package.json") as { version: string };

import {
  renderAscii,
  renderForLLM,
  renderStructure,
  fingerprintCapture,
  fingerprintLayout,
  diff,
  formatDiff,
  formatDiffJson,
  parseCapture,
  isWebSketchException,
  formatWebSketchError,
  WebSketchException,
  type WebSketchCapture,
} from "@mcptoolshop/websketch-ir";

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Map a WebSketchError code to an exit code.
 *   1 — validation / data error
 *   2 — OS / filesystem error
 */
function exitCodeFor(code: string): number {
  if (code === "WS_NOT_FOUND" || code === "WS_PERMISSION_DENIED" || code === "WS_IO_ERROR") {
    return 2;
  }
  return 1;
}

/**
 * Handle any error with structured output and correct exit code.
 *
 * In JSON mode: prints `{ ok: false, error: {...} }` to stdout.
 * In text mode: prints human-readable error to stderr.
 */
function handleError(err: unknown, jsonMode: boolean): never {
  if (isWebSketchException(err)) {
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: err.ws }));
    } else {
      console.error(formatWebSketchError(err.ws));
    }
    process.exit(exitCodeFor(err.ws.code));
  }
  // Unknown error — wrap as internal
  const message = err instanceof Error ? err.message : String(err);
  if (jsonMode) {
    console.log(JSON.stringify({ ok: false, error: { code: "WS_INTERNAL", message } }));
  } else {
    console.error(`[WS_INTERNAL] ${message}`);
  }
  process.exit(1);
}

/**
 * Handle missing required argument (no file path).
 */
function handleMissingArg(argDesc: string, jsonMode: boolean): never {
  if (jsonMode) {
    console.log(JSON.stringify({
      ok: false,
      error: { code: "WS_INVALID_ARGS", message: `Missing ${argDesc}` },
    }));
  } else {
    console.error(`Error: Missing ${argDesc}`);
    printUsage();
  }
  process.exit(1);
}

// =============================================================================
// Helpers
// =============================================================================

function loadCapture(path: string): WebSketchCapture {
  const fullPath = resolve(process.cwd(), path);

  // File existence check → WS_NOT_FOUND
  if (!existsSync(fullPath)) {
    throw new WebSketchException({
      code: "WS_NOT_FOUND",
      message: `File not found: ${fullPath}`,
      path: fullPath,
      hint: "Check the file path and try again.",
    });
  }

  let content: string;
  try {
    content = readFileSync(fullPath, "utf-8");
  } catch (err) {
    const errCode = (err as NodeJS.ErrnoException).code;
    throw new WebSketchException({
      code: errCode === "EACCES" ? "WS_PERMISSION_DENIED" : "WS_IO_ERROR",
      message: `Cannot read file: ${fullPath}`,
      path: fullPath,
      cause: { name: (err as Error).name, message: (err as Error).message },
    });
  }

  // parseCapture handles JSON parsing + schema validation
  return parseCapture(content);
}

function printUsage(): void {
  console.log(`
WebSketch CLI v${pkg.version}

Usage:
  websketch <command> [options] <args>

Commands:
  validate <capture.json>       Validate a capture file
  render <capture.json>         Render capture to ASCII art
    --width <n>                 Grid width (default: 80)
    --height <n>                Grid height (default: 24)
    --llm                       Use LLM-optimized format with metadata
    --structure                 Minimal structure-only view
  fingerprint <capture.json>    Compute structural fingerprint
    --layout-only               Ignore text content (layout-only fingerprint)
  diff <a.json> <b.json>        Compare two captures
    --layout-only               Ignore text content changes
    --threshold <n>             Match threshold 0-1 (default: 0.5)
  bundle <files...> [-o out]    Package captures into a shareable bundle
    -o <path>                   Write bundle to file (default: stdout)

Global Flags:
  --json                        Machine-readable JSON output
  --version, -v                 Show version
  --help, -h                    Show help

Exit Codes:
  0  Success
  1  Validation / data error
  2  Filesystem error

Examples:
  websketch validate capture.json
  websketch render capture.json
  websketch render --llm capture.json
  websketch --json render capture.json
  websketch fingerprint capture.json
  websketch diff before.json after.json
  websketch --json diff before.json after.json
  websketch bundle capture.json -o bundle.ws.json
  websketch bundle before.json after.json -o bundle.ws.json
`);
}

// =============================================================================
// Commands
// =============================================================================

function cmdValidate(args: string[], jsonMode: boolean): void {
  let capturePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-")) {
      capturePath = arg;
    }
  }

  if (!capturePath) {
    handleMissingArg("capture file path", jsonMode);
  }

  try {
    const capture = loadCapture(capturePath);
    // Surface embedded warnings (e.g. truncation from extension)
    const rawCapture = capture as unknown as Record<string, unknown>;
    const warnArr = Array.isArray(rawCapture.warnings) ? (rawCapture.warnings as string[]) : [];

    if (jsonMode) {
      const result: Record<string, unknown> = { ok: true, valid: true };
      if (warnArr.length > 0) result.warnings = warnArr;
      console.log(JSON.stringify(result));
    } else {
      console.log("Valid WebSketch capture.");
      console.log(`  URL: ${capture.url}`);
      console.log(`  Version: ${capture.version}`);
      console.log(`  Root role: ${capture.root.role}`);
      for (const w of warnArr) {
        console.log(`  Warning: ${w}`);
      }
    }
  } catch (err) {
    handleError(err, jsonMode);
  }
}

function cmdRenderAscii(args: string[], jsonMode: boolean): void {
  let width = 80;
  let height = 24;
  let llmMode = false;
  let structureMode = false;
  let capturePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--width" && args[i + 1]) {
      width = parseInt(args[++i], 10);
    } else if (arg === "--height" && args[i + 1]) {
      height = parseInt(args[++i], 10);
    } else if (arg === "--llm") {
      llmMode = true;
    } else if (arg === "--structure") {
      structureMode = true;
    } else if (!arg.startsWith("-")) {
      capturePath = arg;
    }
  }

  if (!capturePath) {
    handleMissingArg("capture file path", jsonMode);
  }

  try {
    const capture = loadCapture(capturePath);

    let output: string;
    if (llmMode) {
      output = renderForLLM(capture);
    } else if (structureMode) {
      output = renderStructure(capture, width, height);
    } else {
      output = renderAscii(capture, { width, height });
    }

    if (jsonMode) {
      console.log(JSON.stringify({ ok: true, ascii: output }));
    } else {
      console.log(output);
    }
  } catch (err) {
    handleError(err, jsonMode);
  }
}

function cmdFingerprint(args: string[], jsonMode: boolean): void {
  let layoutOnly = false;
  let capturePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--layout-only") {
      layoutOnly = true;
    } else if (!arg.startsWith("-")) {
      capturePath = arg;
    }
  }

  if (!capturePath) {
    handleMissingArg("capture file path", jsonMode);
  }

  try {
    const capture = loadCapture(capturePath);

    const fingerprint = layoutOnly
      ? fingerprintLayout(capture)
      : fingerprintCapture(capture);

    if (jsonMode) {
      console.log(JSON.stringify({ ok: true, fingerprint }));
    } else {
      console.log(fingerprint);
    }
  } catch (err) {
    handleError(err, jsonMode);
  }
}

function cmdDiff(args: string[], jsonMode: boolean): void {
  let layoutOnly = false;
  let localJson = false;
  let threshold = 0.5;
  const paths: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--layout-only") {
      layoutOnly = true;
    } else if (arg === "--json") {
      localJson = true;
    } else if (arg === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[++i]);
    } else if (!arg.startsWith("-")) {
      paths.push(arg);
    }
  }

  if (paths.length !== 2) {
    handleMissingArg("exactly 2 capture files for diff", jsonMode);
  }

  try {
    const captureA = loadCapture(paths[0]);
    const captureB = loadCapture(paths[1]);

    const result = diff(captureA, captureB, {
      includeText: !layoutOnly,
      includeName: !layoutOnly,
      matchThreshold: threshold,
    });

    if (jsonMode) {
      // Global --json: structured envelope with raw DiffResult
      console.log(JSON.stringify({ ok: true, diff: result }));
    } else if (localJson) {
      // Local --json: formatted JSON string (legacy)
      console.log(formatDiffJson(result));
    } else {
      console.log(formatDiff(result));
    }
  } catch (err) {
    handleError(err, jsonMode);
  }
}

function cmdBundle(args: string[], jsonMode: boolean): void {
  let outputPath: string | null = null;
  const paths: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-o" && args[i + 1]) {
      outputPath = args[++i];
    } else if (!arg.startsWith("-")) {
      paths.push(arg);
    }
  }

  if (paths.length === 0) {
    handleMissingArg("at least 1 capture file for bundle", jsonMode);
  }

  try {
    const captures = paths.map((p) => ({
      file: p,
      capture: loadCapture(p),
    }));

    const bundle: Record<string, unknown> = {
      schemaVersion: "0.1",
      createdAt: new Date().toISOString(),
      tool: `websketch-cli/${pkg.version}`,
      captures: captures.map(({ file, capture }) => ({
        source: file,
        capture,
      })),
    };

    // If exactly 2 captures, include diff summary
    if (captures.length === 2) {
      const diffResult = diff(captures[0].capture, captures[1].capture);
      bundle.diff = {
        summary: diffResult.summary,
        changes: diffResult.changes,
      };
    }

    const json = JSON.stringify(bundle, null, 2);

    if (outputPath) {
      writeFileSync(resolve(process.cwd(), outputPath), json, "utf-8");
      if (jsonMode) {
        console.log(JSON.stringify({ ok: true, output: outputPath, captures: captures.length }));
      } else {
        console.log(`Bundle written to ${outputPath} (${captures.length} capture${captures.length > 1 ? "s" : ""})`);
      }
    } else {
      if (jsonMode) {
        console.log(JSON.stringify({ ok: true, bundle }));
      } else {
        console.log(json);
      }
    }
  } catch (err) {
    handleError(err, jsonMode);
  }
}

// =============================================================================
// Main
// =============================================================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(`websketch v${pkg.version}`);
    process.exit(0);
  }

  // Extract global --json flag before command dispatch
  const jsonMode = args.includes("--json");
  const filteredArgs = args.filter((a) => a !== "--json");

  const command = filteredArgs[0];
  const commandArgs = filteredArgs.slice(1);

  switch (command) {
    case "validate":
      cmdValidate(commandArgs, jsonMode);
      break;
    case "render-ascii":
    case "render":
    case "ascii":
      cmdRenderAscii(commandArgs, jsonMode);
      break;
    case "fingerprint":
    case "fp":
      cmdFingerprint(commandArgs, jsonMode);
      break;
    case "diff":
      cmdDiff(commandArgs, jsonMode);
      break;
    case "bundle":
      cmdBundle(commandArgs, jsonMode);
      break;
    default:
      if (jsonMode) {
        console.log(JSON.stringify({
          ok: false,
          error: { code: "WS_INVALID_ARGS", message: `Unknown command: ${command}` },
        }));
        process.exit(1);
      }
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
