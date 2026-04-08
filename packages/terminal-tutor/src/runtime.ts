/**
 * Runtime — adapter factory, capability enforcement, and availability checks.
 *
 * ═══════════════════════════════════════════════════════════════════
 * RUNTIME DOCTRINE
 * ═══════════════════════════════════════════════════════════════════
 *
 * Three tiers. Each has a clear purpose. Do not conflate them.
 *
 * ┌─────────┬────────────────────────┬──────────────────────────┐
 * │ Tier    │ Purpose                │ NOT for                  │
 * ├─────────┼────────────────────────┼──────────────────────────┤
 * │ shell   │ Fast default. File     │ Python packages, process │
 * │         │ navigation, grep,      │ inspection, destructive  │
 * │         │ pipes, git basics.     │ commands, services.      │
 * ├─────────┼────────────────────────┼──────────────────────────┤
 * │ venv    │ Python fidelity. Real  │ Containment. Safety.     │
 * │         │ pip, pytest, import    │ Destructive practice.    │
 * │         │ errors, package bugs.  │ Process control.         │
 * ├─────────┼────────────────────────┼──────────────────────────┤
 * │ docker  │ Actual containment.    │ Simple grep/file lessons │
 * │         │ Services, ports,       │ (too heavy). Anything    │
 * │         │ destructive practice,  │ that doesn't need real   │
 * │         │ process triage, full   │ isolation.               │
 * │         │ filesystem reset.      │                          │
 * └─────────┴────────────────────────┴──────────────────────────┘
 *
 * Key law: venv is a dependency boundary, NOT a safety boundary.
 * Only docker provides actual containment. If a lesson needs
 * destructive practice, it MUST use docker.
 *
 * Capability enforcement prevents lessons from lying:
 * - A shell lesson cannot declare destructive: true
 * - A venv lesson cannot declare processes: 'full'
 * - Only docker can satisfy all capability combinations
 * ═══════════════════════════════════════════════════════════════════
 */

import type {
  RuntimeSpec,
  ResolvedRuntime,
  RuntimeAdapter,
  RuntimeType,
  CapabilitySpec,
  RuntimeAvailability,
} from './types.js';
import { ShellRuntime } from './runtime-shell.js';
import { VenvRuntime } from './runtime-venv.js';
import { DockerRuntime } from './runtime-docker.js';

// ── Default capabilities per runtime ─────────────────────────────

const DEFAULT_CAPABILITIES: Record<RuntimeType, CapabilitySpec> = {
  shell: {
    filesystem: 'workspace-only',
    network: false,
    git: true,
    python: false,
    processes: 'none',
    package_install: false,
    destructive: false,
  },
  venv: {
    filesystem: 'workspace-only',
    network: false,
    git: true,
    python: true,
    processes: 'none',
    package_install: true,
    destructive: false,
  },
  docker: {
    filesystem: 'full',
    network: false,
    git: true,
    python: true,
    processes: 'full',
    package_install: true,
    destructive: true,
  },
};

/** What each runtime can maximally provide */
const RUNTIME_CEILING: Record<RuntimeType, CapabilitySpec> = {
  shell: {
    filesystem: 'workspace-only',
    network: false,
    git: true,
    python: false,
    processes: 'none',
    package_install: false,
    destructive: false,
  },
  venv: {
    filesystem: 'workspace-only',
    network: false,
    git: true,
    python: true,
    processes: 'inspect-only',
    package_install: true,
    destructive: false,
  },
  docker: {
    filesystem: 'full',
    network: true,
    git: true,
    python: true,
    processes: 'full',
    package_install: true,
    destructive: true,
  },
};

// ── Resolve ──────────────────────────────────────────────────────

/** Apply defaults to a runtime spec */
export function resolveRuntime(spec?: RuntimeSpec): ResolvedRuntime {
  const type = spec?.type ?? 'shell';
  return {
    type,
    image: spec?.image ?? 'python:3.12-slim',
    python: spec?.python ?? '3.12',
    requirements: spec?.requirements ?? [],
    reset: spec?.reset ?? 'per_lesson',
    cumulative: spec?.cumulative ?? false,
    network: spec?.network ?? false,
    writable_paths: spec?.writable_paths ?? ['/workspace'],
    timeout: spec?.timeout ?? 30,
    capabilities: spec?.capabilities ?? DEFAULT_CAPABILITIES[type],
  };
}

// ── Capability Enforcement ───────────────────────────────────────

const PROCESS_ORDER = ['none', 'inspect-only', 'full'] as const;
const FS_ORDER = ['workspace-only', 'read-host', 'full'] as const;

export interface CapabilityViolation {
  capability: string;
  required: string;
  ceiling: string;
  runtime: RuntimeType;
}

/**
 * Check if a runtime can satisfy declared capabilities.
 * Returns violations — empty array means the runtime is sufficient.
 */
export function enforceCapabilities(
  type: RuntimeType,
  required: CapabilitySpec,
): CapabilityViolation[] {
  const ceiling = RUNTIME_CEILING[type];
  const violations: CapabilityViolation[] = [];

  // Boolean capabilities: required=true but ceiling=false → violation
  if (required.network && !ceiling.network) {
    violations.push({ capability: 'network', required: 'true', ceiling: 'false', runtime: type });
  }
  if (required.python && !ceiling.python) {
    violations.push({ capability: 'python', required: 'true', ceiling: 'false', runtime: type });
  }
  if (required.package_install && !ceiling.package_install) {
    violations.push({ capability: 'package_install', required: 'true', ceiling: 'false', runtime: type });
  }
  if (required.destructive && !ceiling.destructive) {
    violations.push({ capability: 'destructive', required: 'true', ceiling: 'false', runtime: type });
  }
  if (required.git && !ceiling.git) {
    violations.push({ capability: 'git', required: 'true', ceiling: 'false', runtime: type });
  }

  // Ordered capabilities: required level > ceiling level → violation
  if (required.processes) {
    const reqIdx = PROCESS_ORDER.indexOf(required.processes);
    const ceilIdx = PROCESS_ORDER.indexOf(ceiling.processes || 'none');
    if (reqIdx > ceilIdx) {
      violations.push({
        capability: 'processes',
        required: required.processes,
        ceiling: ceiling.processes || 'none',
        runtime: type,
      });
    }
  }

  if (required.filesystem) {
    const reqIdx = FS_ORDER.indexOf(required.filesystem);
    const ceilIdx = FS_ORDER.indexOf(ceiling.filesystem || 'workspace-only');
    if (reqIdx > ceilIdx) {
      violations.push({
        capability: 'filesystem',
        required: required.filesystem,
        ceiling: ceiling.filesystem || 'workspace-only',
        runtime: type,
      });
    }
  }

  return violations;
}

/**
 * Format capability violations into a user-readable message.
 */
export function formatViolations(violations: CapabilityViolation[]): string {
  if (violations.length === 0) return '';
  const lines = violations.map(
    (v) => `  - ${v.capability}: lesson requires "${v.required}" but ${v.runtime} only supports "${v.ceiling}"`,
  );
  return `This lesson cannot run on the "${violations[0].runtime}" runtime:\n${lines.join('\n')}`;
}

// ── Adapter Registry ─────────────────────────────────────────────

const adapters: Record<RuntimeType, RuntimeAdapter> = {
  shell: new ShellRuntime(),
  venv: new VenvRuntime(),
  docker: new DockerRuntime(),
};

/** Get the adapter for a runtime type */
export function getAdapter(type: RuntimeType): RuntimeAdapter {
  return adapters[type];
}

// ── Availability ─────────────────────────────────────────────────

/** Detailed availability check with remedy guidance */
export async function checkRuntimeDetailed(type: RuntimeType): Promise<RuntimeAvailability> {
  const adapter = adapters[type];
  const available = await adapter.isAvailable();

  if (available) {
    return { type, available: true };
  }

  const remedies: Record<RuntimeType, { reason: string; remedy: string }> = {
    shell: {
      reason: 'Shell should always be available',
      remedy: 'This is unexpected. Check your system PATH.',
    },
    venv: {
      reason: 'Python 3 with venv support is not installed',
      remedy: 'Install Python 3.10+: https://python.org/downloads/ (ensure "Add to PATH" is checked)',
    },
    docker: {
      reason: 'Docker is not installed or the daemon is not running',
      remedy: 'Install Docker Desktop: https://docker.com/products/docker-desktop/ and ensure it is running',
    },
  };

  return {
    type,
    available: false,
    reason: remedies[type].reason,
    remedy: remedies[type].remedy,
  };
}

/** Quick boolean availability for all runtimes */
export async function getRuntimeCapabilities(): Promise<Record<RuntimeType, boolean>> {
  const [shell, venv, docker] = await Promise.all([
    adapters.shell.isAvailable(),
    adapters.venv.isAvailable(),
    adapters.docker.isAvailable(),
  ]);
  return { shell, venv, docker };
}

/** Detailed availability for all runtimes */
export async function getRuntimeAvailability(): Promise<RuntimeAvailability[]> {
  return Promise.all([
    checkRuntimeDetailed('shell'),
    checkRuntimeDetailed('venv'),
    checkRuntimeDetailed('docker'),
  ]);
}
