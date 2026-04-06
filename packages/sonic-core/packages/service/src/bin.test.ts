/**
 * Service-level integration test: verifies the full wiring path
 * that bin.ts uses — SidecarBackend → SonicEngine → tool dispatch.
 *
 * Uses a mock runtime (same pattern as engine tests) but exercises
 * the service-layer construction: backend selection, engine creation,
 * tool dispatch, event observation, and graceful shutdown.
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SonicEngine, NullBackend, SidecarBackend } from "@sonic-core/engine";
import type { AudioBackend } from "@sonic-core/engine";
import type { RuntimeEvent } from "@sonic-core/types";
import { CommandRouter } from "./router.js";

// ── Mock runtime that handles the full service path ──

const SERVICE_MOCK_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
let handleCounter = 0;

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }

  const id = req.id;
  const method = req.method;
  const params = req.params || {};
  let result = null;
  let error = null;

  switch (method) {
    case "version":
      result = { name: "sonic-runtime", version: "0.3.0", protocol: "ndjson-stdio-v1" };
      break;
    case "load_asset":
      handleCounter++;
      result = { handle: "h_svc" + handleCounter.toString().padStart(6, "0") };
      break;
    case "synthesize":
      // Emit events interleaved with response
      process.stdout.write(JSON.stringify({
        event: "synthesis_started",
        data: { handle: "h_synth001", engine: params.engine, voice: params.voice }
      }) + "\\n");
      handleCounter++;
      result = { handle: "h_synth" + handleCounter.toString().padStart(6, "0"), duration_ms: 2500, sample_rate: 24000, channels: 1 };
      break;
    case "play":
      // Simulate natural completion after a short delay for non-looping playback
      if (!params.loop) {
        var playHandle = params.handle;
        setTimeout(() => {
          process.stdout.write(JSON.stringify({
            event: "playback_ended",
            data: { handle: playHandle, reason: "completed" }
          }) + "\\n");
        }, 50);
      }
      break;
    case "pause":
    case "resume":
    case "stop":
    case "seek":
    case "set_volume":
    case "set_pan":
      break;
    case "get_position":
      result = { position_ms: 500 };
      break;
    case "get_duration":
      result = { duration_ms: 3000 };
      break;
    case "list_devices":
      result = [
        { device_id: "dev_1", name: "Speakers", kind: "output", is_default: true, channels: 2, sample_rates: [48000] }
      ];
      break;
    case "set_device":
      break;
    case "get_health":
      result = { status: "ok", uptime_ms: 1000, active_handles: 0, model_loaded: true, voices_loaded: 2, espeak_available: true };
      break;
    case "get_capabilities":
      result = { engines: ["kokoro"], features: ["synthesis", "playback"], protocol: "ndjson-stdio-v1", synthesis_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 24000, channels: 1, bit_depth: 16 }, playback_formats: ["wav"] };
      break;
    case "list_voices":
      result = [{ id: "af_heart", language: "en-us", gender: "female" }];
      break;
    case "get_model_status":
      result = { loaded: true, path: "/models/kokoro.onnx", load_time_ms: 100, inference_count: 0 };
      break;
    default:
      error = { code: "method_not_found", message: "Unknown: " + method, retryable: false };
  }

  if (error) {
    process.stdout.write(JSON.stringify({ id, error }) + "\\n");
  } else {
    process.stdout.write(JSON.stringify({ id, result }) + "\\n");
  }
});
`;

const MOCK_DIR = join(tmpdir(), "sonic-service-test-" + process.pid);
const MOCK_PATH = join(MOCK_DIR, "service-mock.cjs");

mkdirSync(MOCK_DIR, { recursive: true });
writeFileSync(MOCK_PATH, SERVICE_MOCK_SCRIPT);

let backend: SidecarBackend | null = null;
let engine: SonicEngine | null = null;

afterEach(() => {
  engine?.dispose();
  engine = null;
  backend?.dispose();
  backend = null;
});

// ── Service wiring tests ──

describe("Service integration", () => {
  it("full service path: start → introspection → play → stop → shutdown", async () => {
    const events: RuntimeEvent[] = [];

    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: (evt) => events.push(evt),
    });
    await backend.start();

    // Verify handshake
    assert.ok(backend.alive);
    const ver = backend.runtimeVersion;
    assert.equal(ver?.protocol, "ndjson-stdio-v1");

    // Wire engine + router (same as bin.ts)
    engine = new SonicEngine(backend as AudioBackend);
    const router = new CommandRouter(engine);

    // Introspection through sidecar (not via router — sidecar-specific)
    const health = await backend.getHealth();
    assert.equal(health.status, "ok");

    const caps = await backend.getCapabilities();
    assert.ok(caps.engines.includes("kokoro"));

    // Play through router (same path as MCP tool dispatch)
    const playResult = (await router.dispatch("play", {
      source: { kind: "asset", asset_ref: "file:///test.wav" },
      options: { initial_volume: 0.5 },
    })) as { playback_id: string };
    assert.ok(playResult.playback_id);

    // Get devices through router
    const devResult = (await router.dispatch("get_devices", {})) as {
      devices: unknown[];
    };
    assert.equal(devResult.devices.length, 1);

    // Stop through router
    await router.dispatch("stop", { playback_id: playResult.playback_id });

    // Synthesis through router (triggers events)
    const synthResult = (await router.dispatch("play", {
      source: {
        kind: "synthesis",
        engine: "kokoro",
        voice: "af_heart",
        text: "hello",
      },
    })) as { playback_id: string };
    assert.ok(synthResult.playback_id);

    // Wait for events
    await new Promise((r) => setTimeout(r, 100));
    assert.ok(
      events.some((e) => e.event === "synthesis_started"),
      "synthesis_started event should have been received",
    );

    // Graceful shutdown
    engine!.dispose();
    backend.dispose();
    assert.ok(!backend.alive);
  });

  it("event callback receives typed events during tool dispatch", async () => {
    const events: RuntimeEvent[] = [];

    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: (evt) => events.push(evt),
    });
    await backend.start();

    engine = new SonicEngine(backend as AudioBackend);
    const router = new CommandRouter(engine);

    // Synthesis dispatches events
    await router.dispatch("play", {
      source: {
        kind: "synthesis",
        engine: "kokoro",
        voice: "af_heart",
        text: "test event flow",
      },
    });

    await new Promise((r) => setTimeout(r, 100));

    assert.ok(events.length >= 1);
    const startEvent = events.find((e) => e.event === "synthesis_started");
    assert.ok(startEvent, "should receive synthesis_started");
    assert.equal(startEvent!.event, "synthesis_started");
    if (startEvent!.event === "synthesis_started") {
      assert.equal(startEvent!.data.engine, "kokoro");
      assert.equal(startEvent!.data.voice, "af_heart");
    }
  });

  it("dispose is idempotent and safe", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });
    await backend.start();
    assert.ok(backend.alive);

    // Multiple dispose calls should not throw
    backend.dispose();
    backend.dispose();
    backend.dispose();
    assert.ok(!backend.alive);
  });
});

describe("Natural playback completion", () => {
  it("playback_ended event with reason completed cleans up registry", async () => {
    // Wire onEvent exactly as bin.ts does: resolve handle → engine cleanup.
    // The onEvent closure captures `backend` and `engine` by reference —
    // both are assigned before any events can arrive (events come after play).
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: (evt) => {
        if (evt.event === "playback_ended") {
          const playbackId = backend!.resolveAndRemoveHandle(evt.data.handle);
          if (playbackId) {
            engine!.handlePlaybackEnded(playbackId, evt.data.reason);
          }
        }
      },
    });
    await backend.start();
    engine = new SonicEngine(backend as AudioBackend);
    const router = new CommandRouter(engine);

    // Play (mock emits playback_ended after 50ms)
    const result = (await router.dispatch("play", {
      source: { kind: "asset", asset_ref: "file:///short.wav" },
    })) as { playback_id: string };

    // Verify entry exists before completion
    const stateBefore = await router.dispatch("get_playback_state", {
      playback_id: result.playback_id,
    });
    assert.ok(stateBefore, "entry should exist before natural completion");

    // Wait for the completion event to arrive and be processed
    await new Promise((r) => setTimeout(r, 200));

    // Entry should be removed from registry after natural completion
    await assert.rejects(
      () => router.dispatch("get_playback_state", { playback_id: result.playback_id }),
      "entry should be removed after natural completion",
    );
  });
});

describe("Engine lifecycle (regression: test runner hang)", () => {
  it("dispose clears LeaseWatcher timer so process can exit", () => {
    // SonicEngine starts a LeaseWatcher setInterval on construction.
    // If dispose() is never called, the interval keeps the event loop alive
    // and the test runner hangs indefinitely. This test guards against that.
    const eng = new SonicEngine(new NullBackend());

    // Engine is active — LeaseWatcher interval is running
    // Dispose must clear it so no active handles remain
    eng.dispose();

    // If dispose failed to clear the timer, this test suite would hang
    // after all tests complete — the regression signal is the hang itself.
  });
});

// Cleanup
process.on("exit", () => {
  try {
    rmSync(MOCK_DIR, { recursive: true, force: true });
  } catch {
    // best effort
  }
});
