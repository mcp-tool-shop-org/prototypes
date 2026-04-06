import type { SonicEngine } from "@sonic-core/engine";
import type { PlayOptions, Source } from "@sonic-core/types";

/**
 * Maps incoming JSON-RPC–style tool calls to SonicEngine methods.
 *
 * This is the integration point for FastMCP or any other transport.
 * The router validates shape, delegates to the engine, and returns
 * serializable results or error objects.
 */
export class CommandRouter {
  readonly #engine: SonicEngine;

  constructor(engine: SonicEngine) {
    this.#engine = engine;
  }

  async dispatch(
    method: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    switch (method) {
      case "play":
        return {
          playback_id: await this.#engine.play(
            params.source as Source,
            params.options as PlayOptions | undefined,
          ),
        };

      case "pause":
        await this.#engine.pause(
          params.playback_id as string,
          params.fade_out_ms as number | undefined,
        );
        return { ok: true };

      case "resume":
        await this.#engine.resume(
          params.playback_id as string,
          params.fade_in_ms as number | undefined,
        );
        return { ok: true };

      case "stop":
        await this.#engine.stop(
          params.playback_id as string,
          params.fade_out_ms as number | undefined,
        );
        return { ok: true };

      case "seek":
        await this.#engine.seek(
          params.playback_id as string,
          params.position_ms as number,
        );
        return { ok: true };

      case "set_volume":
        await this.#engine.set_volume(
          params.target as string,
          params.level as number,
          params.fade_ms as number | undefined,
        );
        return { ok: true };

      case "set_pan":
        await this.#engine.set_pan(
          params.target as string,
          params.value as number,
          params.ramp_ms as number | undefined,
        );
        return { ok: true };

      case "get_devices":
        return { devices: await this.#engine.get_devices() };

      case "set_output_device":
        await this.#engine.set_output_device(params.device_id as string);
        return { ok: true };

      case "renew_lease":
        await this.#engine.renew_lease(
          params.playback_id as string,
          params.lease_ms as number,
        );
        return { ok: true };

      case "get_playback_state":
        return await this.#engine.get_playback_state(
          params.playback_id as string,
        );

      case "replace_playback":
        return {
          playback_id: await this.#engine.replace_playback(
            params.target_playback_id as string,
            params.source as Source,
            params.options as PlayOptions | undefined,
          ),
        };

      default:
        throw new Error(`Unknown command: ${method}`);
    }
  }
}
