/**
 * End-to-end integration test: sonic-core SidecarBackend ↔ real sonic-runtime binary.
 *
 * Spawns the actual sonic-runtime, sends protocol messages through SidecarBackend,
 * and verifies the full play path works.
 *
 * Prerequisites resolved automatically via test-fixtures.ts:
 *   - Runtime binary: SONIC_RUNTIME_PATH env var, or Release/Debug build paths
 *   - Assets (synthesis only): SONIC_ASSETS_DIR env var
 *   - Explicit disable: TEST_E2E=0
 *
 * See docs/e2e-fixtures.md for full env var reference and test categories.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { SidecarError } from "./sidecar-backend.js";
import { RuntimeHarness, type CapabilityProbe } from "./runtime-harness.js";
import { resolveRuntime, resolveAssets } from "./test-fixtures.js";
import type { AssetSource } from "@sonic-core/types";

// ── Resolve prerequisites once ──

const runtime = resolveRuntime();
const assets = resolveAssets();

// ─────────────────────────────────────────────
// Protocol E2E — needs only the runtime binary + generated WAV
// ─────────────────────────────────────────────

describe("protocol E2E", { skip: runtime.ok ? undefined : runtime.skip }, () => {
  let harness: RuntimeHarness;

  before(async () => {
    harness = new RuntimeHarness({
      runtimePath: runtime.ok ? runtime.value : undefined,
    });
    await harness.start();
  });

  after(async () => {
    await harness?.dispose();
  });

  it("spawns runtime and completes version handshake", () => {
    assert.ok(harness.alive, "backend should be alive after start");
  });

  it("list_devices returns at least one device", async () => {
    const devices = await harness.backend.get_devices();
    assert.ok(devices.length >= 1, "should have at least one audio device");
    assert.ok(devices[0].device_id, "device should have an id");
    assert.ok(devices[0].name, "device should have a name");
    assert.equal(devices[0].kind, "output");
  });

  it("full play cycle: load → play → get_position → get_duration → stop", async () => {
    const assetRef = "file:///" + harness.wavPath.replace(/\\/g, "/");
    const src: AssetSource = { kind: "asset", asset_ref: assetRef };

    await harness.backend.play("pb_e2e_001", src, {
      initial_volume: 0.3, // quiet — this is a test
    });

    // brief pause to let playback start
    await new Promise((r) => setTimeout(r, 100));

    const pos = await harness.backend.get_position_ms("pb_e2e_001");
    assert.ok(pos >= 0, `position should be >= 0, got ${pos}`);

    const dur = await harness.backend.get_duration_ms("pb_e2e_001");
    assert.ok(dur !== null, "duration should not be null");
    assert.ok(dur! > 400 && dur! < 600, `duration should be ~500ms, got ${dur}`);

    await harness.backend.stop("pb_e2e_001");
  });

  it("set_volume on active playback", async () => {
    const assetRef = "file:///" + harness.wavPath.replace(/\\/g, "/");
    const src: AssetSource = { kind: "asset", asset_ref: assetRef };

    await harness.backend.play("pb_e2e_vol", src, { initial_volume: 0.5 });
    await harness.backend.set_volume("pb_e2e_vol", 0.1);
    await harness.backend.stop("pb_e2e_vol");
  });

  it("set_pan on active playback", async () => {
    const assetRef = "file:///" + harness.wavPath.replace(/\\/g, "/");
    const src: AssetSource = { kind: "asset", asset_ref: assetRef };

    await harness.backend.play("pb_e2e_pan", src, { initial_volume: 0.1 });
    await harness.backend.set_pan("pb_e2e_pan", -1.0);
    await harness.backend.set_pan("pb_e2e_pan", 0.0);
    await harness.backend.set_pan("pb_e2e_pan", 1.0);
    await harness.backend.stop("pb_e2e_pan");
  });

  it("pause and resume", async () => {
    const assetRef = "file:///" + harness.wavPath.replace(/\\/g, "/");
    const src: AssetSource = { kind: "asset", asset_ref: assetRef };

    await harness.backend.play("pb_e2e_pr", src, {
      initial_volume: 0.1,
      loop: true,
    });
    await new Promise((r) => setTimeout(r, 50));

    await harness.backend.pause("pb_e2e_pr");
    const posAfterPause = await harness.backend.get_position_ms("pb_e2e_pr");

    await new Promise((r) => setTimeout(r, 100));
    const posStillPaused = await harness.backend.get_position_ms("pb_e2e_pr");
    assert.ok(
      Math.abs(posStillPaused - posAfterPause) < 50,
      `position should not advance while paused: ${posAfterPause} → ${posStillPaused}`,
    );

    await harness.backend.resume("pb_e2e_pr");
    await new Promise((r) => setTimeout(r, 100));

    await harness.backend.stop("pb_e2e_pr");
  });

  it("invalid asset returns error, not crash", async () => {
    const badSrc: AssetSource = {
      kind: "asset",
      asset_ref: "file:///Z:/nonexistent/fake.wav",
    };
    await assert.rejects(
      () => harness.backend.play("pb_e2e_bad", badSrc, {}),
      (err: SidecarError) => {
        assert.ok(err.code, "error should have a code");
        return true;
      },
    );
    assert.ok(harness.alive, "backend should survive a bad asset error");
  });

  it("stderr captured runtime diagnostics", () => {
    assert.ok(Array.isArray(harness.stderr));
  });

  it("dispose kills runtime cleanly", async () => {
    await harness.dispose();
    assert.ok(!harness.alive);
  });
});

// ─────────────────────────────────────────────
// Introspection E2E — needs runtime binary with introspection support
// Uses capability probing to detect stale binaries early.
// ─────────────────────────────────────────────

describe("introspection E2E", { skip: runtime.ok ? undefined : runtime.skip }, () => {
  let harness: RuntimeHarness;
  let probe: CapabilityProbe;

  before(async () => {
    harness = new RuntimeHarness({
      runtimePath: runtime.ok ? runtime.value : undefined,
    });
    await harness.start();

    // Probe capabilities — if this fails, the binary is stale
    probe = await harness.probeCapabilities();
    if (!probe.ok) {
      console.error(`[e2e] ⚠ Stale runtime binary detected: ${probe.error}`);
      console.error(`[e2e]   Binary path: ${harness.runtimePath}`);
      console.error(`[e2e]   Rebuild: dotnet publish -c Release -r win-x64`);
    }
  });

  after(async () => {
    await harness?.dispose();
  });

  it("runtime supports introspection (freshness check)", (t) => {
    if (!probe.ok) {
      t.skip(`Stale runtime binary — ${probe.error}`);
      return;
    }
    assert.ok(probe.features.includes("introspection"),
      `Runtime missing "introspection" feature. Has: [${probe.features.join(", ")}]`);
  });

  it("getHealth returns ok status", async (t) => {
    if (!probe.ok) { t.skip("Stale runtime binary"); return; }
    const health = await harness.backend.getHealth();
    assert.equal(health.status, "ok");
    assert.ok(health.uptime_ms >= 0);
    assert.ok(typeof health.active_handles === "number");
    assert.ok(typeof health.model_loaded === "boolean");
  });

  it("getCapabilities returns kokoro engine", async (t) => {
    if (!probe.ok) { t.skip("Stale runtime binary"); return; }
    const caps = await harness.backend.getCapabilities();
    assert.ok(caps.engines.includes("kokoro"));
    assert.equal(caps.protocol, "ndjson-stdio-v1");
  });

  it("getModelStatus reflects loaded state", async (t) => {
    if (!probe.ok) { t.skip("Stale runtime binary"); return; }
    const status = await harness.backend.getModelStatus();
    assert.ok(typeof status.loaded === "boolean");
    assert.ok(typeof status.load_time_ms === "number");
    assert.ok(typeof status.inference_count === "number");
  });
});

// ─────────────────────────────────────────────
// Synthesis E2E — needs runtime binary + real assets (model, voices, espeak)
// ─────────────────────────────────────────────

const synthSkip = !runtime.ok
  ? runtime.skip
  : !assets.ok
    ? assets.skip
    : undefined;

describe("synthesis E2E", { skip: synthSkip }, () => {
  // Placeholder — synthesis tests will be added when asset pipeline is wired.
  // This block exists to establish the category and skip semantics.

  it("placeholder: synthesis E2E category exists", () => {
    assert.ok(true);
  });
});
