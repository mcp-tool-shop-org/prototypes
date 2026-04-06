import type {
  DeviceInfo,
  PlaybackState,
  PlayOptions,
  SonicCommands,
  SonicError,
  Source,
} from "@sonic-core/types";
import { LeaseWatcher } from "./lease-watcher.js";
import { PlaybackRegistry } from "./registry.js";

/**
 * Platform-specific audio backend that the engine delegates actual I/O to.
 */
export interface AudioBackend {
  play(id: string, source: Source, options: PlayOptions): Promise<void>;
  pause(id: string): Promise<void>;
  resume(id: string): Promise<void>;
  stop(id: string, fade_out_ms?: number): Promise<void>;
  seek(id: string, position_ms: number): Promise<void>;
  set_volume(id: string, level: number, fade_ms?: number): Promise<void>;
  set_pan(id: string, value: number, ramp_ms?: number): Promise<void>;
  get_devices(): Promise<DeviceInfo[]>;
  set_output_device(device_id: string): Promise<void>;
  get_position_ms(id: string): Promise<number>;
  get_duration_ms(id: string): Promise<number | null>;
}

export class SonicEngine implements SonicCommands {
  readonly #registry = new PlaybackRegistry();
  readonly #backend: AudioBackend;
  readonly #lease_watcher: LeaseWatcher;
  #default_device_id = "device_default";

  constructor(backend: AudioBackend) {
    this.#backend = backend;
    this.#lease_watcher = new LeaseWatcher(
      this.#registry,
      (id) => void this.#expire_lease(id),
    );
    this.#lease_watcher.start();
  }

  async play(source: Source, options: PlayOptions = {}): Promise<string> {
    const id = this.#registry.create(source, options, this.#default_device_id);
    await this.#backend.play(id, source, options);
    return id;
  }

  async pause(playback_id: string, fade_out_ms?: number): Promise<void> {
    this.#registry.require(playback_id);
    if (fade_out_ms !== undefined) {
      await this.#backend.set_volume(playback_id, 0, fade_out_ms);
    }
    await this.#backend.pause(playback_id);
    this.#registry.update(playback_id, { status: "paused" });
  }

  async resume(playback_id: string, fade_in_ms?: number): Promise<void> {
    const entry = this.#registry.require(playback_id);
    await this.#backend.resume(playback_id);
    this.#registry.update(playback_id, { status: "playing" });
    if (fade_in_ms !== undefined) {
      await this.#backend.set_volume(playback_id, entry.volume, fade_in_ms);
    }
  }

  async stop(playback_id: string, fade_out_ms?: number): Promise<void> {
    this.#registry.require(playback_id);
    this.#registry.update(playback_id, { status: "stopping" });
    await this.#backend.stop(playback_id, fade_out_ms);
    this.#registry.remove(playback_id);
  }

  async seek(playback_id: string, position_ms: number): Promise<void> {
    const entry = this.#registry.require(playback_id);
    if (entry.source.kind === "synthesis") {
      throw this.#error("seek_unsupported", "Cannot seek synthesis playback");
    }
    await this.#backend.seek(playback_id, position_ms);
    this.#registry.update(playback_id, { position_ms });
  }

  async set_volume(
    target: string,
    level: number,
    fade_ms?: number,
  ): Promise<void> {
    this.#registry.require(target);
    await this.#backend.set_volume(target, level, fade_ms);
    this.#registry.update(target, { volume: level });
  }

  async set_pan(
    target: string,
    value: number,
    ramp_ms?: number,
  ): Promise<void> {
    this.#registry.require(target);
    await this.#backend.set_pan(target, value, ramp_ms);
    this.#registry.update(target, { pan: value });
  }

  async set_spatial_position(
    _target: string,
    _x: number,
    _y: number,
    _z: number,
    _ramp_ms?: number,
  ): Promise<void> {
    throw this.#error(
      "engine_busy",
      "Spatial positioning not yet implemented",
    );
  }

  async get_devices(): Promise<DeviceInfo[]> {
    return this.#backend.get_devices();
  }

  async set_output_device(device_id: string): Promise<void> {
    await this.#backend.set_output_device(device_id);
    this.#default_device_id = device_id;
  }

  async renew_lease(playback_id: string, lease_ms: number): Promise<void> {
    this.#registry.require(playback_id);
    this.#registry.update(playback_id, {
      lease_expires_at: Date.now() + lease_ms,
    });
  }

  async get_playback_state(playback_id: string): Promise<PlaybackState> {
    const entry = this.#registry.require(playback_id);
    if (entry.status === "playing") {
      const pos = await this.#backend.get_position_ms(playback_id);
      entry.position_ms = pos;
      const dur = await this.#backend.get_duration_ms(playback_id);
      entry.duration_ms = dur;
    }
    return this.#registry.toState(entry);
  }

  async replace_playback(
    target_playback_id: string,
    source: Source,
    options: PlayOptions = {},
  ): Promise<string> {
    await this.stop(
      target_playback_id,
      options.crossfade_ms ?? options.fade_out_ms,
    );
    return this.play(source, options);
  }

  /**
   * Handle a runtime playback_ended event.
   * For "completed" (natural end), removes the registry entry.
   * For "stopped" (explicit stop), the stop() call path already cleaned up.
   */
  handlePlaybackEnded(playbackId: string, reason: "completed" | "stopped"): void {
    if (reason === "completed") {
      this.#registry.remove(playbackId);
    }
  }

  dispose(): void {
    this.#lease_watcher.stop();
  }

  async #expire_lease(playback_id: string): Promise<void> {
    const entry = this.#registry.get(playback_id);
    if (!entry || entry.status !== "playing") return;
    this.#registry.update(playback_id, { status: "stopping" });
    await this.#backend
      .stop(playback_id, entry.options.fade_out_ms ?? 500)
      .catch(() => {});
    this.#registry.remove(playback_id);
  }

  #error(code: SonicError["code"], message: string): SonicEngineError {
    return new SonicEngineError({ code, message, retryable: false });
  }
}

export class SonicEngineError extends Error {
  readonly sonic: SonicError;
  constructor(err: SonicError) {
    super(err.message);
    this.name = "SonicEngineError";
    this.sonic = err;
  }
}
