/**
 * Skill Tracks — organized learning paths through the lesson catalog.
 *
 * Tracks are the user-facing shape. Lessons are the content unit.
 * A track is just an ordered list of lesson IDs with a name.
 *
 * Mastery signals are computed from transcript/ledger evidence,
 * not from arbitrary point systems.
 */

import type {
  SkillTrack,
  MasterySignal,
  TrackProgress,
  Lesson,
  ProgressLedger,
  LessonProgress,
  LessonTranscript,
  RuntimeType,
} from './types.js';
import { loadLedger, getLessonProgress } from './ledger.js';

// ── Track Catalog ────────────────────────────────────────────────

const TRACKS: SkillTrack[] = [
  {
    id: 'shell-fundamentals',
    name: 'Shell Fundamentals',
    description: 'Navigate, search, and work with files — the terminal essentials.',
    lessons: ['files-and-navigation', 'pipes-and-search', 'file-surgery', 'filesystem-salvage'],
    runtimes: ['shell'],
  },
  {
    id: 'shell-triage',
    name: 'Shell Triage',
    description: 'Investigate problems: processes, logs, and system state.',
    lessons: ['process-basics'],
    runtimes: ['shell'],
  },
  {
    id: 'git-survival',
    name: 'Git Survival',
    description: 'The git commands you actually need, practiced on real repos.',
    lessons: ['git-basics'],
    runtimes: ['shell'],
  },
  {
    id: 'python-debugging',
    name: 'Python Debugging',
    description: 'Find and fix real bugs with pytest, pip, and tracebacks.',
    lessons: ['python-debugging', 'dependency-detective', 'dependency-lab'],
    runtimes: ['venv'],
  },
  {
    id: 'service-debugging',
    name: 'Service Debugging',
    description: 'Triage a failing service inside a container.',
    lessons: ['service-triage', 'service-siege'],
    runtimes: ['docker'],
  },
];

export function getAllTracks(): SkillTrack[] {
  return TRACKS;
}

export function getTrack(trackId: string): SkillTrack | undefined {
  return TRACKS.find((t) => t.id === trackId);
}

// ── Mastery Computation ──────────────────────────────────────────

/**
 * Compute mastery signal for a completed lesson from ledger data.
 * Returns null if the lesson hasn't been completed.
 */
export function computeMastery(lessonId: string, ledger?: ProgressLedger): MasterySignal | null {
  const l = ledger ?? loadLedger();
  const progress = getLessonProgress(l, lessonId);

  if (progress.status !== 'complete') {
    return null;
  }

  const totalAttempts = Object.values(progress.attempts).reduce((a, b) => a + b, 0);
  const totalHints = Object.values(progress.hint_index).reduce((a, b) => a + b, 0);
  const stepCount = Object.keys(progress.attempts).length;

  const firstTry = Object.values(progress.attempts).every((a) => a <= 1);
  const noHints = totalHints === 0;

  const struggleSteps = Object.entries(progress.attempts)
    .filter(([, attempts]) => attempts >= 3)
    .map(([stepId]) => stepId);

  let fluency: MasterySignal['fluency'];
  if (noHints && firstTry) {
    fluency = 'clean';
  } else if (totalHints <= stepCount && totalAttempts <= stepCount * 2) {
    fluency = 'solid';
  } else {
    fluency = 'guided';
  }

  return {
    lessonId,
    noHints,
    firstTry,
    totalHints,
    totalAttempts,
    struggleSteps,
    fluency,
  };
}

// ── Track Progress ───────────────────────────────────────────────

/**
 * Compute progress for a skill track.
 */
export function getTrackProgress(trackId: string): TrackProgress | null {
  const track = getTrack(trackId);
  if (!track) return null;

  const ledger = loadLedger();
  const details = track.lessons.map((lessonId) => {
    const progress = getLessonProgress(ledger, lessonId);
    const mastery = progress.status === 'complete' ? computeMastery(lessonId, ledger) : null;
    return {
      lessonId,
      status: progress.status,
      mastery,
    };
  });

  const completed = details.filter((d) => d.status === 'complete');
  const fluencies = completed
    .map((d) => d.mastery?.fluency)
    .filter((f): f is MasterySignal['fluency'] => f !== undefined);

  let overallFluency: TrackProgress['overallFluency'];
  if (fluencies.length === 0) {
    overallFluency = 'not_started';
  } else if (fluencies.every((f) => f === 'clean')) {
    overallFluency = 'clean';
  } else if (fluencies.some((f) => f === 'guided')) {
    overallFluency = 'guided';
  } else {
    overallFluency = 'solid';
  }

  return {
    trackId,
    lessonsCompleted: completed.length,
    lessonsTotal: track.lessons.length,
    overallFluency,
    lessonDetails: details,
  };
}

/**
 * Get progress summary for all tracks.
 */
export function getAllTrackProgress(): TrackProgress[] {
  return TRACKS.map((t) => getTrackProgress(t.id)!);
}

/**
 * Suggest the next lesson for a learner based on track progress.
 * Returns the first incomplete lesson in the first incomplete track.
 */
export function suggestNext(): { trackId: string; lessonId: string } | null {
  const ledger = loadLedger();

  for (const track of TRACKS) {
    for (const lessonId of track.lessons) {
      const progress = getLessonProgress(ledger, lessonId);
      if (progress.status !== 'complete') {
        return { trackId: track.id, lessonId };
      }
    }
  }

  return null; // All tracks complete
}
