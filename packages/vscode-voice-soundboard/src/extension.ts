import * as vscode from "vscode";
import { startServer, stopServer, isConnected } from "./mcp/lifecycle.js";
import { getConfig } from "./config.js";
import { ensureBackendReady } from "./setup.js";
import {
  speakText,
  speakSelection,
  stopSpeaking,
  setVoice,
  togglePanel,
  refreshVoiceCache,
} from "./commands.js";
import { SidebarProvider } from "./views/SidebarProvider.js";

let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "voiceSoundboard.togglePanel";
  updateStatusBar("connecting");
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Sidebar
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("voiceSoundboard.sidebar", sidebarProvider),
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("voiceSoundboard.speak", speakText),
    vscode.commands.registerCommand("voiceSoundboard.speakSelection", speakSelection),
    vscode.commands.registerCommand("voiceSoundboard.stop", stopSpeaking),
    vscode.commands.registerCommand("voiceSoundboard.setVoice", setVoice),
    vscode.commands.registerCommand("voiceSoundboard.togglePanel", togglePanel),
  );

  // Auto-start with setup
  const config = getConfig();
  if (config.autoStart) {
    try {
      // Check backend readiness (may prompt user for setup)
      const setup = await ensureBackendReady(config);

      if (!setup.ready) {
        updateStatusBar("setup");
        sidebarProvider.notifySetupRequired(
          setup.message || "TTS backend setup required",
          setup.backend,
        );
        return;
      }

      // Start with resolved backend (may differ from config if user switched)
      const resolvedConfig = { ...config, backend: setup.backend };
      await startServer(resolvedConfig);
      updateStatusBar("ready");
      await refreshVoiceCache();
      sidebarProvider.notifyConnected();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateStatusBar("offline");
      vscode.window.showErrorMessage(`Voice Soundboard: Failed to start — ${msg}`);
    }
  } else {
    updateStatusBar("offline");
  }
}

export async function deactivate(): Promise<void> {
  await stopServer();
}

function updateStatusBar(state: "connecting" | "ready" | "offline" | "setup"): void {
  switch (state) {
    case "connecting":
      statusBarItem.text = "$(loading~spin) Soundboard";
      statusBarItem.tooltip = "Voice Soundboard: Connecting...";
      break;
    case "ready":
      statusBarItem.text = "$(unmute) Soundboard";
      statusBarItem.tooltip = "Voice Soundboard: Ready";
      break;
    case "offline":
      statusBarItem.text = "$(mute) Soundboard";
      statusBarItem.tooltip = "Voice Soundboard: Offline";
      break;
    case "setup":
      statusBarItem.text = "$(gear) Soundboard";
      statusBarItem.tooltip = "Voice Soundboard: Setup required — click to configure";
      break;
  }
}
