import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { RfError } from "@receipt-factory/core";

const execFileAsync = promisify(execFile);

/**
 * Check if `gh` CLI is available.
 */
export async function isGhAvailable(): Promise<boolean> {
  try {
    await execFileAsync("gh", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Call `gh api` and return parsed JSON.
 */
export async function ghApi<T>(endpoint: string): Promise<T> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", endpoint], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(stdout) as T;
  } catch (err) {
    throw new RfError({
      code: "RF_GH_API",
      message: `gh api ${endpoint} failed`,
      hint: "Is the gh CLI installed and authenticated? Run: gh auth status",
      cause: err instanceof Error ? err : new Error(String(err)),
    });
  }
}
