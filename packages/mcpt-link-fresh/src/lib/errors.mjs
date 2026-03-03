/**
 * Friendly error helpers for mcpt-link-fresh.
 * Same pattern as mcp-tool-shop's scripts/lib/errors.mjs.
 *
 * Error codes: MKT.SYNC.<KIND>
 */

const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const useColor =
  !process.env.NO_COLOR && !process.env.CI && process.stderr.isTTY;

function c(code, text) {
  return useColor ? `${code}${text}${RESET}` : text;
}

/**
 * Print a fatal error and exit.
 */
export function fail(code, headline, opts = {}) {
  const { fix, path, nerd, exitCode = 1 } = opts;
  const lines = [];
  lines.push("");
  lines.push(c(RED, `  ${c(BOLD, code)}  ${headline}`));
  if (path) lines.push(c(DIM, `  file: ${path}`));
  if (fix) lines.push(`  fix:  ${fix}`);
  if (nerd) lines.push(c(DIM, `  nerd: ${nerd}`));
  lines.push("");
  console.error(lines.join("\n"));
  process.exit(exitCode);
}

/**
 * Print a warning. Does NOT exit.
 */
export function warn(code, headline, opts = {}) {
  const { fix, path, nerd } = opts;
  const lines = [];
  lines.push(c(YELLOW, `  ${c(BOLD, code)}  ${headline}`));
  if (path) lines.push(c(DIM, `  file: ${path}`));
  if (fix) lines.push(`  fix:  ${fix}`);
  if (nerd) lines.push(c(DIM, `  nerd: ${nerd}`));
  console.warn(lines.join("\n"));
}
