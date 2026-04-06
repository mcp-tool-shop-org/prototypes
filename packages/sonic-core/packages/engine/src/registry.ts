import { randomUUID } from "node:crypto";
import type {
  PlaybackState,
  PlaybackStatus,
  PlayOptions,
  Source,
} from "@sonic-core/types";

export interface PlaybackEntry {
  playback_id: string;
  source: Source;
  options: PlayOptions;
  status: PlaybackStatus;
  position_ms: number;
  duration_ms: number | null;
  volume: number;
  pan: number;
  output_device_id: string;
  lease_expires_at: number | null; // epoch ms
  created_at: number;
}

export class PlaybackRegistry {
  readonly #entries = new Map<string, PlaybackEntry>();

  create(source: Source, options: PlayOptions, device_id: string): string {
    const id = `pb_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const now = Date.now();
    this.#entries.set(id, {
      playback_id: id,
      source,
      options,
      status: "playing",
      position_ms: 0,
      duration_ms: null,
      volume: options.initial_volume ?? 1.0,
      pan: options.initial_pan ?? 0,
      output_device_id: options.output_device_id ?? device_id,
      lease_expires_at: options.owner_lease_ms
        ? now + options.owner_lease_ms
        : null,
      created_at: now,
    });
    return id;
  }

  get(id: string): PlaybackEntry | undefined {
    return this.#entries.get(id);
  }

  require(id: string): PlaybackEntry {
    const entry = this.#entries.get(id);
    if (!entry) throw new RegistryError("playback_not_found", id);
    return entry;
  }

  update(id: string, patch: Partial<PlaybackEntry>): void {
    const entry = this.require(id);
    Object.assign(entry, patch);
  }

  remove(id: string): boolean {
    return this.#entries.delete(id);
  }

  all(): PlaybackEntry[] {
    return [...this.#entries.values()];
  }

  toState(entry: PlaybackEntry): PlaybackState {
    return {
      playback_id: entry.playback_id,
      status: entry.status,
      source_kind: entry.source.kind,
      loop: entry.options.loop ?? false,
      position_ms: entry.position_ms,
      duration_ms: entry.duration_ms,
      volume: entry.volume,
      pan: entry.pan,
      output_device_id: entry.output_device_id,
      lease_expires_at: entry.lease_expires_at
        ? new Date(entry.lease_expires_at).toISOString()
        : null,
    };
  }
}

export class RegistryError extends Error {
  constructor(
    public readonly code: string,
    public readonly target: string,
  ) {
    super(`${code}: ${target}`);
    this.name = "RegistryError";
  }
}
