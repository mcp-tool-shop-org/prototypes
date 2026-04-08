/**
 * Tutor Loop — the core coaching engine.
 *
 * Responsibilities:
 * 1. Load lesson, scaffold workspace, resume from ledger
 * 2. Present each step (task, not lecture)
 * 3. Accept command results and evaluate outcomes
 * 4. Diagnose failures with failure patterns, then hint ladder
 * 5. Explain successes concisely
 * 6. Advance through steps, persist progress
 * 7. Show reflection on lesson completion
 *
 * The tutor does NOT execute commands — that's the caller's job
 * (Claude Code, CLI, or test harness). The tutor evaluates results.
 */

import type {
  Lesson,
  LessonStep,
  CommandResult,
  StepResult,
  TutorSession,
  WorkspaceState,
  RuntimeAdapter,
  StepEvidence,
  LessonTranscript,
} from './types.js';
import { createWorkspace, resetWorkspace, cleanupWorkspace, checkCommandSafety } from './workspace.js';
import { evaluateCheck, matchFailurePattern, normalize } from './checker.js';
import { resolveRuntime, getAdapter, enforceCapabilities, formatViolations } from './runtime.js';
import {
  loadLedger,
  saveLedger,
  getLessonProgress,
  startLesson,
  recordAttempt,
  advanceHint,
  advanceStep,
  completeLesson,
} from './ledger.js';

// ── Session Management ───────────────────────────────────────────

/** Start or resume a tutor session for a lesson (sync — shell runtime) */
export function beginSession(lesson: Lesson, workspaceBaseDir?: string): TutorSession {
  const ledger = loadLedger();
  const progress = getLessonProgress(ledger, lesson.id);

  // Create workspace (shell path — synchronous for backward compat)
  const workspace = createWorkspace(lesson, workspaceBaseDir);

  // Find the current step index
  let currentStepIndex = 0;
  if (progress.status === 'in_progress' && progress.current_step) {
    const idx = lesson.steps.findIndex((s) => s.id === progress.current_step);
    if (idx !== -1) {
      currentStepIndex = idx;
    }
  }

  // Mark as started
  startLesson(ledger, lesson.id, lesson.steps[currentStepIndex].id);

  return {
    lesson,
    workspace,
    progress,
    currentStepIndex,
  };
}

/**
 * Start or resume a tutor session using the runtime adapter system.
 * Async because venv/docker setup requires process execution.
 */
export async function beginSessionAsync(lesson: Lesson, workspaceBaseDir?: string): Promise<TutorSession> {
  const resolved = resolveRuntime(lesson.runtime);
  const adapter = getAdapter(resolved.type);

  // Check runtime availability
  const available = await adapter.isAvailable();
  if (!available) {
    throw new Error(
      `Runtime "${resolved.type}" is not available on this system. ` +
      (resolved.type === 'docker' ? 'Install Docker and ensure the daemon is running.' :
       resolved.type === 'venv' ? 'Install Python 3 with venv support.' :
       'Shell should always be available — this is unexpected.'),
    );
  }

  // Enforce capability contract BEFORE setup work begins
  if (resolved.capabilities) {
    const violations = enforceCapabilities(resolved.type, resolved.capabilities);
    if (violations.length > 0) {
      throw new Error(formatViolations(violations));
    }
  }

  const ledger = loadLedger();
  const progress = getLessonProgress(ledger, lesson.id);

  // Use runtime adapter for workspace setup
  const workspaceRoot = workspaceBaseDir
    ? require('node:path').join(workspaceBaseDir, 'terminal-tutor-workspace', lesson.id)
    : undefined;
  const runtimeState = await adapter.setup(lesson, workspaceRoot || '');

  const workspace: WorkspaceState = {
    root: runtimeState.workspaceRoot,
    lessonId: lesson.id,
    initialized: true,
    runtimeState,
  };

  // Find the current step index
  let currentStepIndex = 0;
  if (progress.status === 'in_progress' && progress.current_step) {
    const idx = lesson.steps.findIndex((s) => s.id === progress.current_step);
    if (idx !== -1) {
      currentStepIndex = idx;
    }
  }

  // Mark as started
  startLesson(ledger, lesson.id, lesson.steps[currentStepIndex].id);

  return {
    lesson,
    workspace,
    progress,
    currentStepIndex,
  };
}

/** End a session, cleaning up the workspace */
export function endSession(session: TutorSession): void {
  cleanupWorkspace(session.workspace);
}

/** End a session with runtime teardown (async for venv/docker) */
export async function endSessionAsync(session: TutorSession): Promise<void> {
  if (session.workspace.runtimeState) {
    const adapter = getAdapter(session.workspace.runtimeState.type);
    await adapter.teardown(session.workspace.runtimeState);
  } else {
    cleanupWorkspace(session.workspace);
  }
}

/** Reset the current lesson workspace to its scaffold state */
export function resetSession(session: TutorSession): TutorSession {
  const workspace = resetWorkspace(session.lesson, session.workspace);
  return { ...session, workspace };
}

/** Reset with runtime adapter (async for venv/docker) */
export async function resetSessionAsync(session: TutorSession): Promise<TutorSession> {
  if (session.workspace.runtimeState) {
    const adapter = getAdapter(session.workspace.runtimeState.type);
    const newState = await adapter.reset(session.workspace.runtimeState, session.lesson);
    return {
      ...session,
      workspace: {
        ...session.workspace,
        runtimeState: newState,
        root: newState.workspaceRoot,
      },
    };
  }
  return resetSession(session);
}

/**
 * Get the command wrapper for the current session's runtime.
 * Returns the command as-is for shell, wraps for venv/docker.
 */
export function wrapCommand(session: TutorSession, command: string): string {
  if (session.workspace.runtimeState) {
    const adapter = getAdapter(session.workspace.runtimeState.type);
    return adapter.wrapCommand(session.workspace.runtimeState, command);
  }
  return command;
}

/**
 * Get environment variables for the current session's runtime.
 */
export function getRuntimeEnv(session: TutorSession): Record<string, string> {
  if (session.workspace.runtimeState) {
    const adapter = getAdapter(session.workspace.runtimeState.type);
    return adapter.getEnv(session.workspace.runtimeState);
  }
  return {};
}

// ── Step Presentation ────────────────────────────────────────────

export interface StepPresentation {
  stepNumber: number;
  totalSteps: number;
  stepId: string;
  prompt: string;
  isResume: boolean;
  attempts: number;
}

/** Get the current step to present to the learner */
export function getCurrentStep(session: TutorSession): StepPresentation | null {
  if (session.currentStepIndex >= session.lesson.steps.length) {
    return null;
  }

  const step = session.lesson.steps[session.currentStepIndex];
  const attempts = session.progress.attempts[step.id] || 0;

  return {
    stepNumber: session.currentStepIndex + 1,
    totalSteps: session.lesson.steps.length,
    stepId: step.id,
    prompt: step.prompt,
    isResume: attempts > 0,
    attempts,
  };
}

// ── Command Safety Check ─────────────────────────────────────────

export interface SafetyVerdict {
  allowed: boolean;
  reason?: string;
}

/** Check if a command is safe to run in this session */
export function checkSafety(session: TutorSession, command: string): SafetyVerdict {
  const result = checkCommandSafety(command, session.lesson.safety, session.workspace.root);
  return { allowed: result.allowed, reason: result.reason };
}

// ── Evidence / Transcript ────────────────────────────────────────

/** In-memory transcript for the current session */
const transcripts = new Map<string, LessonTranscript>();

/** Get or create a transcript for a lesson */
function getTranscript(session: TutorSession): LessonTranscript {
  const key = session.lesson.id;
  if (!transcripts.has(key)) {
    transcripts.set(key, {
      lessonId: key,
      runtime: session.lesson.runtime?.type ?? 'shell',
      startedAt: new Date().toISOString(),
      completedAt: null,
      steps: [],
    });
  }
  return transcripts.get(key)!;
}

/** Capture evidence for a step evaluation */
function captureEvidence(
  session: TutorSession,
  step: { id: string; check: { type: string } },
  result: CommandResult,
  verdict: 'pass' | 'fail',
  checkerMessage: string,
  failurePatternHit: string | null,
  hintLevel: number | null,
): void {
  const transcript = getTranscript(session);
  const attempts = session.progress.attempts[step.id] || 1;

  transcript.steps.push({
    stepId: step.id,
    timestamp: new Date().toISOString(),
    command: result.command,
    exitCode: result.exitCode,
    normalizedOutput: normalize(result.stdout + '\n' + result.stderr),
    rawStdout: result.stdout,
    rawStderr: result.stderr,
    checkType: step.check.type as StepEvidence['checkType'],
    verdict,
    checkerMessage,
    failurePatternHit,
    hintLevel,
    attemptNumber: attempts,
  });
}

/** Get the transcript for a session (for export/debugging) */
export function getSessionTranscript(session: TutorSession): LessonTranscript | null {
  return transcripts.get(session.lesson.id) ?? null;
}

// ── Step Evaluation ──────────────────────────────────────────────

/** Evaluate a command result against the current step */
export function evaluateStep(session: TutorSession, result: CommandResult): StepResult {
  const step = session.lesson.steps[session.currentStepIndex];
  if (!step) {
    return { outcome: 'error', message: 'No current step to evaluate.' };
  }

  const ledger = loadLedger();
  recordAttempt(ledger, session.lesson.id, step.id);
  session.progress = getLessonProgress(ledger, session.lesson.id);

  // Run the check
  const checkResult = evaluateCheck(step.check, result, session.workspace.root);

  if (checkResult.passed) {
    captureEvidence(session, step, result, 'pass', checkResult.message, null, null);
    return {
      outcome: 'pass',
      explanation: checkResult.message,
    };
  }

  // Failed — try to diagnose
  let diagnosis = checkResult.message;
  let failurePatternHit: string | null = null;
  if (step.on_failure) {
    const failMatch = matchFailurePattern(result, step.on_failure);
    if (failMatch) {
      diagnosis = failMatch;
      failurePatternHit = failMatch;
    }
  }

  // Get hint from ladder
  const attempts = session.progress.attempts[step.id] || 1;
  const hintIndex = session.progress.hint_index[step.id] || 0;
  const hint = hintIndex < step.hints.length ? step.hints[hintIndex] : null;

  captureEvidence(session, step, result, 'fail', checkResult.message, failurePatternHit, hintIndex);

  // Advance hint for next attempt
  if (hint !== null) {
    advanceHint(ledger, session.lesson.id, step.id, step.hints.length);
  }

  return {
    outcome: 'fail',
    diagnosis,
    hint,
    attempts,
  };
}

// ── Step Advancement ─────────────────────────────────────────────

export interface AdvanceResult {
  done: boolean;
  /** If done, the reflection text */
  reflection?: string;
  /** If not done, the next step presentation */
  nextStep?: StepPresentation;
}

/** Advance to the next step after a pass */
export function advance(session: TutorSession): AdvanceResult {
  session.currentStepIndex++;

  if (session.currentStepIndex >= session.lesson.steps.length) {
    // Lesson complete
    const ledger = loadLedger();
    completeLesson(ledger, session.lesson.id);

    // Mark transcript complete
    const transcript = transcripts.get(session.lesson.id);
    if (transcript) {
      transcript.completedAt = new Date().toISOString();
    }

    return {
      done: true,
      reflection: session.lesson.reflection,
    };
  }

  // Move to next step
  const nextStep = session.lesson.steps[session.currentStepIndex];
  const ledger = loadLedger();
  advanceStep(ledger, session.lesson.id, nextStep.id);

  const presentation = getCurrentStep(session);
  return {
    done: false,
    nextStep: presentation!,
  };
}

// ── Lesson Info ──────────────────────────────────────────────────

export interface LessonInfo {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  goal: string;
  stepCount: number;
  status: 'not_started' | 'in_progress' | 'complete';
  totalAttempts: number;
}

/** Get info about a lesson including progress */
export function getLessonInfo(lesson: Lesson): LessonInfo {
  const ledger = loadLedger();
  const progress = getLessonProgress(ledger, lesson.id);

  return {
    id: lesson.id,
    title: lesson.title,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimated_minutes,
    goal: lesson.goal,
    stepCount: lesson.steps.length,
    status: progress.status,
    totalAttempts: Object.values(progress.attempts).reduce((a, b) => a + b, 0),
  };
}
