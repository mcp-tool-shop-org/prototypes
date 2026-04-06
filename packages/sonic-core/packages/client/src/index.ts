import type {
  DeviceInfo,
  PlaybackState,
  PlayOptions,
  SonicCommands,
  Source,
} from "@sonic-core/types";

/**
 * Transport-agnostic client that sends commands to a sonic-core service.
 * Subclass or inject a transport to connect over stdio, IPC, WebSocket, etc.
 */
export interface Transport {
  call(method: string, params: Record<string, unknown>): Promise<unknown>;
}

export class SonicClient implements SonicCommands {
  readonly #transport: Transport;

  constructor(transport: Transport) {
    this.#transport = transport;
  }

  async play(source: Source, options?: PlayOptions): Promise<string> {
    const res = (await this.#transport.call("play", {
      source,
      options,
    })) as { playback_id: string };
    return res.playback_id;
  }

  async pause(playback_id: string, fade_out_ms?: number): Promise<void> {
    await this.#transport.call("pause", { playback_id, fade_out_ms });
  }

  async resume(playback_id: string, fade_in_ms?: number): Promise<void> {
    await this.#transport.call("resume", { playback_id, fade_in_ms });
  }

  async stop(playback_id: string, fade_out_ms?: number): Promise<void> {
    await this.#transport.call("stop", { playback_id, fade_out_ms });
  }

  async seek(playback_id: string, position_ms: number): Promise<void> {
    await this.#transport.call("seek", { playback_id, position_ms });
  }

  async set_volume(
    target: string,
    level: number,
    fade_ms?: number,
  ): Promise<void> {
    await this.#transport.call("set_volume", { target, level, fade_ms });
  }

  async set_pan(
    target: string,
    value: number,
    ramp_ms?: number,
  ): Promise<void> {
    await this.#transport.call("set_pan", { target, value, ramp_ms });
  }

  async set_spatial_position(
    target: string,
    x: number,
    y: number,
    z: number,
    ramp_ms?: number,
  ): Promise<void> {
    await this.#transport.call("set_spatial_position", {
      target,
      x,
      y,
      z,
      ramp_ms,
    });
  }

  async get_devices(): Promise<DeviceInfo[]> {
    const res = (await this.#transport.call("get_devices", {})) as {
      devices: DeviceInfo[];
    };
    return res.devices;
  }

  async set_output_device(device_id: string): Promise<void> {
    await this.#transport.call("set_output_device", { device_id });
  }

  async renew_lease(playback_id: string, lease_ms: number): Promise<void> {
    await this.#transport.call("renew_lease", { playback_id, lease_ms });
  }

  async get_playback_state(playback_id: string): Promise<PlaybackState> {
    return (await this.#transport.call("get_playback_state", {
      playback_id,
    })) as PlaybackState;
  }

  async replace_playback(
    target_playback_id: string,
    source: Source,
    options?: PlayOptions,
  ): Promise<string> {
    const res = (await this.#transport.call("replace_playback", {
      target_playback_id,
      source,
      options,
    })) as { playback_id: string };
    return res.playback_id;
  }
}
