import { spawn, execFile } from "node:child_process";
import { attachProgressParser, calculatePercent } from "./progress-parser.js";
import { ProbeResultSchema, type ProbeResult } from "./schemas.js";

/**
 * Run ffmpeg with -nostdin, AbortSignal cancellation, and progress parsing.
 *
 * @param flags - full argv (everything after `ffmpeg`)
 * @param signal - AbortSignal for cancellation
 * @param onProgress - called with percent (0–100), fires at each out_time_us update and on 'end'
 * @param durationSec - total input duration for percent calculation
 */
export async function runFfmpeg(
  flags: string[],
  signal: AbortSignal,
  onProgress: (percent: number) => void,
  durationSec: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const proc = spawn("ffmpeg", ["-nostdin", ...flags], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wire up abort
    const onAbort = () => {
      proc.kill("SIGKILL");
    };
    signal.addEventListener("abort", onAbort, { once: true });

    // Parse progress from stderr
    let lastEmittedPercent = -1;
    attachProgressParser(proc.stderr!, (key, value) => {
      if (key === "out_time_us") {
        const percent = calculatePercent(value, durationSec);
        if (percent !== lastEmittedPercent) {
          lastEmittedPercent = percent;
          onProgress(percent);
        }
      }
      if (key === "progress" && value === "end") {
        if (lastEmittedPercent !== 100) {
          lastEmittedPercent = 100;
          onProgress(100);
        }
      }
    });

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}

/**
 * Run ffprobe and return parsed ProbeResult.
 */
export async function runProbe(filePath: string): Promise<ProbeResult> {
  return new Promise<ProbeResult>((resolve, reject) => {
    execFile(
      "ffprobe",
      [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        filePath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          reject(new Error(`ffprobe failed for "${filePath}": ${err.message}`));
          return;
        }
        try {
          const raw = JSON.parse(stdout);
          const result = ProbeResultSchema.parse(raw);
          resolve(result);
        } catch (parseErr) {
          reject(
            new Error(
              `ffprobe output parse failed for "${filePath}": ${parseErr}`,
            ),
          );
        }
      },
    );
  });
}
