#!/usr/bin/env node

/**
 * Terminal Tutor — CLI entry point.
 *
 * Commands:
 *   terminal-tutor list              — show available lessons and progress
 *   terminal-tutor start <lesson-id> — start or resume a lesson
 *   terminal-tutor reset <lesson-id> — reset a lesson's workspace and progress
 *   terminal-tutor progress          — show progress summary
 *
 * The CLI is designed for programmatic integration with Claude Code.
 * It outputs structured JSON for machine consumption and human-readable
 * text for direct terminal use.
 */

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadLessons, parseLesson } from './parser.js';
import { loadLedger, saveLedger, getLessonProgress, getProgressSummary } from './ledger.js';
import { TutorError, handleError, lessonNotFound, invalidArgument, noActiveSession } from './errors.js';
import {
  beginSession,
  beginSessionAsync,
  endSession,
  endSessionAsync,
  getCurrentStep,
  checkSafety,
  evaluateStep,
  advance,
  getLessonInfo,
  wrapCommand,
  getRuntimeEnv,
  getSessionTranscript,
} from './tutor.js';
import { getRuntimeCapabilities, getRuntimeAvailability } from './runtime.js';
import { getAllTracks, getTrackProgress, getAllTrackProgress, suggestNext, computeMastery } from './tracks.js';
import type { CommandResult, TutorSession } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lessons + games directories: in dist/ after build, at project root
const LESSONS_DIR = resolve(__dirname, '..', 'lessons');
const GAMES_DIR = resolve(__dirname, '..', 'games');

/** Load all scenarios (lessons + games) */
function loadAllScenarios(): ReturnType<typeof loadLessons> {
  const lessons = loadLessons(LESSONS_DIR);
  try {
    const games = loadLessons(GAMES_DIR);
    return [...lessons, ...games];
  } catch {
    return lessons; // games dir might not exist
  }
}

function printUsage(): void {
  console.log(`
Terminal Tutor — Learn by doing in your terminal

Usage:
  terminal-tutor list                    Show available lessons
  terminal-tutor start <lesson-id>       Start or resume a lesson
  terminal-tutor eval <lesson-id> <json> Evaluate a command result (JSON)
  terminal-tutor advance <lesson-id>     Advance to next step after pass
  terminal-tutor check <lesson-id> <cmd> Check if a command is safe
  terminal-tutor wrap <lesson-id> <cmd>  Wrap command for lesson runtime
  terminal-tutor reset <lesson-id>       Reset lesson progress
  terminal-tutor progress                Show progress summary
  terminal-tutor info <lesson-id>        Show lesson details
  terminal-tutor runtimes                Show available runtimes
  terminal-tutor transcript <lesson-id>  Show step evidence for active session
  terminal-tutor tracks                  Show skill tracks and progress
  terminal-tutor track <track-id>        Show detailed track progress
  terminal-tutor mastery <lesson-id>     Show mastery signal for a lesson
  terminal-tutor next                    Suggest next lesson to start
  terminal-tutor doctor                  Check system readiness
  terminal-tutor help                    Show this help
`);
}

// ── Session cache (for eval/advance within a process) ────────────

const sessions = new Map<string, TutorSession>();

function getOrCreateSession(lessonId: string): TutorSession {
  if (sessions.has(lessonId)) {
    return sessions.get(lessonId)!;
  }
  const lessons = loadAllScenarios();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) throw lessonNotFound(lessonId);
  const session = beginSession(lesson);
  sessions.set(lessonId, session);
  return session;
}

async function getOrCreateSessionAsync(lessonId: string): Promise<TutorSession> {
  if (sessions.has(lessonId)) {
    return sessions.get(lessonId)!;
  }
  const lessons = loadAllScenarios();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) throw lessonNotFound(lessonId);
  // Use async path for non-shell runtimes
  const needsAsync = lesson.runtime && lesson.runtime.type !== 'shell';
  const session = needsAsync ? await beginSessionAsync(lesson) : beginSession(lesson);
  sessions.set(lessonId, session);
  return session;
}

// ── Commands ─────────────────────────────────────────────────────

async function cmdList(): Promise<void> {
  const lessons = loadAllScenarios();
  const caps = await getRuntimeCapabilities();
  const infos = lessons.map((lesson) => {
    const info = getLessonInfo(lesson);
    const runtime = lesson.runtime?.type ?? 'shell';
    const available = caps[runtime];
    return {
      ...info,
      runtime,
      runtimeAvailable: available,
      ...(!available ? {
        runtimeWarning: runtime === 'docker'
          ? 'Docker is not installed or not running'
          : runtime === 'venv'
            ? 'Python 3 with venv support is not installed'
            : undefined,
      } : {}),
    };
  });
  console.log(JSON.stringify(infos, null, 2));
}

async function cmdStart(lessonId: string): Promise<void> {
  const session = await getOrCreateSessionAsync(lessonId);
  const step = getCurrentStep(session);
  const runtime = session.lesson.runtime?.type ?? 'shell';

  console.log(
    JSON.stringify({
      lesson: session.lesson.id,
      title: session.lesson.title,
      goal: session.lesson.goal,
      workspace: session.workspace.root,
      runtime,
      runtimeState: session.workspace.runtimeState ? {
        type: session.workspace.runtimeState.type,
        active: session.workspace.runtimeState.active,
        containerId: session.workspace.runtimeState.containerId,
        venvPath: session.workspace.runtimeState.venvPath,
      } : null,
      currentStep: step,
    }, null, 2),
  );
}

function cmdWrap(lessonId: string, command: string): void {
  const session = getOrCreateSession(lessonId);
  const wrapped = wrapCommand(session, command);
  const env = getRuntimeEnv(session);
  console.log(JSON.stringify({ command: wrapped, env }, null, 2));
}

async function cmdRuntimes(): Promise<void> {
  const availability = await getRuntimeAvailability();
  console.log(JSON.stringify(availability, null, 2));
}

async function cmdTracks(): Promise<void> {
  const caps = await getRuntimeCapabilities();
  const progress = getAllTrackProgress();
  const result = progress.map((tp) => {
    const track = getAllTracks().find((t) => t.id === tp.trackId)!;
    const runtimesReady = track.runtimes.every((r) => caps[r]);
    return {
      id: tp.trackId,
      name: track.name,
      description: track.description,
      progress: `${tp.lessonsCompleted}/${tp.lessonsTotal}`,
      fluency: tp.overallFluency,
      runtimesReady,
      runtimes: track.runtimes,
    };
  });
  console.log(JSON.stringify(result, null, 2));
}

function cmdTrack(trackId: string): void {
  const tp = getTrackProgress(trackId);
  if (!tp) {
    throw new TutorError({ code: 'INPUT_TRACK_NOT_FOUND', message: `Track not found: ${trackId}`, hint: 'Run "terminal-tutor tracks" to see available tracks.' });
  }
  const track = getAllTracks().find((t) => t.id === trackId)!;
  console.log(JSON.stringify({
    id: track.id,
    name: track.name,
    description: track.description,
    ...tp,
  }, null, 2));
}

function cmdMastery(lessonId: string): void {
  const mastery = computeMastery(lessonId);
  if (!mastery) {
    console.log(JSON.stringify({
      lessonId,
      status: 'not_complete',
      message: 'Complete the lesson to see mastery signal.',
    }));
    return;
  }
  console.log(JSON.stringify(mastery, null, 2));
}

function cmdNext(): void {
  const suggestion = suggestNext();
  if (!suggestion) {
    console.log(JSON.stringify({
      message: 'All tracks complete. You have learned the terminal.',
      suggestion: null,
    }));
    return;
  }
  const track = getAllTracks().find((t) => t.id === suggestion.trackId)!;
  const lessons = loadAllScenarios();
  const lesson = lessons.find((l) => l.id === suggestion.lessonId);
  console.log(JSON.stringify({
    track: { id: track.id, name: track.name },
    lesson: {
      id: suggestion.lessonId,
      title: lesson?.title,
      difficulty: lesson?.difficulty,
      estimatedMinutes: lesson?.estimated_minutes,
      goal: lesson?.goal,
      flavor: lesson?.flavor,
    },
  }, null, 2));
}

async function cmdDoctor(): Promise<void> {
  const availability = await getRuntimeAvailability();
  const lessons = loadAllScenarios();
  const caps = await getRuntimeCapabilities();

  const runtimeSummary = availability.map((r) => ({
    runtime: r.type,
    status: r.available ? 'ready' : 'missing',
    ...(r.reason ? { reason: r.reason } : {}),
    ...(r.remedy ? { fix: r.remedy } : {}),
  }));

  const lessonSummary = lessons.map((l) => {
    const rt = l.runtime?.type ?? 'shell';
    const ready = caps[rt];
    return {
      id: l.id,
      title: l.title,
      runtime: rt,
      ready,
      ...(ready ? {} : { blocked: `Requires ${rt} runtime` }),
    };
  });

  const readyCount = lessonSummary.filter((l) => l.ready).length;
  const totalCount = lessonSummary.length;

  console.log(JSON.stringify({
    system: {
      runtimes: runtimeSummary,
      lessonsReady: readyCount,
      lessonsTotal: totalCount,
      allReady: readyCount === totalCount,
    },
    lessons: lessonSummary,
  }, null, 2));
}

function cmdTranscript(lessonId: string): void {
  const session = sessions.get(lessonId);
  if (!session) throw noActiveSession(lessonId);
  const transcript = getSessionTranscript(session);
  if (!transcript) {
    console.log(JSON.stringify({ lessonId, steps: [], message: 'No evidence captured yet.' }));
    return;
  }
  console.log(JSON.stringify(transcript, null, 2));
}

function cmdEval(lessonId: string, resultJson: string): void {
  const session = getOrCreateSession(lessonId);
  let result: CommandResult;
  try {
    result = JSON.parse(resultJson);
  } catch {
    throw new TutorError({ code: 'INPUT_INVALID_JSON', message: 'Invalid JSON for command result', hint: 'Pass a valid JSON string with command, stdout, stderr, exitCode, cwd fields.' });
  }

  const stepResult = evaluateStep(session, result);
  console.log(JSON.stringify(stepResult, null, 2));
}

function cmdAdvance(lessonId: string): void {
  const session = getOrCreateSession(lessonId);
  const result = advance(session);
  console.log(JSON.stringify(result, null, 2));
}

function cmdCheck(lessonId: string, command: string): void {
  const session = getOrCreateSession(lessonId);
  const verdict = checkSafety(session, command);
  console.log(JSON.stringify(verdict, null, 2));
}

async function cmdReset(lessonId: string): Promise<void> {
  // Clear progress
  const ledger = loadLedger();
  delete ledger.lessons[lessonId];
  saveLedger(ledger);

  // Clear cached session
  if (sessions.has(lessonId)) {
    await endSessionAsync(sessions.get(lessonId)!);
    sessions.delete(lessonId);
  }

  console.log(JSON.stringify({ reset: true, lessonId }));
}

function cmdProgress(): void {
  const ledger = loadLedger();
  const summary = getProgressSummary(ledger);
  console.log(JSON.stringify(summary, null, 2));
}

function cmdInfo(lessonId: string): void {
  const lessons = loadAllScenarios();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) throw lessonNotFound(lessonId);
  const info = getLessonInfo(lesson);
  console.log(JSON.stringify(info, null, 2));
}

// ── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await cmdList();
      break;
    case 'start':
      if (!args[1]) throw invalidArgument('terminal-tutor start <lesson-id>');
      await cmdStart(args[1]);
      break;
    case 'eval':
      if (!args[1] || !args[2]) throw invalidArgument('terminal-tutor eval <lesson-id> <json>');
      cmdEval(args[1], args[2]);
      break;
    case 'advance':
      if (!args[1]) throw invalidArgument('terminal-tutor advance <lesson-id>');
      cmdAdvance(args[1]);
      break;
    case 'check':
      if (!args[1] || !args[2]) throw invalidArgument('terminal-tutor check <lesson-id> <command>');
      cmdCheck(args[1], args.slice(2).join(' '));
      break;
    case 'wrap':
      if (!args[1] || !args[2]) throw invalidArgument('terminal-tutor wrap <lesson-id> <command>');
      cmdWrap(args[1], args.slice(2).join(' '));
      break;
    case 'reset':
      if (!args[1]) throw invalidArgument('terminal-tutor reset <lesson-id>');
      await cmdReset(args[1]);
      break;
    case 'progress':
      cmdProgress();
      break;
    case 'info':
      if (!args[1]) throw invalidArgument('terminal-tutor info <lesson-id>');
      cmdInfo(args[1]);
      break;
    case 'runtimes':
      await cmdRuntimes();
      break;
    case 'tracks':
      await cmdTracks();
      break;
    case 'track':
      if (!args[1]) throw invalidArgument('terminal-tutor track <track-id>');
      cmdTrack(args[1]);
      break;
    case 'mastery':
      if (!args[1]) throw invalidArgument('terminal-tutor mastery <lesson-id>');
      cmdMastery(args[1]);
      break;
    case 'next':
      cmdNext();
      break;
    case 'doctor':
      await cmdDoctor();
      break;
    case 'transcript':
      if (!args[1]) throw invalidArgument('terminal-tutor transcript <lesson-id>');
      cmdTranscript(args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printUsage();
      break;
    default:
      throw new TutorError({
        code: 'INPUT_UNKNOWN_COMMAND',
        message: `Unknown command: ${command}`,
        hint: 'Run "terminal-tutor help" for available commands.',
      });
  }
}

const debug = process.argv.includes('--debug');
main().catch((err) => handleError(err, debug));
