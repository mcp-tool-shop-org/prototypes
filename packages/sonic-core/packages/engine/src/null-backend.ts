import type { AudioBackend } from "./engine.js";
import type { DeviceInfo, PlayOptions, Source } from "@sonic-core/types";

/**
 * No-op backend for testing. Tracks calls but produces no audio.
 */
export class NullBackend implements AudioBackend {
  readonly calls: { method: string; args: unknown[] }[] = [];

  #record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  async play(id: string, source: Source, options: PlayOptions): Promise<void> {
    this.#record("play", id, source, options);
  }
  async pause(id: string): Promise<void> {
    this.#record("pause", id);
  }
  async resume(id: string): Promise<void> {
    this.#record("resume", id);
  }
  async stop(id: string, fade_out_ms?: number): Promise<void> {
    this.#record("stop", id, fade_out_ms);
  }
  async seek(id: string, position_ms: number): Promise<void> {
    this.#record("seek", id, position_ms);
  }
  async set_volume(
    id: string,
    level: number,
    fade_ms?: number,
  ): Promise<void> {
    this.#record("set_volume", id, level, fade_ms);
  }
  async set_pan(
    id: string,
    value: number,
    ramp_ms?: number,
  ): Promise<void> {
    this.#record("set_pan", id, value, ramp_ms);
  }
  async get_devices(): Promise<DeviceInfo[]> {
    this.#record("get_devices");
    return [
      {
        device_id: "device_default",
        name: "Null Output",
        kind: "output",
        is_default: true,
        channels: 2,
        sample_rates: [44100, 48000],
      },
    ];
  }
  async set_output_device(device_id: string): Promise<void> {
    this.#record("set_output_device", device_id);
  }
  async get_position_ms(_id: string): Promise<number> {
    return 0;
  }
  async get_duration_ms(_id: string): Promise<number | null> {
    return null;
  }
}
