import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SidecarBackend, SidecarError } from "./sidecar-backend.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AssetSource, SynthesisSource, RuntimeEvent } from "@sonic-core/types";

// ── Mock runtime scripts ──

const MOCK_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
let handleCounter = 0;

rl.on("line", (line) => {
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }

  const id = req.id;
  const method = req.method;
  const params = req.params || {};

  let result = null;
  let error = null;

  switch (method) {
    case "version":
      result = { name: "sonic-runtime", version: "0.1.0", protocol: "ndjson-stdio-v1" };
      break;
    case "load_asset":
      if (!params.asset_ref) {
        error = { code: "invalid_params", message: "Missing asset_ref", retryable: false };
      } else if (params.asset_ref === "file:///nonexistent.wav") {
        error = { code: "invalid_source", message: "File not found", retryable: false };
      } else {
        handleCounter++;
        result = { handle: "h_mock" + handleCounter.toString().padStart(6, "0") };
      }
      break;
    case "play":
    case "pause":
    case "resume":
    case "stop":
    case "seek":
    case "set_volume":
    case "set_pan":
      if (!params.handle) {
        error = { code: "invalid_params", message: "Missing handle", retryable: false };
      } else if (!params.handle.startsWith("h_")) {
        error = { code: "handle_not_found", message: "Unknown handle", retryable: false };
      }
      break;
    case "get_position":
      result = { position_ms: 1234 };
      break;
    case "get_duration":
      result = { duration_ms: 180000 };
      break;
    case "list_devices":
      result = [
        { device_id: "dev_1", name: "Speakers", kind: "output", is_default: true, channels: 2, sample_rates: [44100, 48000] },
        { device_id: "dev_2", name: "Headphones", kind: "output", is_default: false, channels: 2, sample_rates: [48000] }
      ];
      break;
    case "set_device":
      if (!params.device_id) {
        error = { code: "invalid_params", message: "Missing device_id", retryable: false };
      } else if (params.device_id === "dev_gone") {
        error = { code: "device_unavailable", message: "Device not found or unplugged", retryable: false };
      }
      break;
    case "synthesize":
      handleCounter++;
      result = { handle: "h_synth" + handleCounter.toString().padStart(6, "0"), duration_ms: 2500, sample_rate: 24000, channels: 1 };
      break;
    case "get_health":
      result = { status: "ok", uptime_ms: 5000, active_handles: 1, model_loaded: true, voices_loaded: 3, espeak_available: true };
      break;
    case "get_capabilities":
      result = { engines: ["kokoro"], features: ["synthesis", "playback"], protocol: "ndjson-stdio-v1", synthesis_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 24000, channels: 1, bit_depth: 16 }, playback_formats: ["wav"] };
      break;
    case "list_voices":
      result = [
        { id: "af_heart", language: "en-us", gender: "female" },
        { id: "am_adam", language: "en-us", gender: "male" }
      ];
      break;
    case "preload_model":
      result = { loaded: true, load_time_ms: 42 };
      break;
    case "get_model_status":
      result = { loaded: true, path: "/models/kokoro.onnx", load_time_ms: 42, inference_count: 7 };
      break;
    case "validate_assets":
      result = {
        valid: true,
        errors: [],
        warnings: ["espeak-ng-data/ directory not found"],
        model: { available: true, path: "/models/kokoro.onnx" },
        voices: { available: true, path: "/voices", count: 3, voices: ["af_heart", "am_adam", "bf_emma"] },
        espeak: { available: true, path: "/espeak" },
        onnx_runtime: { available: true, path: "/lib/onnxruntime.dll" },
        asset_root: "/opt/sonic-runtime"
      };
      break;
    case "shutdown":
      process.stdout.write(JSON.stringify({ id, result: null }) + "\\n");
      process.exit(0);
      return;
    default:
      error = { code: "method_not_found", message: "Unknown method: " + method, retryable: false };
  }

  if (error) {
    process.stdout.write(JSON.stringify({ id, error }) + "\\n");
  } else {
    process.stdout.write(JSON.stringify({ id, result }) + "\\n");
  }
});
`;

// Script that stalls — never responds to non-version requests
const STALLING_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }
  // Only respond to version — everything else is swallowed
  if (req.method === "version") {
    process.stdout.write(JSON.stringify({
      id: req.id,
      result: { name: "sonic-runtime", version: "0.1.0", protocol: "ndjson-stdio-v1" }
    }) + "\\n");
  }
  // All other methods: silence. The void stares back.
});
`;

// Script that crashes after version handshake
const CRASHING_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
let requestCount = 0;

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }
  requestCount++;
  if (req.method === "version") {
    process.stdout.write(JSON.stringify({
      id: req.id,
      result: { name: "sonic-runtime", version: "0.1.0", protocol: "ndjson-stdio-v1" }
    }) + "\\n");
  } else {
    // Crash on first real request
    process.exit(42);
  }
});
`;

// Script that reports wrong protocol version
const WRONG_PROTOCOL_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }
  if (req.method === "version") {
    process.stdout.write(JSON.stringify({
      id: req.id,
      result: { name: "sonic-runtime", version: "2.0.0", protocol: "ndjson-stdio-v99" }
    }) + "\\n");
  }
});
`;

// Script that emits events interleaved with responses
const EVENT_EMITTING_SCRIPT = `
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }

  if (req.method === "version") {
    process.stdout.write(JSON.stringify({
      id: req.id,
      result: { name: "sonic-runtime", version: "0.3.0", protocol: "ndjson-stdio-v1" }
    }) + "\\n");
    return;
  }

  if (req.method === "synthesize") {
    // Emit event BEFORE response (interleaved)
    process.stdout.write(JSON.stringify({
      event: "synthesis_started",
      data: { handle: "h_synth001", engine: "kokoro", voice: "af_heart" }
    }) + "\\n");
    // Then send the response
    process.stdout.write(JSON.stringify({
      id: req.id,
      result: { handle: "h_synth001", duration_ms: 1500, sample_rate: 24000, channels: 1 }
    }) + "\\n");
    // Emit completion event AFTER response
    process.stdout.write(JSON.stringify({
      event: "synthesis_completed",
      data: { handle: "h_synth001", duration_ms: 1500, inference_ms: 200 }
    }) + "\\n");
    return;
  }

  process.stdout.write(JSON.stringify({ id: req.id, result: null }) + "\\n");
});
`;

// Write mock scripts to temp dir
const MOCK_DIR = join(tmpdir(), "sonic-sidecar-test-" + process.pid);
const MOCK_PATH = join(MOCK_DIR, "mock-runtime.cjs");
const STALLING_PATH = join(MOCK_DIR, "stalling-runtime.cjs");
const CRASHING_PATH = join(MOCK_DIR, "crashing-runtime.cjs");
const WRONG_PROTO_PATH = join(MOCK_DIR, "wrong-proto-runtime.cjs");
const EVENT_PATH = join(MOCK_DIR, "event-runtime.cjs");

mkdirSync(MOCK_DIR, { recursive: true });
writeFileSync(MOCK_PATH, MOCK_SCRIPT);
writeFileSync(STALLING_PATH, STALLING_SCRIPT);
writeFileSync(CRASHING_PATH, CRASHING_SCRIPT);
writeFileSync(WRONG_PROTO_PATH, WRONG_PROTOCOL_SCRIPT);
writeFileSync(EVENT_PATH, EVENT_EMITTING_SCRIPT);

// ── Helpers ──

function createBackend(
  overrides?: Partial<ConstructorParameters<typeof SidecarBackend>[0]>,
): SidecarBackend {
  return new SidecarBackend({
    executablePath: process.execPath,
    args: [MOCK_PATH],
    requestTimeoutMs: 3000,
    handshakeTimeoutMs: 3000,
    autoRestart: false, // disabled by default in tests for predictability
    ...overrides,
  });
}

const src: AssetSource = { kind: "asset", asset_ref: "file:///test.wav" };
const synthSrc: SynthesisSource = {
  kind: "synthesis",
  engine: "kokoro",
  voice: "v1",
  text: "hello world",
};

let backend: SidecarBackend | null = null;

afterEach(() => {
  backend?.dispose();
  backend = null;
});

// ── Core protocol tests ──

describe("SidecarBackend", () => {
  it("starts and completes version handshake", async () => {
    backend = createBackend();
    await backend.start();
    assert.ok(backend.alive);
    assert.deepEqual(backend.runtimeVersion, {
      name: "sonic-runtime",
      version: "0.1.0",
      protocol: "ndjson-stdio-v1",
    });
  });

  it("play loads asset then sends play command", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_test000001", src, {});
  });

  it("play with synthesis sends synthesize then play", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_synth00001", synthSrc, {});
  });

  it("pause/resume/stop use mapped handle", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_test000002", src, {});
    await backend.pause("pb_test000002");
    await backend.resume("pb_test000002");
    await backend.stop("pb_test000002");
  });

  it("stop removes handle mapping", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_test000003", src, {});
    await backend.stop("pb_test000003");
    await assert.rejects(
      () => backend!.pause("pb_test000003"),
      (err: SidecarError) => err.code === "handle_not_found",
    );
  });

  it("set_volume sends to runtime", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_vol001", src, {});
    await backend.set_volume("pb_vol001", 0.5);
  });

  it("set_pan sends to runtime", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_pan001", src, {});
    await backend.set_pan("pb_pan001", -0.75);
  });

  it("seek sends to runtime", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_seek001", src, {});
    await backend.seek("pb_seek001", 5000);
  });

  it("get_position_ms returns position", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_pos001", src, {});
    const pos = await backend.get_position_ms("pb_pos001");
    assert.equal(pos, 1234);
  });

  it("get_duration_ms returns duration", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_dur001", src, {});
    const dur = await backend.get_duration_ms("pb_dur001");
    assert.equal(dur, 180000);
  });

  it("get_devices returns device list", async () => {
    backend = createBackend();
    await backend.start();
    const devices = await backend.get_devices();
    assert.equal(devices.length, 2);
    assert.equal(devices[0].device_id, "dev_1");
    assert.equal(devices[0].name, "Speakers");
    assert.equal(devices[0].is_default, true);
    assert.equal(devices[1].device_id, "dev_2");
  });

  it("set_output_device sends to runtime", async () => {
    backend = createBackend();
    await backend.start();
    await backend.set_output_device("dev_2");
  });

  it("play passes options correctly", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_opts001", src, {
      initial_volume: 0.7,
      initial_pan: -0.5,
      fade_in_ms: 200,
      loop: true,
    });
  });

  it("runtime error translates to SidecarError", async () => {
    backend = createBackend();
    await backend.start();
    const badSource: AssetSource = {
      kind: "asset",
      asset_ref: "file:///nonexistent.wav",
    };
    await assert.rejects(
      () => backend!.play("pb_bad001", badSource, {}),
      (err: SidecarError) => {
        assert.equal(err.code, "invalid_source");
        assert.ok(err.message.includes("File not found"));
        return true;
      },
    );
  });

  it("unmapped playback id throws handle_not_found", async () => {
    backend = createBackend();
    await backend.start();
    await assert.rejects(
      () => backend!.pause("pb_unknown"),
      (err: SidecarError) => err.code === "handle_not_found",
    );
  });

  it("operations on disposed backend throw runtime_disposed", async () => {
    backend = createBackend();
    await backend.start();
    backend.dispose();
    await assert.rejects(
      () => backend!.play("pb_dead001", src, {}),
      (err: SidecarError) => err.code === "runtime_disposed",
    );
  });

  it("dispose is idempotent", async () => {
    backend = createBackend();
    await backend.start();
    backend.dispose();
    backend.dispose();
    assert.ok(!backend.alive);
  });

  it("stderr is captured via callback", async () => {
    const stderrLines: string[] = [];
    const stderrScript = `
      process.stderr.write("[runtime] starting\\n");
      const readline = require("readline");
      const rl = readline.createInterface({ input: process.stdin });
      rl.on("line", (line) => {
        const req = JSON.parse(line);
        if (req.method === "version") {
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: { name: "sonic-runtime", version: "0.1.0", protocol: "ndjson-stdio-v1" }
          }) + "\\n");
        }
      });
    `;
    const stderrPath = join(MOCK_DIR, "stderr-runtime.cjs");
    writeFileSync(stderrPath, stderrScript);

    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [stderrPath],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      onStderr: (line) => stderrLines.push(line),
    });
    await backend.start();
    await new Promise((r) => setTimeout(r, 100));
    assert.ok(stderrLines.some((l) => l.includes("[runtime] starting")));
  });
});

// ── 1. Hung command timeout tests ──

describe("SidecarBackend — timeout tracking", () => {
  it("request times out with request_timeout code", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [STALLING_PATH],
      requestTimeoutMs: 200,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });
    await backend.start();
    await assert.rejects(
      () => backend!.get_devices(),
      (err: SidecarError) => {
        assert.equal(err.code, "request_timeout");
        assert.equal(err.retryable, true);
        return true;
      },
    );
  });

  it("consecutive timeouts increment counter", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [STALLING_PATH],
      requestTimeoutMs: 100,
      handshakeTimeoutMs: 3000,
      maxConsecutiveTimeouts: 10, // high threshold so we can count
      autoRestart: false,
    });
    await backend.start();
    assert.equal(backend.consecutiveTimeouts, 0);

    // Fire two timeouts
    await assert.rejects(() => backend!.get_devices());
    assert.equal(backend.consecutiveTimeouts, 1);
    await assert.rejects(() => backend!.get_devices());
    assert.equal(backend.consecutiveTimeouts, 2);
  });

  it("successful response resets timeout counter", async () => {
    // Use normal mock that responds
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });
    await backend.start();
    // Handshake was successful, counter should be 0
    assert.equal(backend.consecutiveTimeouts, 0);
    // Normal request
    await backend.get_devices();
    assert.equal(backend.consecutiveTimeouts, 0);
  });

  it("kills runtime after maxConsecutiveTimeouts and fires onSuspect", async () => {
    let suspectCount = 0;
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [STALLING_PATH],
      requestTimeoutMs: 100,
      handshakeTimeoutMs: 3000,
      maxConsecutiveTimeouts: 2,
      autoRestart: false,
      onSuspect: (count) => {
        suspectCount = count;
      },
    });
    await backend.start();
    assert.ok(backend.alive);

    // First timeout — not yet killed
    await assert.rejects(() => backend!.get_devices());
    assert.ok(backend.alive);

    // Second timeout — killed
    await assert.rejects(
      () => backend!.get_devices(),
      (err: SidecarError) =>
        err.code === "request_timeout" || err.code === "runtime_suspect",
    );

    // Wait for kill to propagate
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(!backend.alive);
    assert.equal(suspectCount, 2);
  });

  it("future calls after suspect kill return crisp error", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [STALLING_PATH],
      requestTimeoutMs: 100,
      handshakeTimeoutMs: 3000,
      maxConsecutiveTimeouts: 1,
      autoRestart: false,
    });
    await backend.start();

    // Trigger kill
    await assert.rejects(() => backend!.get_devices());
    await new Promise((r) => setTimeout(r, 50));

    // Next call should fail immediately, not hang
    await assert.rejects(
      () => backend!.get_devices(),
      (err: SidecarError) =>
        err.code === "runtime_not_running" ||
        err.code === "runtime_disposed",
    );
  });
});

// ── 2. Restart/recovery tests ──

describe("SidecarBackend — restart/recovery", () => {
  it("detects process exit and rejects in-flight requests", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [CRASHING_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });
    await backend.start();
    assert.ok(backend.alive);

    // This will cause the mock to crash
    await assert.rejects(
      () => backend!.play("pb_crash001", src, {}),
      (err: SidecarError) => err.code === "runtime_exited",
    );
    assert.ok(!backend.alive);
  });

  it("handle map is cleared on process death", async () => {
    // Use normal mock, play, then manually kill it
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [MOCK_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });
    await backend.start();
    await backend.play("pb_handlemap", src, {});

    // Kill the process externally
    backend.dispose();

    // Handles should be gone — even if we somehow try to use them
    // (autoRestart=false so this will throw runtime_disposed)
    await assert.rejects(
      () => backend!.pause("pb_handlemap"),
      (err: SidecarError) => err.code === "runtime_disposed",
    );
  });

  it("auto-restart on next command after exit", async () => {
    let restartAttempts = 0;
    // Use a script that crashes on first real command, then a fresh
    // process will be the normal mock on restart
    // We'll use the crashing script — it crashes on first non-version request.
    // After crash, auto-restart spawns a NEW process from the same path.
    // To make restart succeed, we need the restart to use the normal mock.
    //
    // Strategy: use a script that crashes once, then on restart use normal mock.
    // Simplest: use a file-based flag.
    const restartScript = `
      const fs = require("fs");
      const path = require("path");
      const flagFile = path.join(${JSON.stringify(MOCK_DIR)}, "restart-flag-" + process.ppid);
      const isRestarted = fs.existsSync(flagFile);

      const readline = require("readline");
      const rl = readline.createInterface({ input: process.stdin });
      let handleCounter = 0;

      rl.on("line", (line) => {
        let req;
        try { req = JSON.parse(line); } catch { return; }

        if (req.method === "version") {
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: { name: "sonic-runtime", version: "0.1.0", protocol: "ndjson-stdio-v1" }
          }) + "\\n");
          return;
        }

        if (!isRestarted) {
          // First incarnation: crash
          fs.writeFileSync(flagFile, "crashed");
          process.exit(42);
          return;
        }

        // Restarted incarnation: behave normally
        if (req.method === "list_devices") {
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: [{ device_id: "dev_1", name: "Speakers", kind: "output", is_default: true, channels: 2, sample_rates: [48000] }]
          }) + "\\n");
        } else if (req.method === "load_asset") {
          handleCounter++;
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: { handle: "h_restart" + handleCounter }
          }) + "\\n");
        } else if (req.method === "play") {
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: null
          }) + "\\n");
        } else {
          process.stdout.write(JSON.stringify({
            id: req.id,
            result: null
          }) + "\\n");
        }
      });
    `;
    const restartPath = join(MOCK_DIR, "restart-runtime.cjs");
    writeFileSync(restartPath, restartScript);
    // Clean up flag file if leftover
    try {
      rmSync(join(MOCK_DIR, "restart-flag-" + process.pid), { force: true });
    } catch {
      // ignore
    }

    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [restartPath],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: true,
      maxRestarts: 3,
      onRestart: (attempt) => {
        restartAttempts = attempt;
      },
    });
    await backend.start();

    // First call causes crash
    await assert.rejects(
      () => backend!.play("pb_restart001", src, {}),
      (err: SidecarError) => err.code === "runtime_exited",
    );
    assert.ok(!backend.alive);

    // Next call should trigger auto-restart and succeed
    const devices = await backend!.get_devices();
    assert.ok(backend.alive);
    assert.equal(devices.length, 1);
    assert.equal(restartAttempts, 1);
    assert.equal(backend.restartCount, 1);

    // Clean up flag file
    try {
      rmSync(join(MOCK_DIR, "restart-flag-" + process.pid), { force: true });
    } catch {
      // ignore
    }
  });

  it("respects maxRestarts limit", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [CRASHING_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: true,
      maxRestarts: 1,
    });
    await backend.start();

    // First crash
    await assert.rejects(() => backend!.play("pb_lim1", src, {}));

    // Auto-restart #1 — will handshake but crash again on play
    await assert.rejects(() => backend!.play("pb_lim2", src, {}));

    // Should now exceed limit
    await assert.rejects(
      () => backend!.play("pb_lim3", src, {}),
      (err: SidecarError) => err.code === "restart_limit_exceeded",
    );
  });

  it("disposed backend cannot auto-restart", async () => {
    backend = createBackend({ autoRestart: true });
    await backend.start();
    backend.dispose();

    await assert.rejects(
      () => backend!.get_devices(),
      (err: SidecarError) => err.code === "runtime_disposed",
    );
  });
});

// ── 3. Protocol version mismatch tests ──

describe("SidecarBackend — protocol validation", () => {
  it("rejects unknown protocol version with rich error", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [WRONG_PROTO_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
    });

    await assert.rejects(
      () => backend!.start(),
      (err: SidecarError) => {
        assert.equal(err.code, "protocol_mismatch");
        assert.ok(err.message.includes("ndjson-stdio-v99"));
        assert.ok(err.message.includes("ndjson-stdio-v1"));
        assert.ok(err.message.includes("v2.0.0"));
        return true;
      },
    );
    assert.ok(!backend.alive);
  });

  it("stores runtime version info on successful handshake", async () => {
    backend = createBackend();
    await backend.start();
    const ver = backend.runtimeVersion;
    assert.ok(ver);
    assert.equal(ver!.name, "sonic-runtime");
    assert.equal(ver!.protocol, "ndjson-stdio-v1");
  });
});

// ── 4. Device-loss resilience tests ──

describe("SidecarBackend — device loss", () => {
  it("device_unavailable error does not poison the session", async () => {
    backend = createBackend();
    await backend.start();

    // Try to set a device that the mock reports as unavailable
    await assert.rejects(
      () => backend!.set_output_device("dev_gone"),
      (err: SidecarError) => {
        assert.equal(err.code, "device_unavailable");
        return true;
      },
    );

    // Backend should still be alive and functional
    assert.ok(backend.alive);
    const devices = await backend.get_devices();
    assert.equal(devices.length, 2);

    // Can still play normally
    await backend.play("pb_afterdevloss", src, {});
    await backend.stop("pb_afterdevloss");
  });

  it("device error during active playback is recoverable", async () => {
    backend = createBackend();
    await backend.start();

    // Start playback
    await backend.play("pb_devloss", src, {});

    // Device switch fails — but playback handle should survive
    await assert.rejects(
      () => backend!.set_output_device("dev_gone"),
      (err: SidecarError) => err.code === "device_unavailable",
    );

    // Can still stop the playback
    await backend.stop("pb_devloss");
    assert.ok(backend.alive);
  });
});

// ── 5. Introspection method tests ──

describe("SidecarBackend — introspection", () => {
  it("getHealth returns health result", async () => {
    backend = createBackend();
    await backend.start();
    const health = await backend.getHealth();
    assert.equal(health.status, "ok");
    assert.equal(health.uptime_ms, 5000);
    assert.equal(health.active_handles, 1);
    assert.equal(health.model_loaded, true);
    assert.equal(health.voices_loaded, 3);
    assert.equal(health.espeak_available, true);
  });

  it("getCapabilities returns engines and protocol", async () => {
    backend = createBackend();
    await backend.start();
    const caps = await backend.getCapabilities();
    assert.deepEqual(caps.engines, ["kokoro"]);
    assert.deepEqual(caps.features, ["synthesis", "playback"]);
    assert.equal(caps.protocol, "ndjson-stdio-v1");
  });

  it("getCapabilities returns audio format information", async () => {
    backend = createBackend();
    await backend.start();
    const caps = await backend.getCapabilities();
    assert.ok(caps.synthesis_format, "synthesis_format should be present");
    assert.equal(caps.synthesis_format!.container, "wav");
    assert.equal(caps.synthesis_format!.encoding, "pcm_s16le");
    assert.equal(caps.synthesis_format!.sample_rate, 24000);
    assert.equal(caps.synthesis_format!.channels, 1);
    assert.equal(caps.synthesis_format!.bit_depth, 16);
    assert.deepEqual(caps.playback_formats, ["wav"]);
  });

  it("listVoices returns voice array", async () => {
    backend = createBackend();
    await backend.start();
    const voices = await backend.listVoices();
    assert.equal(voices.length, 2);
    assert.equal(voices[0].id, "af_heart");
    assert.equal(voices[0].language, "en-us");
    assert.equal(voices[1].id, "am_adam");
  });

  it("preloadModel returns load result", async () => {
    backend = createBackend();
    await backend.start();
    const result = await backend.preloadModel();
    assert.equal(result.loaded, true);
    assert.equal(result.load_time_ms, 42);
  });

  it("getModelStatus returns model status", async () => {
    backend = createBackend();
    await backend.start();
    const status = await backend.getModelStatus();
    assert.equal(status.loaded, true);
    assert.equal(status.path, "/models/kokoro.onnx");
    assert.equal(status.load_time_ms, 42);
    assert.equal(status.inference_count, 7);
  });

  it("validateAssets returns validation result", async () => {
    backend = createBackend();
    await backend.start();
    const result = await backend.validateAssets();
    assert.equal(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
    assert.equal(result.warnings.length, 1);
    assert.equal(result.model.available, true);
    assert.equal(result.voices.available, true);
    assert.equal(result.voices.count, 3);
    assert.equal(result.espeak.available, true);
    assert.equal(result.onnx_runtime.available, true);
    assert.equal(result.asset_root, "/opt/sonic-runtime");
  });
});

// ── 6. Event consumption tests ──

describe("SidecarBackend — events", () => {
  it("runtime events fire onEvent callback with typed payloads", async () => {
    const events: RuntimeEvent[] = [];
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [EVENT_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: (evt) => events.push(evt),
    });
    await backend.start();

    // Synthesize triggers interleaved events
    await backend.play("pb_evt001", synthSrc, {});

    // Give events a moment to arrive
    await new Promise((r) => setTimeout(r, 100));

    assert.ok(events.length >= 2, `Expected >=2 events, got ${events.length}`);
    assert.equal(events[0].event, "synthesis_started");
    assert.equal(events[0].data.handle, "h_synth001");
    assert.equal(events[1].event, "synthesis_completed");
    assert.equal(events[1].data.handle, "h_synth001");
  });

  it("events do not corrupt pending request resolution", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [EVENT_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: () => {}, // consume and ignore
    });
    await backend.start();

    // Should resolve normally despite interleaved events
    await backend.play("pb_evt002", synthSrc, {});
    assert.ok(backend.alive);
  });

  it("events without onEvent callback are silently dropped", async () => {
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [EVENT_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      // No onEvent callback
    });
    await backend.start();

    // Should not throw despite events arriving with no handler
    await backend.play("pb_evt003", synthSrc, {});
    assert.ok(backend.alive);
  });

  it("consumer exception in onEvent does not crash reader loop", async () => {
    let callCount = 0;
    backend = new SidecarBackend({
      executablePath: process.execPath,
      args: [EVENT_PATH],
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
      autoRestart: false,
      onEvent: () => {
        callCount++;
        throw new Error("consumer blew up");
      },
    });
    await backend.start();

    // Should still resolve — the thrown error is swallowed
    await backend.play("pb_evt004", synthSrc, {});
    assert.ok(backend.alive);
    assert.ok(callCount > 0, "onEvent was called at least once");
  });
});

// ── 7. Reverse handle map tests ──

describe("SidecarBackend — reverse handle map", () => {
  it("resolveAndRemoveHandle returns playbackId for known handle", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_rev001", src, {});

    // The mock assigns h_mock000001 for the first load_asset
    const playbackId = backend.resolveAndRemoveHandle("h_mock000001");
    assert.equal(playbackId, "pb_rev001");
  });

  it("resolveAndRemoveHandle returns undefined for unknown handle", async () => {
    backend = createBackend();
    await backend.start();
    const result = backend.resolveAndRemoveHandle("h_nonexistent");
    assert.equal(result, undefined);
  });

  it("resolveAndRemoveHandle clears both forward and reverse maps", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_rev002", src, {});

    // Resolve removes the mapping
    backend.resolveAndRemoveHandle("h_mock000001");

    // Forward map is cleared — pause should throw handle_not_found
    await assert.rejects(
      () => backend!.pause("pb_rev002"),
      (err: SidecarError) => err.code === "handle_not_found",
    );

    // Reverse map is cleared — second resolve returns undefined
    assert.equal(backend.resolveAndRemoveHandle("h_mock000001"), undefined);
  });

  it("synthesis play populates reverse map", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_rev_synth", synthSrc, {});

    // The mock assigns h_synth000001 for synthesize
    const playbackId = backend.resolveAndRemoveHandle("h_synth000001");
    assert.equal(playbackId, "pb_rev_synth");
  });

  it("stop clears reverse map entry", async () => {
    backend = createBackend();
    await backend.start();
    await backend.play("pb_rev003", src, {});
    await backend.stop("pb_rev003");

    // After stop, reverse map should be empty for this handle
    assert.equal(backend.resolveAndRemoveHandle("h_mock000001"), undefined);
  });
});

// Cleanup temp dir after all tests
process.on("exit", () => {
  try {
    rmSync(MOCK_DIR, { recursive: true, force: true });
  } catch {
    // best effort
  }
});
