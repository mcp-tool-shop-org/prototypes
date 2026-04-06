import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entry = resolve(__dirname, '..', 'build', 'index.js');

function run(...args: string[]): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync('node', [entry, ...args], {
      encoding: 'utf-8',
      timeout: 10_000,
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

describe('CLI flags', () => {
  it('--version prints version and exits 0', () => {
    const { stdout, exitCode } = run('--version');
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^game-dev-mcp \d+\.\d+\.\d+/);
  });

  it('-V prints version and exits 0', () => {
    const { stdout, exitCode } = run('-V');
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^game-dev-mcp \d+\.\d+\.\d+/);
  });

  it('--help prints usage and exits 0', () => {
    const { stdout, exitCode } = run('--help');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('--version');
    expect(stdout).toContain('--diagnose');
    expect(stdout).toContain('GAMEDEV_MCP_HOST');
  });

  it('-h prints usage and exits 0', () => {
    const { stdout, exitCode } = run('-h');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
  });

  it('--diagnose runs without crashing', () => {
    const { stdout, exitCode } = run('--diagnose');
    // UE5 won't be running, but diagnose should still exit 0 (warn, not fail)
    expect(exitCode).toBe(0);
    expect(stdout).toContain('node_version');
    expect(stdout).toContain('package_version');
    expect(stdout).toContain('config');
  });

  it('--diagnose --json outputs valid JSON', () => {
    const { stdout, exitCode } = run('--diagnose', '--json');
    expect(exitCode).toBe(0);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('checks');
    expect(Array.isArray(result.checks)).toBe(true);
    expect(result.checks.length).toBeGreaterThanOrEqual(4);
  });
});
