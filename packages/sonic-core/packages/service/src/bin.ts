#!/usr/bin/env node

import { existsSync } from "node:fs";
import { FastMCP } from "fastmcp";
import { SonicEngine, NullBackend, SidecarBackend } from "@sonic-core/engine";
import type { AudioBackend } from "@sonic-core/engine";
import { registerTools } from "./tools.js";

const log = (msg: string) => process.stderr.write(`[sonic-core] ${msg}\n`);

// ── Backend selection ──

const runtimePath = process.env.SONIC_RUNTIME_PATH;

let backend: AudioBackend;
let sidecar: SidecarBackend | null = null;

if (runtimePath) {
  // Validate path exists before attempting spawn
  if (!existsSync(runtimePath)) {
    log(`FATAL: SONIC_RUNTIME_PATH set but file does not exist: ${runtimePath}`);
    log("Verify the path points to the sonic-runtime binary.");
    process.exit(1);
  }

  sidecar = new SidecarBackend({
    executablePath: runtimePath,
    onStderr: (line) => process.stderr.write(`[runtime] ${line}\n`),
    onExit: (code, signal) =>
      log(`runtime exited: code=${code} signal=${signal}`),
    onRestart: (attempt) => log(`runtime auto-restart #${attempt}`),
    onSuspect: (count) =>
      log(`runtime suspect: ${count} consecutive timeouts, killing`),
    onEvent: (evt) => {
      if (evt.event === "playback_ended") {
        const playbackId = sidecar!.resolveAndRemoveHandle(evt.data.handle);
        if (playbackId) {
          engine.handlePlaybackEnded(playbackId, evt.data.reason);
        }
      }
    },
  });

  try {
    await sidecar.start();
    const ver = sidecar.runtimeVersion;
    log(
      `runtime connected: ${ver?.name} v${ver?.version} (${ver?.protocol})`,
    );
  } catch (err) {
    log(`FATAL: failed to start sonic-runtime at ${runtimePath}`);
    log(`${err}`);
    log("Common causes:");
    log("  - Binary is not a valid sonic-runtime executable");
    log("  - Protocol version mismatch (check sonic-runtime version)");
    log("  - Missing runtime assets (models/, voices/, espeak/)");
    process.exit(1);
  }

  backend = sidecar;
} else {
  log("SONIC_RUNTIME_PATH not set — using NullBackend (no audio)");
  backend = new NullBackend();
}

// ── Engine + server ──

const engine = new SonicEngine(backend);

const server = new FastMCP({
  name: "sonic-core",
  version: "0.0.1",
});

registerTools(server, engine);

// ── Graceful shutdown ──

let disposed = false;
function shutdown() {
  if (disposed) return;
  disposed = true;
  engine.dispose();
  sidecar?.dispose();
}

process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

server.start({ transportType: "stdio" });
