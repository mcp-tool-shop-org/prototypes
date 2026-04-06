import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SonicEngine } from "./engine.js";
import { NullBackend } from "./null-backend.js";
import type { AssetSource } from "@sonic-core/types";

const src: AssetSource = { kind: "asset", asset_ref: "file:///test.wav" };

describe("SonicEngine", () => {
  it("play returns a playback id", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    assert.ok(id.startsWith("pb_"));
    engine.dispose();
  });

  it("pause/resume updates state", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    await engine.pause(id);
    let state = await engine.get_playback_state(id);
    assert.equal(state.status, "paused");
    await engine.resume(id);
    state = await engine.get_playback_state(id);
    assert.equal(state.status, "playing");
    engine.dispose();
  });

  it("stop removes entry from registry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    await engine.stop(id);
    // Entry is removed — get_playback_state should throw
    await assert.rejects(() => engine.get_playback_state(id));
    engine.dispose();
  });

  it("set_volume updates registry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src, { initial_volume: 1.0 });
    await engine.set_volume(id, 0.5);
    const state = await engine.get_playback_state(id);
    assert.equal(state.volume, 0.5);
    engine.dispose();
  });

  it("set_pan updates registry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    await engine.set_pan(id, -0.75);
    const state = await engine.get_playback_state(id);
    assert.equal(state.pan, -0.75);
    engine.dispose();
  });

  it("get_devices returns null backend device", async () => {
    const engine = new SonicEngine(new NullBackend());
    const devices = await engine.get_devices();
    assert.equal(devices.length, 1);
    assert.equal(devices[0].device_id, "device_default");
    engine.dispose();
  });

  it("renew_lease extends expiry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src, { owner_lease_ms: 1000 });
    const before = (await engine.get_playback_state(id)).lease_expires_at;
    assert.ok(before);
    await engine.renew_lease(id, 10000);
    const after = (await engine.get_playback_state(id)).lease_expires_at;
    assert.ok(after);
    assert.ok(new Date(after!).getTime() > new Date(before!).getTime());
    engine.dispose();
  });

  it("lease expiry removes entry from registry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src, { owner_lease_ms: 100 });
    // Wait for lease to expire + watcher tick
    await new Promise((r) => setTimeout(r, 800));
    // Entry is removed after expiry
    await assert.rejects(() => engine.get_playback_state(id));
    engine.dispose();
  });

  it("replace_playback removes old and starts new", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id1 = await engine.play(src);
    const id2 = await engine.replace_playback(id1, {
      kind: "asset",
      asset_ref: "file:///other.wav",
    });
    assert.notEqual(id1, id2);
    // Old entry is removed
    await assert.rejects(() => engine.get_playback_state(id1));
    const state2 = await engine.get_playback_state(id2);
    assert.equal(state2.status, "playing");
    engine.dispose();
  });

  it("seek throws for synthesis source", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play({
      kind: "synthesis",
      engine: "kokoro",
      voice: "v1",
      text: "hello",
    });
    await assert.rejects(() => engine.seek(id, 1000));
    engine.dispose();
  });

  it("unknown playback id throws", async () => {
    const engine = new SonicEngine(new NullBackend());
    await assert.rejects(() => engine.stop("pb_nonexistent"));
    engine.dispose();
  });

  it("multiple play/stop cycles do not accumulate entries", async () => {
    const engine = new SonicEngine(new NullBackend());
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const id = await engine.play(src);
      ids.push(id);
      await engine.stop(id);
    }
    // All entries removed — none should be reachable
    for (const id of ids) {
      await assert.rejects(() => engine.get_playback_state(id));
    }
    engine.dispose();
  });

  it("double stop throws on second call", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    await engine.stop(id);
    await assert.rejects(() => engine.stop(id));
    engine.dispose();
  });
});

describe("SonicEngine — handlePlaybackEnded", () => {
  it("reason completed removes registry entry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    engine.handlePlaybackEnded(id, "completed");
    await assert.rejects(() => engine.get_playback_state(id));
    engine.dispose();
  });

  it("reason stopped does not remove registry entry", async () => {
    const engine = new SonicEngine(new NullBackend());
    const id = await engine.play(src);
    engine.handlePlaybackEnded(id, "stopped");
    // Entry should still exist — stop path handles its own cleanup
    const state = await engine.get_playback_state(id);
    assert.equal(state.status, "playing");
    engine.dispose();
  });

  it("unknown playbackId is a no-op", () => {
    const engine = new SonicEngine(new NullBackend());
    // Should not throw
    engine.handlePlaybackEnded("pb_nonexistent", "completed");
    engine.dispose();
  });
});
