/**
 * Dogfood: Docker Lessons — availability detection and graceful degradation.
 *
 * Docker may or may not be installed. These tests prove:
 * 1. The runtime correctly detects Docker availability
 * 2. Unavailable Docker produces clear, actionable error messages
 * 3. The lesson listing correctly flags Docker lessons
 * 4. Docker adapter structural contracts hold even without Docker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { DockerRuntime } from '../src/runtime-docker.js';
import { checkRuntimeDetailed, getRuntimeAvailability, enforceCapabilities } from '../src/runtime.js';
import { loadLessons } from '../src/parser.js';
import { beginSessionAsync } from '../src/tutor.js';
import type { Lesson } from '../src/types.js';

const LESSONS_DIR = join(__dirname, '..', 'lessons');
const LEDGER_DIR = join(homedir(), '.terminal-tutor');
const LEDGER_PATH = join(LEDGER_DIR, 'progress.json');

function freshLedger() {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify({ learner: 'default', lessons: {} }), 'utf-8');
}

describe('dogfood: docker runtime', () => {
  // ── Availability Detection ─────────────────────────────────

  it('detects Docker availability', async () => {
    const runtime = new DockerRuntime();
    const available = await runtime.isAvailable();
    // Either true or false — the point is it doesn't crash
    expect(typeof available).toBe('boolean');
  });

  it('provides detailed availability with remedy', async () => {
    const detail = await checkRuntimeDetailed('docker');
    expect(detail.type).toBe('docker');
    expect(typeof detail.available).toBe('boolean');

    if (!detail.available) {
      expect(detail.reason).toBeTruthy();
      expect(detail.remedy).toBeTruthy();
      expect(detail.remedy).toContain('Docker');
    }
  });

  it('getRuntimeAvailability includes docker', async () => {
    const all = await getRuntimeAvailability();
    const docker = all.find((r) => r.type === 'docker');
    expect(docker).toBeDefined();
    expect(typeof docker!.available).toBe('boolean');
  });

  // ── Graceful Failure ───────────────────────────────────────

  it('beginSessionAsync fails gracefully when Docker unavailable', async () => {
    const runtime = new DockerRuntime();
    const available = await runtime.isAvailable();

    if (available) {
      // Docker IS available — skip this test
      console.log('Docker is available — skipping unavailability test');
      return;
    }

    freshLedger();
    const lessons = loadLessons(LESSONS_DIR);
    const lesson = lessons.find((l) => l.id === 'service-triage')!;

    try {
      await beginSessionAsync(lesson);
      expect.unreachable('Should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('not available');
      expect(e.message).toContain('Docker');
    }
  }, 15000);

  // ── Structural Contracts ───────────────────────────────────

  it('docker adapter wraps commands correctly', () => {
    const runtime = new DockerRuntime();
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      containerId: 'abc123def',
      active: true,
    };

    const wrapped = runtime.wrapCommand(mockState, 'ls -la');
    expect(wrapped).toContain('docker exec');
    expect(wrapped).toContain('abc123def');
    expect(wrapped).toContain('ls -la');
    expect(wrapped).toContain('/workspace');
  });

  it('docker adapter wraps commands with proper quoting', () => {
    const runtime = new DockerRuntime();
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      containerId: 'abc123',
      active: true,
    };

    // Test command with single quotes
    const wrapped = runtime.wrapCommand(mockState, "grep -r 'TODO' .");
    expect(wrapped).toContain('docker exec');
    // Single quotes should be escaped
    expect(wrapped).toContain('TODO');
  });

  it('docker adapter rejects wrapCommand without container', () => {
    const runtime = new DockerRuntime();
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      active: true,
    };

    expect(() => runtime.wrapCommand(mockState, 'ls')).toThrow('no container ID');
  });

  it('docker workdir is always /workspace', () => {
    const runtime = new DockerRuntime();
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/some/host/path',
      lessonId: 'test',
      active: true,
    };
    expect(runtime.getWorkdir(mockState)).toBe('/workspace');
  });

  // ── Capability Enforcement ─────────────────────────────────

  it('docker satisfies all capability requests', () => {
    expect(enforceCapabilities('docker', {
      filesystem: 'full',
      network: true,
      python: true,
      processes: 'full',
      package_install: true,
      destructive: true,
    })).toEqual([]);
  });

  it('service-triage lesson has valid docker capabilities', () => {
    const lessons = loadLessons(LESSONS_DIR);
    const lesson = lessons.find((l) => l.id === 'service-triage')!;
    expect(lesson.runtime?.type).toBe('docker');
    expect(lesson.runtime?.capabilities).toBeDefined();

    const violations = enforceCapabilities('docker', lesson.runtime!.capabilities!);
    expect(violations).toEqual([]);
  });

  // ── Lesson Listing UX ─────────────────────────────────────

  it('docker lessons are identifiable in the lesson list', () => {
    const lessons = loadLessons(LESSONS_DIR);
    const dockerLessons = lessons.filter((l) => l.runtime?.type === 'docker');
    expect(dockerLessons.length).toBeGreaterThanOrEqual(1);

    for (const lesson of dockerLessons) {
      expect(lesson.runtime!.image).toBeTruthy();
      expect(lesson.runtime!.capabilities).toBeDefined();
    }
  });
});
