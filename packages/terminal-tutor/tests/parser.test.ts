import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseLesson, loadLessons, LessonParseError } from '../src/parser.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-parser');

function writeTmpLesson(name: string, content: string): string {
  const path = join(TMP, name);
  writeFileSync(path, content, 'utf-8');
  return path;
}

const VALID_LESSON = `
id: test-lesson
title: "Test Lesson"
difficulty: beginner
estimated_minutes: 5
goal: "Test goal"
workspace:
  scaffold:
    - path: hello.txt
      content: "hello world"
safety:
  blocked_patterns:
    - "rm -rf"
  workspace_only: true
steps:
  - id: step-one
    prompt: "Do the thing"
    check:
      type: output_contains
      expect:
        - "hello"
    hints:
      - "Try this"
reflection: "You did it."
`;

// Ensure TMP exists for all describe blocks
beforeAll(() => {
  mkdirSync(TMP, { recursive: true });
});

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('parseLesson', () => {

  it('parses a valid lesson', () => {
    const path = writeTmpLesson('valid.yaml', VALID_LESSON);
    const lesson = parseLesson(path);
    expect(lesson.id).toBe('test-lesson');
    expect(lesson.title).toBe('Test Lesson');
    expect(lesson.difficulty).toBe('beginner');
    expect(lesson.steps).toHaveLength(1);
    expect(lesson.steps[0].id).toBe('step-one');
    expect(lesson.steps[0].hints).toHaveLength(1);
    expect(lesson.workspace.scaffold).toHaveLength(1);
  });

  it('rejects missing file', () => {
    expect(() => parseLesson('/nonexistent/lesson.yaml')).toThrow(LessonParseError);
  });

  it('rejects missing id', () => {
    const yaml = VALID_LESSON.replace('id: test-lesson', '');
    const path = writeTmpLesson('no-id.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('missing or invalid field: id');
  });

  it('rejects invalid difficulty', () => {
    const yaml = VALID_LESSON.replace('difficulty: beginner', 'difficulty: expert');
    const path = writeTmpLesson('bad-diff.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('difficulty must be one of');
  });

  it('rejects duplicate step ids', () => {
    const yaml = VALID_LESSON.replace(
      'reflection:',
      `  - id: step-one
    prompt: "duplicate"
    check:
      type: exit_code
    hints:
      - "hint"
reflection:`,
    );
    const path = writeTmpLesson('dup-steps.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('duplicate step id');
  });

  it('rejects scaffold paths with traversal', () => {
    const yaml = VALID_LESSON.replace('path: hello.txt', 'path: ../escape.txt');
    const path = writeTmpLesson('traversal.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('not escape workspace');
  });

  it('rejects invalid check type', () => {
    const yaml = VALID_LESSON.replace('type: output_contains', 'type: magic_check');
    const path = writeTmpLesson('bad-check.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('invalid check type');
  });

  it('rejects output_contains without expect', () => {
    const yaml = VALID_LESSON.replace(
      `    check:
      type: output_contains
      expect:
        - "hello"`,
      `    check:
      type: output_contains`,
    );
    const path = writeTmpLesson('no-expect.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('requires non-empty expect');
  });

  it('rejects steps without hints', () => {
    const yaml = VALID_LESSON.replace(
      `    hints:
      - "Try this"`,
      `    hints: []`,
    );
    const path = writeTmpLesson('no-hints.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('must have at least one hint');
  });
});

describe('parseLesson — runtime validation', () => {
  const LESSON_WITH_RUNTIME = VALID_LESSON.replace(
    'workspace:',
    `runtime:
  type: venv
  python: "3.12"
  requirements:
    - pytest
  reset: per_lesson
  timeout: 30
workspace:`,
  );

  it('parses a lesson with valid runtime spec', () => {
    const path = writeTmpLesson('valid-runtime.yaml', LESSON_WITH_RUNTIME);
    const lesson = parseLesson(path);
    expect(lesson.runtime).toBeDefined();
    expect(lesson.runtime!.type).toBe('venv');
    expect(lesson.runtime!.python).toBe('3.12');
    expect(lesson.runtime!.requirements).toEqual(['pytest']);
  });

  it('parses a lesson without runtime (defaults to shell)', () => {
    const path = writeTmpLesson('no-runtime.yaml', VALID_LESSON);
    const lesson = parseLesson(path);
    expect(lesson.runtime).toBeUndefined();
  });

  it('rejects invalid runtime type', () => {
    const yaml = LESSON_WITH_RUNTIME.replace('type: venv', 'type: kubernetes');
    const path = writeTmpLesson('bad-rt-type.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('runtime.type must be one of');
  });

  it('rejects invalid reset policy', () => {
    const yaml = LESSON_WITH_RUNTIME.replace('reset: per_lesson', 'reset: always');
    const path = writeTmpLesson('bad-reset.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('runtime.reset must be one of');
  });

  it('rejects non-numeric timeout', () => {
    const yaml = LESSON_WITH_RUNTIME.replace('timeout: 30', 'timeout: "fast"');
    const path = writeTmpLesson('bad-timeout.yaml', yaml);
    expect(() => parseLesson(path)).toThrow('runtime.timeout must be a positive number');
  });

  it('parses docker runtime spec', () => {
    const dockerYaml = VALID_LESSON.replace(
      'workspace:',
      `runtime:
  type: docker
  image: "python:3.12-slim"
  network: false
  writable_paths:
    - /workspace
workspace:`,
    );
    const path = writeTmpLesson('docker-runtime.yaml', dockerYaml);
    const lesson = parseLesson(path);
    expect(lesson.runtime!.type).toBe('docker');
    expect(lesson.runtime!.image).toBe('python:3.12-slim');
    expect(lesson.runtime!.network).toBe(false);
  });
});

describe('loadLessons', () => {
  it('loads all lessons from the lessons directory', () => {
    const lessonsDir = join(__dirname, '..', 'lessons');
    const lessons = loadLessons(lessonsDir);
    expect(lessons.length).toBeGreaterThanOrEqual(5);
    expect(lessons.map((l) => l.id)).toContain('files-and-navigation');
    expect(lessons.map((l) => l.id)).toContain('pipes-and-search');
    expect(lessons.map((l) => l.id)).toContain('git-basics');
    expect(lessons.map((l) => l.id)).toContain('python-debugging');
    expect(lessons.map((l) => l.id)).toContain('service-triage');
  });

  it('throws for nonexistent directory', () => {
    const badPath = join(tmpdir(), 'terminal-tutor-definitely-not-here-99999');
    expect(() => loadLessons(badPath)).toThrow('not found');
  });
});
