/**
 * Checker Engine — outcome-based step verification with normalization.
 *
 * Normalization Law:
 * 1. Strip ANSI escape sequences (color codes, cursor movement)
 * 2. Trim whitespace per line
 * 3. Normalize path separators (backslash → forward slash)
 * 4. Collapse multiple whitespace into single space
 * 5. Apply before ALL comparisons, always
 *
 * Checks are outcome-based: they verify what happened, not how.
 * A learner who uses `grep -rn` instead of `grep -r` still passes
 * if the output contains the expected content.
 */

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import type {
  StepCheck,
  CommandResult,
  NormalizationRules,
  DEFAULT_NORMALIZATION,
} from './types.js';
import { resolveWorkspacePath } from './workspace.js';

// ── Normalization ────────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-9;]*[A-Za-z]/g;

export function normalize(text: string, rules?: Partial<NormalizationRules>): string {
  const r: NormalizationRules = {
    strip_ansi: true,
    trim_whitespace: true,
    normalize_paths: true,
    collapse_whitespace: true,
    case_insensitive: false,
    ...rules,
  };

  let result = text;

  if (r.strip_ansi) {
    result = result.replace(ANSI_RE, '');
  }

  if (r.normalize_paths) {
    result = result.replace(/\\/g, '/');
  }

  if (r.collapse_whitespace) {
    result = result
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' '))
      .join('\n');
  }

  if (r.trim_whitespace) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  if (r.case_insensitive) {
    result = result.toLowerCase();
  }

  return result;
}

/** Normalize a single expected pattern for matching */
function normalizeExpect(pattern: string): string {
  return normalize(pattern);
}

// ── Check Evaluation ─────────────────────────────────────────────

export interface CheckResult {
  passed: boolean;
  message: string;
}

export function evaluateCheck(
  check: StepCheck,
  result: CommandResult,
  workspaceRoot: string,
): CheckResult {
  switch (check.type) {
    case 'output_contains':
      return checkOutputContains(check, result);
    case 'output_ordered':
      return checkOutputOrdered(check, result);
    case 'file_exists':
      return checkFileExists(check, workspaceRoot);
    case 'file_contains':
      return checkFileContains(check, workspaceRoot);
    case 'exit_code':
      return checkExitCode(check, result);
    case 'git_state':
      return checkGitState(check, workspaceRoot);
    default:
      return { passed: false, message: `Unknown check type: ${(check as StepCheck).type}` };
  }
}

function checkOutputContains(check: StepCheck, result: CommandResult): CheckResult {
  const output = normalize(result.stdout + '\n' + result.stderr);
  const missing: string[] = [];

  for (const expected of check.expect || []) {
    const norm = normalizeExpect(expected);
    if (!output.includes(norm)) {
      missing.push(expected);
    }
  }

  if (missing.length === 0) {
    return { passed: true, message: 'Output contains all expected content.' };
  }

  return {
    passed: false,
    message: `Output is missing: ${missing.map((m) => `"${m}"`).join(', ')}`,
  };
}

function checkOutputOrdered(check: StepCheck, result: CommandResult): CheckResult {
  const output = normalize(result.stdout + '\n' + result.stderr);
  const expected = check.expect_ordered || [];

  let lastIndex = -1;
  for (const pattern of expected) {
    const norm = normalizeExpect(pattern);
    const idx = output.indexOf(norm, lastIndex + 1);
    if (idx === -1) {
      return {
        passed: false,
        message: `Expected "${pattern}" to appear in output after previous matches, but it was not found.`,
      };
    }
    lastIndex = idx;
  }

  return { passed: true, message: 'Output contains all expected items in order.' };
}

function checkFileExists(check: StepCheck, workspaceRoot: string): CheckResult {
  const missing: string[] = [];

  for (const file of check.files || []) {
    const resolved = resolveWorkspacePath(workspaceRoot, file);
    if (!resolved || !existsSync(resolved)) {
      missing.push(file);
    }
  }

  if (missing.length === 0) {
    return { passed: true, message: 'All expected files exist.' };
  }

  return {
    passed: false,
    message: `Missing files: ${missing.join(', ')}`,
  };
}

function checkFileContains(check: StepCheck, workspaceRoot: string): CheckResult {
  const filePath = check.file_path!;
  const resolved = resolveWorkspacePath(workspaceRoot, filePath);

  if (!resolved || !existsSync(resolved)) {
    return { passed: false, message: `File not found: ${filePath}` };
  }

  const content = normalize(readFileSync(resolved, 'utf-8'));
  const missing: string[] = [];

  for (const pattern of check.file_patterns || []) {
    const norm = normalizeExpect(pattern);
    if (!content.includes(norm)) {
      missing.push(pattern);
    }
  }

  if (missing.length === 0) {
    return { passed: true, message: `File ${filePath} contains all expected content.` };
  }

  return {
    passed: false,
    message: `File ${filePath} is missing: ${missing.map((m) => `"${m}"`).join(', ')}`,
  };
}

function checkExitCode(check: StepCheck, result: CommandResult): CheckResult {
  const expected = check.code ?? 0;
  if (result.exitCode === expected) {
    return { passed: true, message: `Command exited with expected code ${expected}.` };
  }
  return {
    passed: false,
    message: `Expected exit code ${expected}, got ${result.exitCode}.`,
  };
}

function checkGitState(check: StepCheck, workspaceRoot: string): CheckResult {
  const failures: string[] = [];

  try {
    if (check.branch !== undefined) {
      const branch = execSync('git branch --show-current', { cwd: workspaceRoot, encoding: 'utf-8' }).trim();
      if (branch !== check.branch) {
        failures.push(`Expected branch "${check.branch}", got "${branch}"`);
      }
    }

    if (check.clean !== undefined) {
      const status = execSync('git status --porcelain', { cwd: workspaceRoot, encoding: 'utf-8' }).trim();
      const isClean = status === '';
      if (isClean !== check.clean) {
        failures.push(check.clean ? 'Working tree is not clean' : 'Working tree is clean (expected changes)');
      }
    }

    if (check.commit_pattern !== undefined) {
      const lastCommit = execSync('git log -1 --format=%s', { cwd: workspaceRoot, encoding: 'utf-8' }).trim();
      const re = new RegExp(check.commit_pattern);
      if (!re.test(lastCommit)) {
        failures.push(`Last commit "${lastCommit}" does not match pattern "${check.commit_pattern}"`);
      }
    }
  } catch (e) {
    return { passed: false, message: `Git check failed: ${(e as Error).message}` };
  }

  if (failures.length === 0) {
    return { passed: true, message: 'Git state matches expectations.' };
  }

  return { passed: false, message: failures.join('; ') };
}

// ── Failure Pattern Matching ─────────────────────────────────────

/**
 * Match command output against known failure patterns.
 * Returns the first matching diagnosis, or null.
 */
export function matchFailurePattern(
  result: CommandResult,
  patterns: Array<{ pattern: string; response: string }>,
): string | null {
  const output = normalize(result.stdout + '\n' + result.stderr);

  for (const fp of patterns) {
    if (output.includes(normalize(fp.pattern))) {
      return fp.response;
    }
  }

  return null;
}
