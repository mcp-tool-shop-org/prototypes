/**
 * Cross-platform audio playback.
 * Writes a temp .wav file, plays it with the OS native player, cleans up.
 * Zero dependencies.
 */

import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync, spawn } from "node:child_process";
import { encodeWav } from "./synth.js";

const TEMP_DIR = join(tmpdir(), "claude-sfx");

function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function getTempPath(): string {
  ensureTempDir();
  return join(TEMP_DIR, `sfx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`);
}

/** Detect OS and return the appropriate play command. */
function getPlayCommand(
  filePath: string
): { command: string; args: string[] } | null {
  const platform = process.platform;

  if (platform === "win32") {
    // Prefer ffplay (from ffmpeg) — fast, reliable, no UI
    try {
      execSync("where ffplay", { stdio: "ignore" });
      return {
        command: "ffplay",
        args: ["-nodisp", "-autoexit", "-loglevel", "quiet", filePath],
      };
    } catch {
      // Fallback: PowerShell SoundPlayer
      return {
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`,
        ],
      };
    }
  }

  if (platform === "darwin") {
    return { command: "afplay", args: [filePath] };
  }

  // Linux: try paplay (PulseAudio), then aplay (ALSA)
  try {
    execSync("which paplay", { stdio: "ignore" });
    return { command: "paplay", args: [filePath] };
  } catch {
    try {
      execSync("which aplay", { stdio: "ignore" });
      return { command: "aplay", args: ["-q", filePath] };
    } catch {
      return null;
    }
  }
}

export interface PlayResult {
  played: boolean;
  method: string;
  durationMs: number;
}

/** Play a PCM audio buffer through the system speakers. Blocks until done. */
export function playSync(buffer: Float64Array): PlayResult {
  const start = Date.now();
  const wavData = encodeWav(buffer);
  const tempPath = getTempPath();

  try {
    writeFileSync(tempPath, wavData);

    const cmd = getPlayCommand(tempPath);
    if (!cmd) {
      return { played: false, method: "none", durationMs: 0 };
    }

    execSync(`${cmd.command} ${cmd.args.map((a) => `"${a}"`).join(" ")}`, {
      stdio: "ignore",
      timeout: 3000,
    });

    return {
      played: true,
      method: cmd.command,
      durationMs: Date.now() - start,
    };
  } finally {
    try {
      unlinkSync(tempPath);
    } catch {
      // Temp file cleanup is best-effort
    }
  }
}

/** Play a PCM audio buffer asynchronously (fire and forget). */
export function playAsync(buffer: Float64Array): void {
  const wavData = encodeWav(buffer);
  const tempPath = getTempPath();
  writeFileSync(tempPath, wavData);

  const cmd = getPlayCommand(tempPath);
  if (!cmd) return;

  const child = spawn(cmd.command, cmd.args, {
    stdio: "ignore",
    detached: true,
  });

  child.on("exit", () => {
    try {
      unlinkSync(tempPath);
    } catch {
      // best-effort
    }
  });

  child.unref();
}

/** Write a WAV file to disk (for export / debugging). */
export function saveWav(buffer: Float64Array, outputPath: string): void {
  const wavData = encodeWav(buffer);
  writeFileSync(outputPath, wavData);
}
