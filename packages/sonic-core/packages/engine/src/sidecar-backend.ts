import { spawn, type ChildProcess } from "node:child_process";
import { createInterface, type Interface as ReadlineInterface } from "node:readline";
import type { AudioBackend } from "./engine.js";
import type {
  CapabilitiesResult,
  DeviceInfo,
  DurationResult,
  HealthResult,
  ModelStatusResult,
  PlayOptions,
  PositionResult,
  PreloadResult,
  RuntimeErrorCode,
  RuntimeErrorResponse,
  RuntimeEvent,
  RuntimeRequestMessage,
  RuntimeSuccessResponse,
  SidecarErrorCode,
  Source,
  SynthesisResult,
  ValidateAssetsResult,
  VoiceInfo,
} from "@sonic-core/types";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  method: string;
}

// ── Errors ──

export class SidecarError extends Error {
  readonly code: RuntimeErrorCode | SidecarErrorCode;
  readonly retryable: boolean;

  constructor(code: RuntimeErrorCode | SidecarErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "SidecarError";
    this.code = code;
    this.retryable = retryable;
  }
}

// ── Runtime event parsing ──

const KNOWN_EVENTS = new Set([
  "playback_ended",
  "synthesis_started",
  "synthesis_completed",
  "synthesis_failed",
]);

function parseRuntimeEvent(
  msg: Record<string, unknown>,
): RuntimeEvent | null {
  const eventName = msg.event;
  if (typeof eventName !== "string" || !KNOWN_EVENTS.has(eventName)) {
    return null;
  }
  const data = msg.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const d = data as Record<string, unknown>;
  if (typeof d.handle !== "string") {
    return null;
  }
  // Trust the runtime for field shapes — minimal validation on handle only
  return { event: eventName, data: d } as unknown as RuntimeEvent;
}

// ── Protocol version ──

const SUPPORTED_PROTOCOLS = ["ndjson-stdio-v1"] as const;
type SupportedProtocol = (typeof SUPPORTED_PROTOCOLS)[number];

// ── Options ──

export interface SidecarBackendOptions {
  /** Path to the sonic-runtime binary. */
  executablePath: string;
  /** Arguments to pass to the runtime process. */
  args?: string[];
  /** Timeout in ms for individual requests. Default: 10000. */
  requestTimeoutMs?: number;
  /** Timeout in ms for the initial version handshake. Default: 5000. */
  handshakeTimeoutMs?: number;
  /** Consecutive timeouts before killing the runtime. Default: 3. */
  maxConsecutiveTimeouts?: number;
  /** Auto-restart the runtime on next command after unexpected exit. Default: true. */
  autoRestart?: boolean;
  /** Maximum number of auto-restarts before giving up. Default: 3. */
  maxRestarts?: number;
  /** Called when the runtime writes to stderr. */
  onStderr?: (line: string) => void;
  /** Called when the runtime process exits unexpectedly. */
  onExit?: (code: number | null, signal: string | null) => void;
  /** Called when the runtime is killed due to being suspect (consecutive timeouts). */
  onSuspect?: (consecutiveTimeouts: number) => void;
  /** Called when auto-restart occurs. */
  onRestart?: (attempt: number) => void;
  /** Called when the runtime emits an unsolicited event. */
  onEvent?: (event: RuntimeEvent) => void;
}

// ── SidecarBackend ──

export class SidecarBackend implements AudioBackend {
  readonly #opts: Required<
    Pick<
      SidecarBackendOptions,
      | "requestTimeoutMs"
      | "handshakeTimeoutMs"
      | "maxConsecutiveTimeouts"
      | "autoRestart"
      | "maxRestarts"
    >
  > &
    SidecarBackendOptions;

  #process: ChildProcess | null = null;
  #reader: ReadlineInterface | null = null;
  #nextId = 1;
  #pending = new Map<number, PendingRequest>();
  #handleMap = new Map<string, string>(); // playback_id → runtime handle
  #reverseMap = new Map<string, string>(); // runtime handle → playback_id
  #alive = false;
  #disposed = false;

  // Timeout tracking
  #consecutiveTimeouts = 0;

  // Restart tracking
  #restartCount = 0;
  #runtimeVersion: { name: string; version: string; protocol: string } | null =
    null;

  constructor(opts: SidecarBackendOptions) {
    this.#opts = {
      requestTimeoutMs: 10_000,
      handshakeTimeoutMs: 5_000,
      maxConsecutiveTimeouts: 3,
      autoRestart: true,
      maxRestarts: 3,
      ...opts,
    };
  }

  // ── Lifecycle ──

  async start(): Promise<void> {
    if (this.#alive) return;
    if (this.#disposed) {
      throw new SidecarError(
        "runtime_disposed",
        "Cannot start a disposed SidecarBackend",
      );
    }

    const proc = spawn(this.#opts.executablePath, this.#opts.args ?? [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    this.#process = proc;

    // stderr → diagnostics callback
    const stderrReader = createInterface({ input: proc.stderr! });
    stderrReader.on("line", (line) => this.#opts.onStderr?.(line));

    // stdout → ndjson response reader
    this.#reader = createInterface({ input: proc.stdout! });
    this.#reader.on("line", (line) => this.#onLine(line));

    // process exit detection
    proc.on("exit", (code, signal) => {
      this.#alive = false;
      this.#invalidateHandles();
      this.#rejectAll(
        new SidecarError(
          "runtime_exited",
          `sonic-runtime exited (code=${code}, signal=${signal})`,
        ),
      );
      this.#opts.onExit?.(code, signal);
    });

    proc.on("error", (err) => {
      this.#alive = false;
      this.#invalidateHandles();
      this.#rejectAll(
        new SidecarError("runtime_spawn_failed", err.message),
      );
    });

    this.#alive = true;
    this.#consecutiveTimeouts = 0;

    // Version handshake — must succeed before backend is usable
    const version = (await this.#send(
      "version",
      undefined,
      this.#opts.handshakeTimeoutMs,
    )) as { name: string; version: string; protocol: string };

    this.#validateProtocol(version);
    this.#runtimeVersion = version;
  }

  dispose(): void {
    this.#disposed = true;
    if (!this.#process) return;
    this.#alive = false;
    this.#rejectAll(
      new SidecarError("runtime_disposed", "SidecarBackend disposed"),
    );
    this.#reader?.close();
    this.#reader = null;

    // Try graceful shutdown, then force kill
    try {
      this.#process.stdin?.end();
    } catch {
      // stdin may already be closed
    }
    this.#process.kill();
    this.#process = null;
    this.#handleMap.clear();
    this.#reverseMap.clear();
  }

  get alive(): boolean {
    return this.#alive;
  }

  get consecutiveTimeouts(): number {
    return this.#consecutiveTimeouts;
  }

  get restartCount(): number {
    return this.#restartCount;
  }

  get runtimeVersion(): {
    name: string;
    version: string;
    protocol: string;
  } | null {
    return this.#runtimeVersion;
  }

  // ── AudioBackend implementation ──

  async play(
    id: string,
    source: Source,
    options: PlayOptions,
  ): Promise<void> {
    await this.#ensureAlive();

    if (source.kind === "synthesis") {
      const synthResult = (await this.#send("synthesize", {
        engine: source.engine,
        voice: source.voice,
        text: source.text,
        speed: source.speed,
      })) as SynthesisResult;
      this.#handleMap.set(id, synthResult.handle);
      this.#reverseMap.set(synthResult.handle, id);
      await this.#send("play", {
        handle: synthResult.handle,
        volume: options.initial_volume ?? 1.0,
        pan: options.initial_pan ?? 0,
        fade_in_ms: options.fade_in_ms ?? 0,
        loop: options.loop ?? false,
        ...(options.output_device_id && {
          output_device_id: options.output_device_id,
        }),
      });
      return;
    }

    const loadResult = (await this.#send("load_asset", {
      asset_ref: source.asset_ref,
    })) as { handle: string };

    this.#handleMap.set(id, loadResult.handle);
    this.#reverseMap.set(loadResult.handle, id);

    await this.#send("play", {
      handle: loadResult.handle,
      volume: options.initial_volume ?? 1.0,
      pan: options.initial_pan ?? 0,
      fade_in_ms: options.fade_in_ms ?? 0,
      loop: options.loop ?? false,
      ...(options.output_device_id && {
        output_device_id: options.output_device_id,
      }),
    });
  }

  async pause(id: string): Promise<void> {
    await this.#ensureAlive();
    await this.#send("pause", { handle: this.#requireHandle(id) });
  }

  async resume(id: string): Promise<void> {
    await this.#ensureAlive();
    await this.#send("resume", { handle: this.#requireHandle(id) });
  }

  async stop(id: string, fade_out_ms?: number): Promise<void> {
    const handle = this.#handleMap.get(id);
    if (!handle) return;
    await this.#ensureAlive();
    await this.#send("stop", { handle, fade_out_ms: fade_out_ms ?? 0 });
    this.#handleMap.delete(id);
    this.#reverseMap.delete(handle);
  }

  async seek(id: string, position_ms: number): Promise<void> {
    await this.#ensureAlive();
    await this.#send("seek", {
      handle: this.#requireHandle(id),
      position_ms,
    });
  }

  async set_volume(
    id: string,
    level: number,
    fade_ms?: number,
  ): Promise<void> {
    await this.#ensureAlive();
    await this.#send("set_volume", {
      handle: this.#requireHandle(id),
      level,
      fade_ms: fade_ms ?? 0,
    });
  }

  async set_pan(
    id: string,
    value: number,
    ramp_ms?: number,
  ): Promise<void> {
    await this.#ensureAlive();
    await this.#send("set_pan", {
      handle: this.#requireHandle(id),
      value,
      ramp_ms: ramp_ms ?? 0,
    });
  }

  async get_devices(): Promise<DeviceInfo[]> {
    await this.#ensureAlive();
    const result = (await this.#send("list_devices")) as DeviceInfo[];
    return result.map((d) => ({
      ...d,
      kind: "output" as const,
    }));
  }

  async set_output_device(device_id: string): Promise<void> {
    await this.#ensureAlive();
    await this.#send("set_device", { device_id });
  }

  async get_position_ms(id: string): Promise<number> {
    await this.#ensureAlive();
    const result = (await this.#send("get_position", {
      handle: this.#requireHandle(id),
    })) as PositionResult;
    return result.position_ms;
  }

  async get_duration_ms(id: string): Promise<number | null> {
    await this.#ensureAlive();
    const result = (await this.#send("get_duration", {
      handle: this.#requireHandle(id),
    })) as DurationResult;
    return result.duration_ms;
  }

  // ── Introspection (sidecar-specific, not on AudioBackend) ──

  async getHealth(): Promise<HealthResult> {
    await this.#ensureAlive();
    return (await this.#send("get_health")) as HealthResult;
  }

  async getCapabilities(): Promise<CapabilitiesResult> {
    await this.#ensureAlive();
    return (await this.#send("get_capabilities")) as CapabilitiesResult;
  }

  async listVoices(): Promise<VoiceInfo[]> {
    await this.#ensureAlive();
    return (await this.#send("list_voices")) as VoiceInfo[];
  }

  async preloadModel(): Promise<PreloadResult> {
    await this.#ensureAlive();
    return (await this.#send("preload_model")) as PreloadResult;
  }

  async getModelStatus(): Promise<ModelStatusResult> {
    await this.#ensureAlive();
    return (await this.#send("get_model_status")) as ModelStatusResult;
  }

  async validateAssets(): Promise<ValidateAssetsResult> {
    await this.#ensureAlive();
    return (await this.#send("validate_assets")) as ValidateAssetsResult;
  }

  // ── Wire protocol ──

  #send(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs?: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.#process?.stdin?.writable) {
        reject(
          new SidecarError(
            "runtime_not_running",
            "Runtime process not running",
          ),
        );
        return;
      }

      const id = this.#nextId++;
      const timeout = timeoutMs ?? this.#opts.requestTimeoutMs;

      const timer = setTimeout(() => {
        this.#pending.delete(id);
        this.#onTimeout(method);
        reject(
          new SidecarError(
            "request_timeout",
            `Request ${id} (${method}) timed out after ${timeout}ms`,
            true,
          ),
        );
      }, timeout);

      this.#pending.set(id, { resolve, reject, timer, method });

      const msg: RuntimeRequestMessage = { id, method };
      if (params !== undefined) msg.params = params;

      this.#process.stdin.write(JSON.stringify(msg) + "\n");
    });
  }

  #onLine(raw: string): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    // Runtime event: has "event" field, no "id" field
    if ("event" in msg && !("id" in msg)) {
      const parsed = parseRuntimeEvent(msg);
      if (parsed && this.#opts.onEvent) {
        try {
          this.#opts.onEvent(parsed);
        } catch {
          // Consumer exception must not poison the reader loop
        }
      }
      return;
    }

    const id = msg.id as number;
    const pending = this.#pending.get(id);
    if (!pending) return;

    this.#pending.delete(id);
    clearTimeout(pending.timer);

    // Successful response resets the timeout counter
    this.#consecutiveTimeouts = 0;

    if ("error" in msg && msg.error) {
      const errMsg = msg as unknown as RuntimeErrorResponse;
      pending.reject(
        new SidecarError(
          errMsg.error.code as RuntimeErrorCode,
          errMsg.error.message,
          errMsg.error.retryable,
        ),
      );
    } else {
      const okMsg = msg as unknown as RuntimeSuccessResponse;
      pending.resolve(okMsg.result);
    }
  }

  // ── Timeout tracking ──

  #onTimeout(method: string): void {
    this.#consecutiveTimeouts++;

    if (this.#consecutiveTimeouts >= this.#opts.maxConsecutiveTimeouts) {
      this.#opts.onSuspect?.(this.#consecutiveTimeouts);
      // Kill the suspect runtime — it's wedged
      this.#killSuspect();
    }
  }

  #killSuspect(): void {
    if (!this.#process) return;
    this.#alive = false;
    this.#invalidateHandles();
    this.#rejectAll(
      new SidecarError(
        "runtime_suspect",
        `Runtime killed after ${this.#consecutiveTimeouts} consecutive timeouts`,
      ),
    );
    this.#reader?.close();
    this.#reader = null;
    try {
      this.#process.kill("SIGKILL");
    } catch {
      // already dead
    }
    this.#process = null;
  }

  // ── Handle invalidation ──

  #invalidateHandles(): void {
    this.#handleMap.clear();
    this.#reverseMap.clear();
  }

  // ── Auto-restart ──

  async #ensureAlive(): Promise<void> {
    if (this.#alive) return;
    if (this.#disposed) {
      throw new SidecarError(
        "runtime_disposed",
        "SidecarBackend has been disposed",
      );
    }

    if (!this.#opts.autoRestart) {
      throw new SidecarError(
        "runtime_not_running",
        "sonic-runtime is not running (autoRestart disabled)",
      );
    }

    if (this.#restartCount >= this.#opts.maxRestarts) {
      throw new SidecarError(
        "restart_limit_exceeded",
        `Auto-restart limit reached (${this.#opts.maxRestarts} restarts)`,
      );
    }

    this.#restartCount++;
    this.#consecutiveTimeouts = 0;
    this.#opts.onRestart?.(this.#restartCount);
    await this.start();
  }

  #rejectAll(error: SidecarError): void {
    for (const [id, pending] of this.#pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.#pending.delete(id);
    }
  }

  // ── Protocol validation ──

  #validateProtocol(version: {
    name: string;
    version: string;
    protocol: string;
  }): void {
    const protocol = version.protocol as SupportedProtocol;

    if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
      this.dispose();
      throw new SidecarError(
        "protocol_mismatch",
        `Unsupported protocol "${version.protocol}" from ${version.name} v${version.version}. ` +
          `Supported: ${SUPPORTED_PROTOCOLS.join(", ")}. ` +
          `Update sonic-runtime or sonic-core to a compatible version.`,
      );
    }
  }

  // ── Handle mapping ──

  #requireHandle(playbackId: string): string {
    const handle = this.#handleMap.get(playbackId);
    if (!handle) {
      throw new SidecarError(
        "handle_not_found",
        `No runtime handle for playback ${playbackId}`,
      );
    }
    return handle;
  }

  /**
   * Resolve a runtime handle back to its playback ID and remove the mapping.
   * Returns undefined if the handle is unknown (already removed or never mapped).
   */
  resolveAndRemoveHandle(runtimeHandle: string): string | undefined {
    const playbackId = this.#reverseMap.get(runtimeHandle);
    if (playbackId) {
      this.#reverseMap.delete(runtimeHandle);
      this.#handleMap.delete(playbackId);
    }
    return playbackId;
  }
}
