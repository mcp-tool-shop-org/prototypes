import { spawn } from "node:child_process";
import { attachOpenSCADProgress } from "./progress.js";
import type { OpenSCADCommandArgs } from "./build-args.js";

/**
 * Run an OpenSCAD command with AbortSignal cancellation and progress parsing.
 *
 * @param cmd - { command: 'openscad', args } from buildOpenSCADArgs
 * @param signal - AbortSignal for cancellation
 * @param onProgress - called with percent (0–99)
 * @param estimatedSteps - from OpenSCADPresetSpec.estimatedSteps
 */
export async function runOpenSCAD(
  cmd: OpenSCADCommandArgs,
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

    // Parse progress from stderr (OpenSCAD writes status to stderr)
    if (proc.stderr) {
      attachOpenSCADProgress(proc.stderr, onProgress, estimatedSteps);
    }

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`openscad exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}
