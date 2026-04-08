import { spawn } from "node:child_process";
import { attachGDALProgress } from "./progress.js";
import type { GDALCommandArgs } from "./build-args.js";

/**
 * Run a GDAL command with AbortSignal cancellation and progress parsing.
 *
 * @param cmd - { command, args } from buildGDALArgs
 * @param signal - AbortSignal for cancellation
 * @param onProgress - called with percent (0–99)
 * @param estimatedSteps - from GDALPresetSpec.estimatedSteps
 */
export async function runGDAL(
  cmd: GDALCommandArgs,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const proc = spawn(cmd.command, cmd.args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wire up abort
    const onAbort = () => {
      proc.kill("SIGKILL");
    };
    signal.addEventListener("abort", onAbort, { once: true });

    // Parse progress from stderr (GDAL processing output)
    if (proc.stderr) {
      attachGDALProgress(proc.stderr, onProgress, estimatedSteps);
    }

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd.command} exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}
