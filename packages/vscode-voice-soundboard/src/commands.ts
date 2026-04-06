import * as vscode from "vscode";
import * as mcpClient from "./mcp/client.js";
import { isConnected } from "./mcp/lifecycle.js";
import { playAudio, stopAudio } from "./audio/player.js";
import { getConfig } from "./config.js";
import type { VoiceInfo } from "./mcp/types.js";

let cachedVoices: VoiceInfo[] = [];

export async function refreshVoiceCache(): Promise<void> {
  if (!isConnected()) return;
  try {
    const status = await mcpClient.getStatus();
    cachedVoices = status.voices;
  } catch {
    // will retry on next call
  }
}

export async function speakText(): Promise<void> {
  if (!isConnected()) {
    vscode.window.showWarningMessage("Voice Soundboard: Server not connected");
    return;
  }

  const text = await vscode.window.showInputBox({
    prompt: "Enter text to speak",
    placeHolder: "Hello, world!",
  });
  if (!text) return;

  await doSpeak(text);
}

export async function speakSelection(): Promise<void> {
  if (!isConnected()) {
    vscode.window.showWarningMessage("Voice Soundboard: Server not connected");
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Voice Soundboard: No active editor");
    return;
  }

  const selection = editor.document.getText(editor.selection);
  if (!selection) {
    vscode.window.showWarningMessage("Voice Soundboard: No text selected");
    return;
  }

  await doSpeak(selection);
}

async function doSpeak(text: string): Promise<void> {
  const config = getConfig();
  try {
    const result = await mcpClient.speak(text, config.defaultVoice, config.speed);
    if (result.audioPath) {
      playAudio(result.audioPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Voice Soundboard: ${msg}`);
  }
}

export function stopSpeaking(): void {
  stopAudio();
  mcpClient.interrupt().catch(() => {
    // best-effort interrupt
  });
}

export async function setVoice(): Promise<void> {
  if (cachedVoices.length === 0) {
    await refreshVoiceCache();
  }

  const items = cachedVoices.map((v) => ({
    label: v.name,
    description: `${v.accent} ${v.gender} — ${v.style}`,
    detail: v.id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a voice",
    matchOnDescription: true,
  });

  if (picked) {
    const cfg = vscode.workspace.getConfiguration("voiceSoundboard");
    await cfg.update("defaultVoice", picked.detail, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Voice set to ${picked.label}`);
  }
}

export function togglePanel(): void {
  vscode.commands.executeCommand("voiceSoundboard.sidebar.focus");
}
