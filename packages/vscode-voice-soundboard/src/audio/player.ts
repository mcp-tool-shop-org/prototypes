import { spawn, type ChildProcess } from "child_process";

let activeProcess: ChildProcess | null = null;

export function playAudio(filePath: string): void {
  stopAudio();

  let cmd: string;
  let args: string[];

  if (process.platform === "win32") {
    cmd = "powershell";
    args = ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`];
  } else if (process.platform === "darwin") {
    cmd = "afplay";
    args = [filePath];
  } else {
    // Linux: try paplay first (PulseAudio), fall back to aplay (ALSA)
    cmd = "paplay";
    args = [filePath];
  }

  activeProcess = spawn(cmd, args, { stdio: "ignore" });

  activeProcess.on("error", () => {
    // On Linux, paplay may not exist — fall back to aplay
    if (process.platform === "linux" && cmd === "paplay") {
      activeProcess = spawn("aplay", [filePath], { stdio: "ignore" });
      activeProcess.on("exit", () => { activeProcess = null; });
      activeProcess.on("error", () => { activeProcess = null; });
    } else {
      activeProcess = null;
    }
  });

  activeProcess.on("exit", () => {
    activeProcess = null;
  });
}

export function stopAudio(): void {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
  }
}

export function isPlaying(): boolean {
  return activeProcess !== null;
}
