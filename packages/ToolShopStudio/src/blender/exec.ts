import { spawn } from "node:child_process";
import { attachBlenderProgress } from "./progress.js";
import type { BlenderCommandArgs } from "./build-args.js";

/**
 * Run a Blender command with AbortSignal cancellation and progress parsing.
 *
 * @param cmd - { command: 'blender', args } from buildBlenderArgs
 * @param signal - AbortSignal for cancellation
 * @param onProgress - called with percent (0–99)
 * @param estimatedSteps - from BlenderPresetSpec.estimatedSteps
 */
export async function runBlenderProcess(
  cmd: BlenderCommandArgs,
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

    // Parse progress from stdout (Blender writes status to stdout)
    if (proc.stdout) {
      attachBlenderProgress(proc.stdout, onProgress, estimatedSteps);
    }

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`blender exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}
