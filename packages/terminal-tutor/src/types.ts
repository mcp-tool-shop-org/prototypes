/**
 * Terminal Tutor — Core Types
 *
 * Lesson contract, check types, workspace law, and ledger state.
 */

// ── Lesson Contract ──────────────────────────────────────────────

export type ScenarioMode = 'lesson' | 'game';

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  goal: string;
  /** Optional scenario flavor — sets the scene, makes it human */
  flavor?: string;
  /** lesson (default) = guided instruction. game = replayable scenario */
  mode?: ScenarioMode;
  /** Game-specific contract — only valid when mode: game */
  game?: GameSpec;
  workspace: WorkspaceSpec;
  safety: SafetySpec;
  /** Runtime environment — defaults to shell if omitted */
  runtime?: RuntimeSpec;
  steps: LessonStep[];
  reflection: string;
}

// ── Game Contract ────────────────────────────────────────────────

/**
 * Game spec — extends a lesson into a replayable scenario.
 *
 * Product law:
 * 1. Commands are mechanics — no fake menu loops
 * 2. Game state is scenario truth — same parser/runtime/checker
 * 3. Fun is layered on truth — flavor, tension, discovery, recovery
 * 4. Replay matters — alternate solutions, par times, harder variants
 */
export interface GameSpec {
  /** What the player must achieve to win */
  win_conditions: WinCondition[];
  /** What causes failure (optional — games can be fail-safe) */
  fail_conditions?: FailCondition[];
  /** Scoring and replay config */
  scoring: ScoringSpec;
  /** Replay variant support */
  replay?: ReplaySpec;
  /** Briefing shown at game start — sets mission context */
  briefing: string;
  /** Victory message */
  victory: string;
  /** Defeat message (if fail conditions exist) */
  defeat?: string;
}

export interface WinCondition {
  /** Check type — reuses the same checker system */
  type: CheckType;
  /** Human-readable description of this win condition */
  description: string;
  /** Check parameters — same shape as StepCheck */
  expect?: string[];
  expect_ordered?: string[];
  files?: string[];
  file_path?: string;
  file_patterns?: string[];
  code?: number;
  branch?: string;
  clean?: boolean;
  commit_pattern?: string;
}

export interface FailCondition {
  type: 'timeout' | 'max_commands' | 'blocked_action';
  /** For timeout: seconds. For max_commands: count. */
  value?: number;
  message: string;
}

export interface ScoringSpec {
  /** Par time in seconds — "good" completion time */
  par_time?: number;
  /** Whether using hints reduces the score */
  hint_penalty: boolean;
  /** Whether resetting the workspace reduces the score */
  reset_penalty: boolean;
}

export interface ReplaySpec {
  /** Number of variant seeds available */
  variants?: number;
  /** Whether to offer harder mode after first win */
  harder_after_win?: boolean;
}

/** Result of evaluating all win conditions */
export interface GameVerdict {
  won: boolean;
  conditionsMet: number;
  conditionsTotal: number;
  details: Array<{
    description: string;
    met: boolean;
    message: string;
  }>;
}

/** Game session scoring */
export interface GameScore {
  /** Time elapsed in seconds */
  elapsed: number;
  /** Commands executed */
  commandCount: number;
  /** Hints consumed */
  hintsUsed: number;
  /** Resets performed */
  resets: number;
  /** Par rating: under_par, at_par, over_par */
  parRating: 'under_par' | 'at_par' | 'over_par' | 'no_par';
  /** Whether the player used zero hints */
  noHints: boolean;
}

export interface WorkspaceSpec {
  scaffold: ScaffoldFile[];
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface SafetySpec {
  /** Shell patterns that are immediately blocked */
  blocked_patterns: string[];
  /** Restrict all commands to the lesson workspace root */
  workspace_only: boolean;
}

// ── Runtime Contract ─────────────────────────────────────────────

export type RuntimeType = 'shell' | 'venv' | 'docker';
export type ResetPolicy = 'per_step' | 'per_lesson';

export interface RuntimeSpec {
  type: RuntimeType;
  /** Docker image (docker only) */
  image?: string;
  /** Python version for venv (venv only) */
  python?: string;
  /** pip requirements to install (venv/docker) */
  requirements?: string[];
  /** Reset policy — per_step resets workspace before each step */
  reset?: ResetPolicy;
  /** Whether later steps depend on state from earlier steps */
  cumulative?: boolean;
  /** Disable network access (docker only, default true) */
  network?: boolean;
  /** Writable paths inside the container (docker only) */
  writable_paths?: string[];
  /** Timeout per command in seconds (all runtimes) */
  timeout?: number;
  /** What this lesson requires from the runtime */
  capabilities?: CapabilitySpec;
}

/**
 * Capability Schema — what a lesson declares it needs.
 *
 * The runtime adapter proves it can satisfy these before setup.
 * This keeps lessons truthful and stops runtime over-provisioning.
 *
 * Doctrine:
 * - shell: filesystem + git. No Python, no processes, no packages.
 * - venv: filesystem + git + python + package_install. NOT containment.
 * - docker: everything. The only true containment boundary.
 */
export interface CapabilitySpec {
  /** Filesystem access scope */
  filesystem?: 'workspace-only' | 'read-host' | 'full';
  /** Network access required */
  network?: boolean;
  /** Git operations needed */
  git?: boolean;
  /** Python interpreter needed */
  python?: boolean;
  /** Process inspection (ps, top, kill) needed */
  processes?: 'none' | 'inspect-only' | 'full';
  /** Package installation (pip, npm) needed */
  package_install?: boolean;
  /** Destructive commands allowed (rm, chmod, etc.) */
  destructive?: boolean;
}

/** Resolved runtime config with defaults applied */
export interface ResolvedRuntime {
  type: RuntimeType;
  image: string;
  python: string;
  requirements: string[];
  reset: ResetPolicy;
  cumulative: boolean;
  network: boolean;
  writable_paths: string[];
  timeout: number;
  capabilities: CapabilitySpec;
}

/**
 * Runtime Adapter — uniform interface for all execution environments.
 *
 * The adapter owns the lifecycle of the execution environment:
 * setup (create/start), reset (restore to scaffold), and teardown (cleanup).
 *
 * It also provides the capability check so the tutor can report
 * missing dependencies before starting a lesson.
 */
export interface RuntimeAdapter {
  /** Runtime type this adapter handles */
  readonly type: RuntimeType;

  /** Check if the runtime is available on this system */
  isAvailable(): Promise<boolean>;

  /** Create and initialize the execution environment */
  setup(lesson: Lesson, workspaceRoot: string): Promise<RuntimeState>;

  /** Reset environment to scaffold state */
  reset(state: RuntimeState, lesson: Lesson): Promise<RuntimeState>;

  /** Clean up the execution environment */
  teardown(state: RuntimeState): Promise<void>;

  /** Get the effective working directory for commands */
  getWorkdir(state: RuntimeState): string;

  /** Get environment variables to inject into commands */
  getEnv(state: RuntimeState): Record<string, string>;

  /** Runtime-specific command wrapping (e.g., docker exec prefix) */
  wrapCommand(state: RuntimeState, command: string): string;
}

export interface RuntimeState {
  type: RuntimeType;
  workspaceRoot: string;
  lessonId: string;
  /** Docker container ID (docker only) */
  containerId?: string;
  /** Venv path (venv only) */
  venvPath?: string;
  /** Whether the runtime is currently active */
  active: boolean;
}

// ── Step Contract ────────────────────────────────────────────────

export interface LessonStep {
  id: string;
  prompt: string;
  check: StepCheck;
  hints: string[];
  on_failure?: FailurePattern[];
}

export type CheckType =
  | 'output_contains'
  | 'output_ordered'
  | 'file_exists'
  | 'file_contains'
  | 'exit_code'
  | 'git_state';

export interface StepCheck {
  type: CheckType;
  /** Strings that must appear in output (output_contains) */
  expect?: string[];
  /** Strings that must appear in order (output_ordered) */
  expect_ordered?: string[];
  /** File paths to check existence of (file_exists) */
  files?: string[];
  /** File path + content patterns (file_contains) */
  file_path?: string;
  file_patterns?: string[];
  /** Expected exit code (exit_code) — default 0 */
  code?: number;
  /** Git state checks */
  branch?: string;
  clean?: boolean;
  commit_pattern?: string;
}

export interface FailurePattern {
  pattern: string;
  response: string;
}

// ── Checker Normalization ────────────────────────────────────────

export interface NormalizationRules {
  /** Strip ANSI escape sequences */
  strip_ansi: boolean;
  /** Trim leading/trailing whitespace per line */
  trim_whitespace: boolean;
  /** Convert backslashes to forward slashes for path comparison */
  normalize_paths: boolean;
  /** Collapse multiple spaces/tabs into single space */
  collapse_whitespace: boolean;
  /** Case-insensitive comparison */
  case_insensitive: boolean;
}

export const DEFAULT_NORMALIZATION: NormalizationRules = {
  strip_ansi: true,
  trim_whitespace: true,
  normalize_paths: true,
  collapse_whitespace: true,
  case_insensitive: false,
};

// ── Command Execution Result ─────────────────────────────────────

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Working directory at time of execution */
  cwd: string;
}

// ── Workspace Law ────────────────────────────────────────────────

export interface WorkspaceState {
  /** Absolute path to the isolated lesson workspace */
  root: string;
  /** Lesson ID this workspace belongs to */
  lessonId: string;
  /** Whether the workspace has been initialized */
  initialized: boolean;
  /** Runtime state (set when using non-shell runtimes) */
  runtimeState?: RuntimeState;
}

// ── Progress Ledger ──────────────────────────────────────────────

export interface ProgressLedger {
  learner: string;
  lessons: Record<string, LessonProgress>;
}

export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'complete';
  current_step: string | null;
  started_at: string | null;
  completed_at: string | null;
  /** Step ID → number of attempts */
  attempts: Record<string, number>;
  /** Step ID → current hint index */
  hint_index: Record<string, number>;
}

// ── Tutor Loop State ─────────────────────────────────────────────

export interface TutorSession {
  lesson: Lesson;
  workspace: WorkspaceState;
  progress: LessonProgress;
  currentStepIndex: number;
}

export type StepResult =
  | { outcome: 'pass'; explanation: string }
  | { outcome: 'fail'; diagnosis: string; hint: string | null; attempts: number }
  | { outcome: 'blocked'; reason: string }
  | { outcome: 'error'; message: string };

// ── Evidence Capture ─────────────────────────────────────────────

/**
 * Step evidence — captured per evaluation for diagnosis and authoring.
 *
 * Not for analytics. For:
 * - Debugging brittle checks
 * - Understanding learner confusion patterns
 * - Improving hint ladders
 * - Proving lesson quality
 */
export interface StepEvidence {
  stepId: string;
  timestamp: string;
  command: string;
  exitCode: number;
  /** Normalized stdout+stderr (what the checker saw) */
  normalizedOutput: string;
  /** Raw stdout (before normalization) */
  rawStdout: string;
  /** Raw stderr */
  rawStderr: string;
  /** Which checker ran */
  checkType: CheckType;
  /** Pass/fail */
  verdict: 'pass' | 'fail';
  /** Checker's message */
  checkerMessage: string;
  /** Failure pattern match (if any) */
  failurePatternHit: string | null;
  /** Hint level shown (0-indexed, null if passed) */
  hintLevel: number | null;
  /** Attempt number on this step */
  attemptNumber: number;
}

/** Full lesson transcript — all evidence for one session */
export interface LessonTranscript {
  lessonId: string;
  runtime: RuntimeType;
  startedAt: string;
  completedAt: string | null;
  steps: StepEvidence[];
}

// ── Runtime Availability ─────────────────────────────────────────

export interface RuntimeAvailability {
  type: RuntimeType;
  available: boolean;
  /** Human-readable reason if unavailable */
  reason?: string;
  /** What to install/configure to make it available */
  remedy?: string;
}

// ── Skill Tracks ─────────────────────────────────────────────────

/**
 * A skill track is an ordered sequence of lessons forming a
 * coherent learning path. Tracks are the user-facing organization;
 * lessons are the content unit.
 */
export interface SkillTrack {
  id: string;
  name: string;
  description: string;
  /** Ordered lesson IDs — this IS the progression */
  lessons: string[];
  /** Runtimes needed to complete the full track */
  runtimes: RuntimeType[];
}

// ── Mastery Signals ──────────────────────────────────────────────

/**
 * Mastery signal — computed from transcript evidence.
 * Not a badge or gamification. A truthful read on fluency.
 */
export interface MasterySignal {
  lessonId: string;
  /** Did the learner complete without any hints? */
  noHints: boolean;
  /** Did the learner complete on first attempt per step? */
  firstTry: boolean;
  /** Total hints consumed across all steps */
  totalHints: number;
  /** Total attempts across all steps */
  totalAttempts: number;
  /** Steps that needed 3+ attempts */
  struggleSteps: string[];
  /** Fluency rating: clean (0 hints, 1st try), solid (few hints), guided (heavy hints) */
  fluency: 'clean' | 'solid' | 'guided';
}

export interface TrackProgress {
  trackId: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  /** Overall fluency across completed lessons */
  overallFluency: 'clean' | 'solid' | 'guided' | 'not_started';
  lessonDetails: Array<{
    lessonId: string;
    status: 'not_started' | 'in_progress' | 'complete';
    mastery: MasterySignal | null;
  }>;
}
