/**
 * Lesson Parser — loads and validates YAML lesson files.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Lesson, LessonStep, StepCheck, CheckType, RuntimeType, GameSpec } from './types.js';

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VALID_RUNTIME_TYPES: RuntimeType[] = ['shell', 'venv', 'docker'];
const VALID_RESET_POLICIES = ['per_step', 'per_lesson'] as const;
const VALID_CHECK_TYPES: CheckType[] = [
  'output_contains',
  'output_ordered',
  'file_exists',
  'file_contains',
  'exit_code',
  'git_state',
];

export class LessonParseError extends Error {
  constructor(
    public lessonPath: string,
    public reason: string,
  ) {
    super(`Invalid lesson ${lessonPath}: ${reason}`);
    this.name = 'LessonParseError';
  }
}

/** Parse and validate a single lesson file */
export function parseLesson(filePath: string): Lesson {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new LessonParseError(filePath, 'file not found');
  }

  const raw = readFileSync(absPath, 'utf-8');
  let data: unknown;
  try {
    data = parseYaml(raw);
  } catch (e) {
    throw new LessonParseError(filePath, `YAML parse error: ${(e as Error).message}`);
  }

  if (!data || typeof data !== 'object') {
    throw new LessonParseError(filePath, 'lesson must be a YAML object');
  }

  const lesson = data as Record<string, unknown>;

  // Required string fields
  const requiredStrings = ['id', 'title', 'goal', 'reflection'] as const;
  for (const field of requiredStrings) {
    if (typeof lesson[field] !== 'string' || !lesson[field]) {
      throw new LessonParseError(filePath, `missing or invalid field: ${field}`);
    }
  }

  // Difficulty
  if (!VALID_DIFFICULTIES.includes(lesson.difficulty as typeof VALID_DIFFICULTIES[number])) {
    throw new LessonParseError(filePath, `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  // Estimated minutes
  if (typeof lesson.estimated_minutes !== 'number' || lesson.estimated_minutes <= 0) {
    throw new LessonParseError(filePath, 'estimated_minutes must be a positive number');
  }

  // Workspace
  validateWorkspace(filePath, lesson.workspace);

  // Safety
  validateSafety(filePath, lesson.safety);

  // Runtime (optional — defaults to shell)
  if (lesson.runtime !== undefined) {
    validateRuntime(filePath, lesson.runtime);
  }

  // Mode + Game
  if (lesson.mode !== undefined && lesson.mode !== 'lesson' && lesson.mode !== 'game') {
    throw new LessonParseError(filePath, 'mode must be "lesson" or "game"');
  }
  if (lesson.mode === 'game') {
    if (!lesson.game || typeof lesson.game !== 'object') {
      throw new LessonParseError(filePath, 'game mode requires a game spec');
    }
    validateGame(filePath, lesson.game);
  }

  // Steps
  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
    throw new LessonParseError(filePath, 'lesson must have at least one step');
  }

  const stepIds = new Set<string>();
  for (const step of lesson.steps) {
    validateStep(filePath, step, stepIds);
  }

  return lesson as unknown as Lesson;
}

function validateWorkspace(filePath: string, workspace: unknown): void {
  if (!workspace || typeof workspace !== 'object') {
    throw new LessonParseError(filePath, 'missing workspace spec');
  }

  const ws = workspace as Record<string, unknown>;
  if (!Array.isArray(ws.scaffold)) {
    throw new LessonParseError(filePath, 'workspace.scaffold must be an array');
  }

  for (const file of ws.scaffold) {
    if (!file || typeof file !== 'object') {
      throw new LessonParseError(filePath, 'scaffold entry must be an object');
    }
    const f = file as Record<string, unknown>;
    if (typeof f.path !== 'string' || !f.path) {
      throw new LessonParseError(filePath, 'scaffold entry must have a path');
    }
    if (typeof f.content !== 'string') {
      throw new LessonParseError(filePath, `scaffold entry ${f.path} must have content`);
    }
    // Reject absolute paths or path traversal
    if (f.path.startsWith('/') || f.path.startsWith('\\') || f.path.includes('..')) {
      throw new LessonParseError(filePath, `scaffold path must be relative and not escape workspace: ${f.path}`);
    }
  }
}

function validateSafety(filePath: string, safety: unknown): void {
  if (!safety || typeof safety !== 'object') {
    throw new LessonParseError(filePath, 'missing safety spec');
  }

  const s = safety as Record<string, unknown>;
  if (!Array.isArray(s.blocked_patterns)) {
    throw new LessonParseError(filePath, 'safety.blocked_patterns must be an array');
  }

  for (const pattern of s.blocked_patterns) {
    if (typeof pattern !== 'string') {
      throw new LessonParseError(filePath, 'blocked_patterns entries must be strings');
    }
  }

  if (typeof s.workspace_only !== 'boolean') {
    throw new LessonParseError(filePath, 'safety.workspace_only must be a boolean');
  }
}

function validateRuntime(filePath: string, runtime: unknown): void {
  if (!runtime || typeof runtime !== 'object') {
    throw new LessonParseError(filePath, 'runtime must be an object');
  }

  const r = runtime as Record<string, unknown>;

  if (!VALID_RUNTIME_TYPES.includes(r.type as RuntimeType)) {
    throw new LessonParseError(
      filePath,
      `runtime.type must be one of: ${VALID_RUNTIME_TYPES.join(', ')}`,
    );
  }

  const type = r.type as RuntimeType;

  // Docker-specific validations
  if (type === 'docker') {
    if (r.image !== undefined && typeof r.image !== 'string') {
      throw new LessonParseError(filePath, 'runtime.image must be a string');
    }
  }

  // Venv-specific validations
  if (type === 'venv') {
    if (r.python !== undefined && typeof r.python !== 'string') {
      throw new LessonParseError(filePath, 'runtime.python must be a string');
    }
  }

  // Requirements (shared by venv and docker)
  if (r.requirements !== undefined) {
    if (!Array.isArray(r.requirements)) {
      throw new LessonParseError(filePath, 'runtime.requirements must be an array');
    }
    for (const req of r.requirements) {
      if (typeof req !== 'string') {
        throw new LessonParseError(filePath, 'runtime.requirements entries must be strings');
      }
    }
  }

  // Reset policy
  if (r.reset !== undefined) {
    if (!VALID_RESET_POLICIES.includes(r.reset as typeof VALID_RESET_POLICIES[number])) {
      throw new LessonParseError(
        filePath,
        `runtime.reset must be one of: ${VALID_RESET_POLICIES.join(', ')}`,
      );
    }
  }

  // Network (boolean)
  if (r.network !== undefined && typeof r.network !== 'boolean') {
    throw new LessonParseError(filePath, 'runtime.network must be a boolean');
  }

  // Writable paths
  if (r.writable_paths !== undefined) {
    if (!Array.isArray(r.writable_paths)) {
      throw new LessonParseError(filePath, 'runtime.writable_paths must be an array');
    }
  }

  // Timeout
  if (r.timeout !== undefined) {
    if (typeof r.timeout !== 'number' || r.timeout <= 0) {
      throw new LessonParseError(filePath, 'runtime.timeout must be a positive number');
    }
  }

  // Cumulative
  if (r.cumulative !== undefined && typeof r.cumulative !== 'boolean') {
    throw new LessonParseError(filePath, 'runtime.cumulative must be a boolean');
  }

  // Capabilities
  if (r.capabilities !== undefined) {
    validateCapabilities(filePath, r.capabilities);
  }
}

const VALID_FS_VALUES = ['workspace-only', 'read-host', 'full'] as const;
const VALID_PROCESS_VALUES = ['none', 'inspect-only', 'full'] as const;

function validateCapabilities(filePath: string, caps: unknown): void {
  if (!caps || typeof caps !== 'object') {
    throw new LessonParseError(filePath, 'runtime.capabilities must be an object');
  }

  const c = caps as Record<string, unknown>;

  if (c.filesystem !== undefined && !VALID_FS_VALUES.includes(c.filesystem as typeof VALID_FS_VALUES[number])) {
    throw new LessonParseError(filePath, `capabilities.filesystem must be one of: ${VALID_FS_VALUES.join(', ')}`);
  }
  if (c.processes !== undefined && !VALID_PROCESS_VALUES.includes(c.processes as typeof VALID_PROCESS_VALUES[number])) {
    throw new LessonParseError(filePath, `capabilities.processes must be one of: ${VALID_PROCESS_VALUES.join(', ')}`);
  }
  for (const boolField of ['network', 'git', 'python', 'package_install', 'destructive'] as const) {
    if (c[boolField] !== undefined && typeof c[boolField] !== 'boolean') {
      throw new LessonParseError(filePath, `capabilities.${boolField} must be a boolean`);
    }
  }
}

function validateGame(filePath: string, game: unknown): void {
  const g = game as Record<string, unknown>;

  // Win conditions (required)
  if (!Array.isArray(g.win_conditions) || g.win_conditions.length === 0) {
    throw new LessonParseError(filePath, 'game must have at least one win_condition');
  }
  for (const wc of g.win_conditions) {
    if (!wc || typeof wc !== 'object') {
      throw new LessonParseError(filePath, 'win_condition must be an object');
    }
    const w = wc as Record<string, unknown>;
    if (!VALID_CHECK_TYPES.includes(w.type as CheckType)) {
      throw new LessonParseError(filePath, `win_condition type must be one of: ${VALID_CHECK_TYPES.join(', ')}`);
    }
    if (typeof w.description !== 'string') {
      throw new LessonParseError(filePath, 'win_condition must have a description');
    }
  }

  // Fail conditions (optional)
  if (g.fail_conditions !== undefined) {
    if (!Array.isArray(g.fail_conditions)) {
      throw new LessonParseError(filePath, 'fail_conditions must be an array');
    }
    const validFail = ['timeout', 'max_commands', 'blocked_action'];
    for (const fc of g.fail_conditions) {
      const f = fc as Record<string, unknown>;
      if (!validFail.includes(f.type as string)) {
        throw new LessonParseError(filePath, `fail_condition type must be one of: ${validFail.join(', ')}`);
      }
      if (typeof f.message !== 'string') {
        throw new LessonParseError(filePath, 'fail_condition must have a message');
      }
    }
  }

  // Scoring (required)
  if (!g.scoring || typeof g.scoring !== 'object') {
    throw new LessonParseError(filePath, 'game must have a scoring spec');
  }
  const s = g.scoring as Record<string, unknown>;
  if (typeof s.hint_penalty !== 'boolean') {
    throw new LessonParseError(filePath, 'scoring.hint_penalty must be a boolean');
  }
  if (typeof s.reset_penalty !== 'boolean') {
    throw new LessonParseError(filePath, 'scoring.reset_penalty must be a boolean');
  }

  // Briefing and victory (required)
  if (typeof g.briefing !== 'string' || !g.briefing) {
    throw new LessonParseError(filePath, 'game must have a briefing');
  }
  if (typeof g.victory !== 'string' || !g.victory) {
    throw new LessonParseError(filePath, 'game must have a victory message');
  }
}

function validateStep(filePath: string, step: unknown, seenIds: Set<string>): void {
  if (!step || typeof step !== 'object') {
    throw new LessonParseError(filePath, 'step must be an object');
  }

  const s = step as Record<string, unknown>;

  if (typeof s.id !== 'string' || !s.id) {
    throw new LessonParseError(filePath, 'step must have an id');
  }
  if (seenIds.has(s.id)) {
    throw new LessonParseError(filePath, `duplicate step id: ${s.id}`);
  }
  seenIds.add(s.id);

  if (typeof s.prompt !== 'string' || !s.prompt) {
    throw new LessonParseError(filePath, `step ${s.id}: missing prompt`);
  }

  // Check
  validateCheck(filePath, s.id as string, s.check);

  // Hints
  if (!Array.isArray(s.hints) || s.hints.length === 0) {
    throw new LessonParseError(filePath, `step ${s.id}: must have at least one hint`);
  }
  for (const hint of s.hints) {
    if (typeof hint !== 'string') {
      throw new LessonParseError(filePath, `step ${s.id}: hints must be strings`);
    }
  }

  // on_failure is optional
  if (s.on_failure !== undefined) {
    if (!Array.isArray(s.on_failure)) {
      throw new LessonParseError(filePath, `step ${s.id}: on_failure must be an array`);
    }
    for (const fp of s.on_failure) {
      if (!fp || typeof fp !== 'object') continue;
      const f = fp as Record<string, unknown>;
      if (typeof f.pattern !== 'string' || typeof f.response !== 'string') {
        throw new LessonParseError(filePath, `step ${s.id}: on_failure entries need pattern and response`);
      }
    }
  }
}

function validateCheck(filePath: string, stepId: string, check: unknown): void {
  if (!check || typeof check !== 'object') {
    throw new LessonParseError(filePath, `step ${stepId}: missing check`);
  }

  const c = check as Record<string, unknown>;
  if (!VALID_CHECK_TYPES.includes(c.type as CheckType)) {
    throw new LessonParseError(
      filePath,
      `step ${stepId}: invalid check type "${c.type}", must be one of: ${VALID_CHECK_TYPES.join(', ')}`,
    );
  }

  const type = c.type as CheckType;

  switch (type) {
    case 'output_contains':
      if (!Array.isArray(c.expect) || c.expect.length === 0) {
        throw new LessonParseError(filePath, `step ${stepId}: output_contains requires non-empty expect array`);
      }
      break;
    case 'output_ordered':
      if (!Array.isArray(c.expect_ordered) || c.expect_ordered.length === 0) {
        throw new LessonParseError(filePath, `step ${stepId}: output_ordered requires non-empty expect_ordered array`);
      }
      break;
    case 'file_exists':
      if (!Array.isArray(c.files) || c.files.length === 0) {
        throw new LessonParseError(filePath, `step ${stepId}: file_exists requires non-empty files array`);
      }
      break;
    case 'file_contains':
      if (typeof c.file_path !== 'string') {
        throw new LessonParseError(filePath, `step ${stepId}: file_contains requires file_path`);
      }
      if (!Array.isArray(c.file_patterns) || c.file_patterns.length === 0) {
        throw new LessonParseError(filePath, `step ${stepId}: file_contains requires non-empty file_patterns`);
      }
      break;
    case 'exit_code':
      // code defaults to 0 if not specified
      if (c.code !== undefined && typeof c.code !== 'number') {
        throw new LessonParseError(filePath, `step ${stepId}: exit_code.code must be a number`);
      }
      break;
    case 'git_state':
      // At least one git check must be specified
      if (c.branch === undefined && c.clean === undefined && c.commit_pattern === undefined) {
        throw new LessonParseError(filePath, `step ${stepId}: git_state requires at least one of: branch, clean, commit_pattern`);
      }
      break;
  }
}

/** Load all lessons from a directory */
export function loadLessons(lessonsDir: string): Lesson[] {
  const absDir = resolve(lessonsDir);
  if (!existsSync(absDir)) {
    throw new Error(`Lessons directory not found: ${absDir}`);
  }

  const files = readdirSync(absDir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  return files.map((f) => parseLesson(join(absDir, f)));
}
