import { spawn } from "node:child_process";
import { attachPandocProgress } from "./progress.js";

/**
 * Run pandoc with AbortSignal cancellation and progress parsing.
 *
 * @param args - full argv (everything after `pandoc`)
 * @param signal - AbortSignal for cancellation
 * @param onProgress - called with percent (0–99)
 * @param estimatedSteps - from PandocPresetSpec.estimatedSteps
 */
export async function runPandoc(
  args: string[],
  signal: AbortSignal,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const proc = spawn("pandoc", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wire up abort
    const onAbort = () => {
      proc.kill("SIGKILL");
    };
    signal.addEventListener("abort", onAbort, { once: true });

    // Parse progress from stderr (pandoc --verbose output)
    if (proc.stderr) {
      attachPandocProgress(proc.stderr, onProgress, estimatedSteps);
    }

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pandoc exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}
