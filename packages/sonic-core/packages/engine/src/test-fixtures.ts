/**
 * Shared test fixture helpers for sonic-core E2E and integration tests.
 *
 * Centralizes prerequisite resolution, WAV generation, and fixture lifecycle
 * so test files don't repeat gating logic or rely on implicit machine state.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ── Runtime binary resolution ──

/** Known binary paths, checked in order after the env var. */
const RUNTIME_CANDIDATES = [
  // NativeAOT published build (CI / release)
  "F:/AI/sonic-runtime/src/SonicRuntime/bin/Release/net8.0/win-x64/publish/SonicRuntime.exe",
  // Debug build (most common during development)
  "F:/AI/sonic-runtime/src/SonicRuntime/bin/Debug/net8.0/win-x64/SonicRuntime.exe",
];

export type Resolved<T> = { ok: true; value: T } | { ok: false; skip: string };

/**
 * Resolve the sonic-runtime binary path.
 *
 * Priority: SONIC_RUNTIME_PATH env var → Release/publish → Debug build.
 * Returns a skip reason if no binary is found.
 */
export function resolveRuntime(): Resolved<string> {
  // Explicit env var takes precedence
  const envPath = process.env.SONIC_RUNTIME_PATH;
  if (envPath) {
    if (existsSync(envPath)) {
      return { ok: true, value: envPath };
    }
    return {
      ok: false,
      skip: `SONIC_RUNTIME_PATH set to "${envPath}" but file does not exist`,
    };
  }

  // Explicit skip gate
  if (process.env.TEST_E2E === "0") {
    return { ok: false, skip: "TEST_E2E=0 — E2E tests explicitly disabled" };
  }

  // Try known paths
  for (const candidate of RUNTIME_CANDIDATES) {
    if (existsSync(candidate)) {
      return { ok: true, value: candidate };
    }
  }

  return {
    ok: false,
    skip: `No runtime binary found. Set SONIC_RUNTIME_PATH or build sonic-runtime. Checked:\n  ${RUNTIME_CANDIDATES.join("\n  ")}`,
  };
}

// ── Asset resolution ──

/**
 * Resolve the asset root directory for synthesis E2E tests.
 *
 * Checks SONIC_ASSETS_DIR env var, then validates expected subdirectories.
 */
export function resolveAssets(): Resolved<string> {
  const root = process.env.SONIC_ASSETS_DIR;
  if (!root) {
    return {
      ok: false,
      skip: "SONIC_ASSETS_DIR not set — synthesis E2E tests require model assets",
    };
  }

  if (!existsSync(root)) {
    return {
      ok: false,
      skip: `SONIC_ASSETS_DIR="${root}" but directory does not exist`,
    };
  }

  // Check expected subdirectories
  const modelPath = join(root, "models", "kokoro.onnx");
  if (!existsSync(modelPath)) {
    return {
      ok: false,
      skip: `SONIC_ASSETS_DIR="${root}" missing models/kokoro.onnx`,
    };
  }

  const voicesDir = join(root, "voices");
  if (!existsSync(voicesDir)) {
    return {
      ok: false,
      skip: `SONIC_ASSETS_DIR="${root}" missing voices/ directory`,
    };
  }

  return { ok: true, value: root };
}

// ── WAV generation ──

export interface TestWavOptions {
  /** Frequency in Hz (default: 440) */
  frequency?: number;
  /** Duration in seconds (default: 0.5) */
  durationSec?: number;
  /** Sample rate (default: 44100) */
  sampleRate?: number;
}

/**
 * Generate a minimal PCM WAV file buffer.
 * Default: 440Hz sine wave, 0.5s, 16-bit mono 44100Hz.
 */
export function generateTestWav(opts: TestWavOptions = {}): Buffer {
  const frequency = opts.frequency ?? 440;
  const duration = opts.durationSec ?? 0.5;
  const sampleRate = opts.sampleRate ?? 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;

  const buf = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buf.write("RIFF", offset);
  offset += 4;
  buf.writeUInt32LE(36 + dataSize, offset);
  offset += 4;
  buf.write("WAVE", offset);
  offset += 4;

  // fmt chunk
  buf.write("fmt ", offset);
  offset += 4;
  buf.writeUInt32LE(16, offset);
  offset += 4;
  buf.writeUInt16LE(1, offset);
  offset += 2; // PCM
  buf.writeUInt16LE(numChannels, offset);
  offset += 2;
  buf.writeUInt32LE(sampleRate, offset);
  offset += 4;
  buf.writeUInt32LE(byteRate, offset);
  offset += 4;
  buf.writeUInt16LE(blockAlign, offset);
  offset += 2;
  buf.writeUInt16LE(bitsPerSample, offset);
  offset += 2;

  // data chunk
  buf.write("data", offset);
  offset += 4;
  buf.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Sine wave samples
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    const intSample = Math.max(
      -32768,
      Math.min(32767, Math.floor(sample * 32767)),
    );
    buf.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buf;
}

/**
 * Write a test WAV file to disk.
 */
export function writeTestWav(path: string, opts?: TestWavOptions): void {
  writeFileSync(path, generateTestWav(opts));
}

// ── Fixture directory ──

/**
 * Create a temporary fixture directory. Returns the path and a cleanup function.
 * Cleanup uses force+recursive removal with error suppression.
 */
export function createFixtureDir(prefix: string): {
  dir: string;
  cleanup: () => void;
} {
  const dir = join(tmpdir(), `${prefix}-${process.pid}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });

  const cleanup = () => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort — temp dir will be cleaned by OS eventually
    }
  };

  return { dir, cleanup };
}
