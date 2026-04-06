/**
 * Runtime harness for E2E tests.
 *
 * Standardized spawn/teardown for the real sonic-runtime binary.
 * Ensures consistent startup timeout, stderr capture, and cleanup.
 * Logs chosen binary path and runtime version on startup.
 * Provides capability probing for stale-binary detection.
 */
import { join } from "node:path";
import { SidecarBackend } from "./sidecar-backend.js";
import {
  resolveRuntime,
  writeTestWav,
  createFixtureDir,
  type Resolved,
} from "./test-fixtures.js";

export interface RuntimeHarnessOptions {
  /** Override runtime binary path (default: auto-resolve). */
  runtimePath?: string;
  /** Override fixture directory (default: auto-create temp dir). */
  fixtureDir?: string;
  /** Startup/handshake timeout in ms (default: 10000). */
  startupTimeoutMs?: number;
  /** Request timeout in ms (default: 10000). */
  requestTimeoutMs?: number;
}

/**
 * Result of probing the runtime for its capabilities.
 * If the probe fails (stale binary without get_capabilities), features is empty.
 */
export interface CapabilityProbe {
  ok: boolean;
  features: string[];
  protocol?: string;
  engines?: string[];
  error?: string;
}

/**
 * Manages a real sonic-runtime process for E2E testing.
 *
 * Usage:
 * ```
 * const harness = new RuntimeHarness();
 * await harness.start();
 * // use harness.backend for protocol calls
 * await harness.dispose();
 * ```
 */
export class RuntimeHarness {
  #backend: SidecarBackend | null = null;
  #stderrLog: string[] = [];
  #fixtureDir: string;
  #fixtureCleanup: (() => void) | null = null;
  #runtimePath: string;
  #opts: Required<
    Pick<RuntimeHarnessOptions, "startupTimeoutMs" | "requestTimeoutMs">
  >;
  #disposed = false;
  #wavPath: string;

  constructor(opts: RuntimeHarnessOptions = {}) {
    this.#opts = {
      startupTimeoutMs: opts.startupTimeoutMs ?? 10_000,
      requestTimeoutMs: opts.requestTimeoutMs ?? 10_000,
    };

    // Resolve runtime binary
    if (opts.runtimePath) {
      this.#runtimePath = opts.runtimePath;
    } else {
      const resolved = resolveRuntime();
      if (!resolved.ok) {
        throw new Error(`Cannot create RuntimeHarness: ${resolved.skip}`);
      }
      this.#runtimePath = resolved.value;
    }

    // Set up fixture directory
    if (opts.fixtureDir) {
      this.#fixtureDir = opts.fixtureDir;
    } else {
      const fixture = createFixtureDir("sonic-e2e");
      this.#fixtureDir = fixture.dir;
      this.#fixtureCleanup = fixture.cleanup;
    }

    this.#wavPath = join(this.#fixtureDir, "test-440hz.wav");
  }

  /** Path to the generated test WAV file. */
  get wavPath(): string {
    return this.#wavPath;
  }

  /** The fixture directory used by this harness. */
  get fixtureDir(): string {
    return this.#fixtureDir;
  }

  /** Captured stderr lines from the runtime process. */
  get stderr(): string[] {
    return this.#stderrLog;
  }

  /** The SidecarBackend instance (only valid after start()). */
  get backend(): SidecarBackend {
    if (!this.#backend) {
      throw new Error("RuntimeHarness not started — call start() first");
    }
    return this.#backend;
  }

  /** Whether the runtime is alive and responding. */
  get alive(): boolean {
    return this.#backend?.alive ?? false;
  }

  /** The runtime binary path used by this harness. */
  get runtimePath(): string {
    return this.#runtimePath;
  }

  /** Runtime version info from the handshake (null before start). */
  get runtimeVersion(): { name: string; version: string; protocol: string } | null {
    return this.#backend?.runtimeVersion ?? null;
  }

  /**
   * Start the runtime: generate test WAV, spawn process, complete handshake.
   * Logs the chosen binary path and runtime version to stderr for diagnostics.
   */
  async start(): Promise<void> {
    if (this.#disposed) {
      throw new Error("RuntimeHarness already disposed");
    }

    // Generate test WAV
    writeTestWav(this.#wavPath);

    // Create and start backend
    this.#backend = new SidecarBackend({
      executablePath: this.#runtimePath,
      requestTimeoutMs: this.#opts.requestTimeoutMs,
      handshakeTimeoutMs: this.#opts.startupTimeoutMs,
      onStderr: (line) => this.#stderrLog.push(line),
      onExit: (code, signal) => {
        if (code !== null && code !== 0) {
          console.error(
            `[e2e] runtime exited: code=${code} signal=${signal}`,
          );
        }
      },
    });

    await this.#backend.start();

    // Log binary path and version for diagnostics
    const ver = this.#backend.runtimeVersion;
    const verStr = ver
      ? `${ver.name} v${ver.version} (${ver.protocol})`
      : "unknown";
    console.error(`[e2e] binary: ${this.#runtimePath}`);
    console.error(`[e2e] runtime: ${verStr}`);
  }

  /**
   * Probe the runtime for capabilities. Returns features list on success,
   * or an error description if the binary is too old to support get_capabilities.
   *
   * Use this to skip/fail suites that require specific features rather than
   * letting them fail with confusing "method_not_found" errors.
   */
  async probeCapabilities(): Promise<CapabilityProbe> {
    if (!this.#backend) {
      return { ok: false, features: [], error: "RuntimeHarness not started" };
    }
    try {
      const caps = await this.#backend.getCapabilities();
      return {
        ok: true,
        features: caps.features,
        protocol: caps.protocol,
        engines: caps.engines,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        features: [],
        error: `get_capabilities failed: ${msg}. Runtime binary may be stale — rebuild with: dotnet publish -c Release -r win-x64`,
      };
    }
  }

  /**
   * Dispose: kill the runtime and clean up fixtures.
   * Safe to call multiple times.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;

    if (this.#backend) {
      try {
        this.#backend.dispose();
      } catch {
        // best effort
      }
      this.#backend = null;
    }

    if (this.#fixtureCleanup) {
      this.#fixtureCleanup();
      this.#fixtureCleanup = null;
    }
  }
}
