import * as vscode from "vscode";
import * as path from "path";
import * as mcpClient from "../mcp/client.js";
import { isConnected } from "../mcp/lifecycle.js";
import { playAudio, stopAudio, isPlaying } from "../audio/player.js";
import { getConfig } from "../config.js";
import type { DialogueLineResult, DialoguePauseResult } from "../mcp/types.js";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private dialogueAbort: AbortController | null = null;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "speak":
          await this.handleSpeak(msg.text, msg.voice, msg.speed);
          break;
        case "stop":
          this.handleStop();
          break;
        case "preview":
          await this.handlePreview(msg.voiceId, msg.voiceName);
          break;
        case "dialogue":
          await this.handleDialogue(msg.script, msg.cast, msg.speed);
          break;
        case "exportDialogue":
          await this.handleExportDialogue(msg.script, msg.cast, msg.speed);
          break;
        case "requestStatus":
          await this.sendStatus();
          break;
        case "openSettings":
          vscode.commands.executeCommand("workbench.action.openSettings", "voiceSoundboard");
          break;
      }
    });

    if (isConnected()) {
      this.sendStatus();
    }
  }

  notifyConnected(): void {
    this.sendStatus();
  }

  notifySetupRequired(message: string, backend: string): void {
    this.postMessage({ type: "setupRequired", message, backend });
  }

  private async handleSpeak(text: string, voice?: string, speed?: number): Promise<void> {
    if (!text) return;
    this.postMessage({ type: "speaking", speaking: true });
    try {
      const result = await mcpClient.speak(text, voice, speed);
      if (result.audioPath) {
        playAudio(result.audioPath);
      }
      this.postMessage({ type: "speakResult", duration: result.durationMs });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.postMessage({ type: "error", message: msg });
    } finally {
      this.postMessage({ type: "speaking", speaking: false });
    }
  }

  private handleStop(): void {
    stopAudio();
    this.dialogueAbort?.abort();
    mcpClient.interrupt().catch(() => {});
    this.postMessage({ type: "speaking", speaking: false });
  }

  private async handlePreview(voiceId: string, voiceName: string): Promise<void> {
    try {
      const result = await mcpClient.speak(`Hello, I'm ${voiceName}.`, voiceId);
      if (result.audioPath) {
        playAudio(result.audioPath);
      }
    } catch {
      // silent fail for previews
    }
  }

  private async handleDialogue(
    script: string,
    cast?: Record<string, string>,
    speed?: number,
  ): Promise<void> {
    if (!script) return;
    this.dialogueAbort?.abort();
    const abort = new AbortController();
    this.dialogueAbort = abort;

    this.postMessage({ type: "speaking", speaking: true });
    try {
      const result = await mcpClient.dialogue(script, cast, speed);
      // Play each line's audio sequentially
      for (const artifact of result.artifacts) {
        if (abort.signal.aborted) break;
        if (artifact.type === "line" && artifact.audioPath) {
          playAudio(artifact.audioPath);
          await new Promise((r) => {
            const timer = setTimeout(r, artifact.durationMs + 200);
            abort.signal.addEventListener("abort", () => { clearTimeout(timer); r(undefined); }, { once: true });
          });
        } else if (artifact.type === "pause") {
          await new Promise((r) => {
            const timer = setTimeout(r, artifact.durationMs);
            abort.signal.addEventListener("abort", () => { clearTimeout(timer); r(undefined); }, { once: true });
          });
        }
      }
      if (!abort.signal.aborted) {
        this.postMessage({ type: "dialogueResult", totalDuration: result.totalDurationMs });
      }
    } catch (err) {
      if (!abort.signal.aborted) {
        const msg = err instanceof Error ? err.message : String(err);
        this.postMessage({ type: "error", message: msg });
      }
    } finally {
      this.dialogueAbort = null;
      this.postMessage({ type: "speaking", speaking: false });
    }
  }

  private async handleExportDialogue(
    script: string,
    cast?: Record<string, string>,
    speed?: number,
  ): Promise<void> {
    if (!script) return;
    this.postMessage({ type: "speaking", speaking: true });
    try {
      const result = await mcpClient.dialogue(script, cast, speed);

      // Build WebVTT
      const lines: string[] = ["WEBVTT", ""];
      let currentMs = 0;

      for (const artifact of result.artifacts) {
        if (artifact.type === "line") {
          const line = artifact as DialogueLineResult;
          const startTime = formatVttTime(currentMs);
          const endTime = formatVttTime(currentMs + line.durationMs);
          lines.push(`${startTime} --> ${endTime}`);
          lines.push(`<v ${line.speaker}>${line.text}`);
          lines.push("");
          currentMs += line.durationMs;
        } else if (artifact.type === "pause") {
          const pause = artifact as DialoguePauseResult;
          currentMs += pause.durationMs;
        }
      }

      // Save to workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `dialogue-${timestamp}.vtt`;

      let saveUri: vscode.Uri;
      if (workspaceFolders && workspaceFolders.length > 0) {
        saveUri = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, filename));
      } else {
        const chosen = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(filename),
          filters: { "WebVTT": ["vtt"], "All Files": ["*"] },
        });
        if (!chosen) return;
        saveUri = chosen;
      }

      await vscode.workspace.fs.writeFile(saveUri, Buffer.from(lines.join("\n"), "utf-8"));
      const doc = await vscode.workspace.openTextDocument(saveUri);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(
        `Dialogue exported: ${path.basename(saveUri.fsPath)} (${result.lineCount} lines, ${(result.totalDurationMs / 1000).toFixed(1)}s)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.postMessage({ type: "error", message: msg });
    } finally {
      this.postMessage({ type: "speaking", speaking: false });
    }
  }

  private async sendStatus(): Promise<void> {
    if (!isConnected()) {
      this.postMessage({ type: "status", connected: false });
      return;
    }
    try {
      const status = await mcpClient.getStatus();
      const config = getConfig();
      this.postMessage({
        type: "status",
        connected: true,
        voices: status.voices,
        presets: status.presets,
        defaultVoice: config.defaultVoice,
        defaultSpeed: config.speed,
        backend: status.backend,
      });
    } catch {
      this.postMessage({ type: "status", connected: false });
    }
  }

  private postMessage(msg: unknown): void {
    this.view?.webview.postMessage(msg);
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "src", "views", "webview", "styles.css"),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "src", "views", "webview", "main.js"),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Voice Soundboard</title>
</head>
<body>
  <div class="tabs">
    <button class="tab active" data-tab="speak">Speak</button>
    <button class="tab" data-tab="voices">Voices</button>
    <button class="tab" data-tab="dialogue">Dialogue</button>
  </div>

  <div class="status-chip" id="statusChip">Connecting...</div>

  <!-- Speak Tab -->
  <div class="tab-content active" id="tab-speak">
    <div class="presets" id="presets"></div>
    <textarea id="speakText" placeholder="Type or paste text to speak..." rows="5"></textarea>
    <div class="controls">
      <select id="voiceSelect"></select>
      <div class="speed-control">
        <label for="speedSlider">Speed</label>
        <input type="range" id="speedSlider" min="0.5" max="2.0" step="0.05" value="1.0">
        <span id="speedValue">1.0x</span>
      </div>
    </div>
    <div class="actions">
      <button id="speakBtn" class="primary" disabled>Speak</button>
      <button id="stopBtn" class="danger" style="display:none">Stop</button>
    </div>
  </div>

  <!-- Voices Tab -->
  <div class="tab-content" id="tab-voices">
    <input type="text" id="voiceSearch" placeholder="Search voices...">
    <div class="filters" id="voiceFilters"></div>
    <div class="voice-list" id="voiceList"></div>
  </div>

  <!-- Dialogue Tab -->
  <div class="tab-content" id="tab-dialogue">
    <textarea id="dialogueScript" placeholder="Alice: Hello there!&#10;Bob: Hi Alice, how are you?" rows="8" class="mono"></textarea>
    <div id="castPanel" class="cast-panel"></div>
    <div class="actions">
      <button id="dialoguePlayBtn" class="primary" disabled>Play All</button>
      <button id="dialogueExportBtn" class="secondary" disabled>Export VTT</button>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

export function formatVttTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
