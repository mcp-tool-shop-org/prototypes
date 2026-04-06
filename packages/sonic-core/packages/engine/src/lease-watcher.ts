import type { PlaybackRegistry } from "./registry.js";

export class LeaseWatcher {
  #timer: ReturnType<typeof setInterval> | null = null;
  readonly #registry: PlaybackRegistry;
  readonly #interval_ms: number;
  readonly #on_expire: (playback_id: string) => void;

  constructor(
    registry: PlaybackRegistry,
    on_expire: (playback_id: string) => void,
    interval_ms = 500,
  ) {
    this.#registry = registry;
    this.#on_expire = on_expire;
    this.#interval_ms = interval_ms;
  }

  start(): void {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.#tick(), this.#interval_ms);
  }

  stop(): void {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #tick(): void {
    const now = Date.now();
    for (const entry of this.#registry.all()) {
      if (
        entry.lease_expires_at !== null &&
        entry.lease_expires_at <= now &&
        entry.status === "playing"
      ) {
        this.#on_expire(entry.playback_id);
      }
    }
  }
}
