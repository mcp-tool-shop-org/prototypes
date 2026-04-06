import * as vscode from "vscode";
import { exec } from "child_process";
import type { ExtensionConfig } from "./config.js";

interface SetupResult {
  backend: "python" | "http" | "mock";
  ready: boolean;
  message?: string;
}

/** Find a working Python 3 binary. */
async function findPython(configPath: string): Promise<string | null> {
  const candidates = configPath
    ? [configPath]
    : process.platform === "win32"
      ? ["python", "python3", "py -3"]
      : ["python3", "python"];

  for (const cmd of candidates) {
    try {
      const stdout = await new Promise<string>((resolve, reject) => {
        exec(`${cmd} --version`, { timeout: 5000 }, (err, out) => {
          if (err) reject(err);
          else resolve(out);
        });
      });
      if (stdout.includes("Python 3")) {
        return cmd;
      }
    } catch {
      // candidate not found, try next
    }
  }
  return null;
}

/** Check if voice-soundboard[kokoro] is installed. */
function checkKokoroInstalled(python: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`${python} -c "import kokoro_onnx; print('ok')"`, { timeout: 10000 }, (err, stdout) => {
      resolve(!err && stdout.includes("ok"));
    });
  });
}

/** Run pip install in a VS Code terminal. */
function installKokoroInTerminal(python: string): void {
  const terminal = vscode.window.createTerminal("Voice Soundboard Setup");
  terminal.show();
  terminal.sendText(`${python} -m pip install "voice-soundboard[kokoro]"`);
}

/**
 * Ensure the TTS backend is ready. Guides the user through setup if needed.
 * Returns the resolved backend to use and whether it's ready.
 */
export async function ensureBackendReady(config: ExtensionConfig): Promise<SetupResult> {
  // If user explicitly chose mock, respect it
  if (config.backend === "mock") {
    return { backend: "mock", ready: true };
  }

  // HTTP backend — just needs an API key
  if (config.backend === "http") {
    if (config.openaiApiKey) {
      return { backend: "http", ready: true };
    }
    const action = await vscode.window.showWarningMessage(
      "Voice Soundboard: HTTP backend requires an API key. Set voiceSoundboard.openaiApiKey in settings, or switch to the free local Python backend.",
      "Open Settings",
      "Use Python Instead",
      "Use Mock",
    );
    if (action === "Open Settings") {
      vscode.commands.executeCommand("workbench.action.openSettings", "voiceSoundboard.openaiApiKey");
      return { backend: "http", ready: false, message: "Waiting for API key configuration" };
    }
    if (action === "Use Python Instead") {
      await vscode.workspace.getConfiguration("voiceSoundboard").update("backend", "python", true);
      // Fall through to Python setup below
    } else if (action === "Use Mock") {
      await vscode.workspace.getConfiguration("voiceSoundboard").update("backend", "mock", true);
      return { backend: "mock", ready: true };
    } else {
      return { backend: "http", ready: false, message: "API key required" };
    }
  }

  // Python backend — detect Python and kokoro
  const python = await findPython(config.pythonPath);

  if (!python) {
    const action = await vscode.window.showWarningMessage(
      "Voice Soundboard: Python 3 not found. Install Python for free local TTS, or use a cloud API key.",
      "Install Python",
      "Use API Key",
      "Use Mock",
    );
    if (action === "Install Python") {
      vscode.env.openExternal(vscode.Uri.parse("https://www.python.org/downloads/"));
      return { backend: "python", ready: false, message: "Install Python 3, then reload VS Code" };
    }
    if (action === "Use API Key") {
      await vscode.workspace.getConfiguration("voiceSoundboard").update("backend", "http", true);
      vscode.commands.executeCommand("workbench.action.openSettings", "voiceSoundboard.openaiApiKey");
      return { backend: "http", ready: false, message: "Set your API key in settings" };
    }
    if (action === "Use Mock") {
      await vscode.workspace.getConfiguration("voiceSoundboard").update("backend", "mock", true);
      return { backend: "mock", ready: true };
    }
    return { backend: "python", ready: false, message: "Python 3 required" };
  }

  // Python found — check for kokoro
  const hasKokoro = await checkKokoroInstalled(python);

  if (!hasKokoro) {
    const action = await vscode.window.showInformationMessage(
      "Voice Soundboard: Installing local TTS engine (Kokoro). This is a one-time ~100MB download.",
      "Install Now",
      "Skip (Use Mock)",
    );
    if (action === "Install Now") {
      installKokoroInTerminal(python);
      return {
        backend: "python",
        ready: false,
        message: "Installing Kokoro TTS... Reload VS Code when the terminal finishes.",
      };
    }
    if (action === "Skip (Use Mock)") {
      await vscode.workspace.getConfiguration("voiceSoundboard").update("backend", "mock", true);
      return { backend: "mock", ready: true };
    }
    return { backend: "python", ready: false, message: "Kokoro TTS package required" };
  }

  // Everything ready
  return { backend: "python", ready: true };
}
