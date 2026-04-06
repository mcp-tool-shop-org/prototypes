import { z } from "zod";
import type { FastMCP } from "fastmcp";
import type { SonicEngine } from "@sonic-core/engine";

// ── Shared Zod Schemas ──

const AssetSourceSchema = z.object({
  kind: z.literal("asset"),
  asset_ref: z.string().describe("CID URI, file URI, or registered asset reference"),
});

const SynthesisSourceSchema = z.object({
  kind: z.literal("synthesis"),
  engine: z.string(),
  voice: z.string(),
  text: z.string(),
  speed: z.number().optional(),
});

const SourceSchema = z.discriminatedUnion("kind", [
  AssetSourceSchema,
  SynthesisSourceSchema,
]);

const PlayOptionsSchema = z.object({
  loop: z.boolean().optional(),
  delay_start_ms: z.number().optional(),
  fade_in_ms: z.number().optional(),
  fade_out_ms: z.number().optional(),
  crossfade_ms: z.number().optional(),
  initial_volume: z.number().min(0).max(1).optional(),
  initial_pan: z.number().min(-1).max(1).optional(),
  output_device_id: z.string().optional(),
  owner_lease_ms: z.number().optional(),
  interrupt_mode: z.enum(["replace", "mix", "reject"]).optional(),
}).optional();

// ── Tool Registration ──

export function registerTools(server: FastMCP, engine: SonicEngine): void {
  server.addTool({
    name: "play",
    description: "Start playback of an audio asset or synthesis source. Returns a playback_id.",
    parameters: z.object({
      source: SourceSchema,
      options: PlayOptionsSchema,
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    async execute(args) {
      const id = await engine.play(args.source, args.options ?? undefined);
      return JSON.stringify({ playback_id: id });
    },
  });

  server.addTool({
    name: "pause",
    description: "Pause active playback.",
    parameters: z.object({
      playback_id: z.string(),
      fade_out_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.pause(args.playback_id, args.fade_out_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "resume",
    description: "Resume paused playback.",
    parameters: z.object({
      playback_id: z.string(),
      fade_in_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.resume(args.playback_id, args.fade_in_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "stop",
    description: "Stop playback and release resources.",
    parameters: z.object({
      playback_id: z.string(),
      fade_out_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    async execute(args) {
      await engine.stop(args.playback_id, args.fade_out_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "seek",
    description: "Seek to a position in an asset playback. Not supported for synthesis sources.",
    parameters: z.object({
      playback_id: z.string(),
      position_ms: z.number().min(0),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.seek(args.playback_id, args.position_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "set_volume",
    description: "Set volume level (0–1) on a playback or the master bus.",
    parameters: z.object({
      target: z.string().describe("Playback ID or 'master'"),
      level: z.number().min(0).max(1),
      fade_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.set_volume(args.target, args.level, args.fade_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "set_pan",
    description: "Set stereo pan (-1 left … +1 right) on a playback.",
    parameters: z.object({
      target: z.string().describe("Playback ID"),
      value: z.number().min(-1).max(1),
      ramp_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.set_pan(args.target, args.value, args.ramp_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "set_spatial_position",
    description: "Set 3D spatial position for a playback source.",
    parameters: z.object({
      target: z.string().describe("Playback ID"),
      x: z.number(),
      y: z.number(),
      z: z.number(),
      ramp_ms: z.number().optional(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.set_spatial_position(args.target, args.x, args.y, args.z, args.ramp_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "get_devices",
    description: "List available audio output devices.",
    parameters: z.object({}),
    annotations: { readOnlyHint: true },
    async execute() {
      const devices = await engine.get_devices();
      return JSON.stringify({ devices });
    },
  });

  server.addTool({
    name: "set_output_device",
    description: "Set the default audio output device.",
    parameters: z.object({
      device_id: z.string(),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.set_output_device(args.device_id);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "renew_lease",
    description: "Extend the ownership lease on a playback. Prevents auto-expiry.",
    parameters: z.object({
      playback_id: z.string(),
      lease_ms: z.number().min(1),
    }),
    annotations: { readOnlyHint: false, idempotentHint: true },
    async execute(args) {
      await engine.renew_lease(args.playback_id, args.lease_ms);
      return JSON.stringify({ ok: true });
    },
  });

  server.addTool({
    name: "get_playback_state",
    description: "Get the current state of a playback by ID.",
    parameters: z.object({
      playback_id: z.string(),
    }),
    annotations: { readOnlyHint: true },
    async execute(args) {
      const state = await engine.get_playback_state(args.playback_id);
      return JSON.stringify(state);
    },
  });

  server.addTool({
    name: "replace_playback",
    description: "Replace an active playback with a new source (crossfade supported).",
    parameters: z.object({
      target_playback_id: z.string(),
      source: SourceSchema,
      options: PlayOptionsSchema,
    }),
    annotations: { readOnlyHint: false, destructiveHint: true },
    async execute(args) {
      const id = await engine.replace_playback(
        args.target_playback_id,
        args.source,
        args.options ?? undefined,
      );
      return JSON.stringify({ playback_id: id });
    },
  });
}
