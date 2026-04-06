import * as vscode from "vscode";

export interface ExtensionConfig {
  defaultVoice: string;
  speed: number;
  backend: "mock" | "python" | "http";
  autoStart: boolean;
  format: "wav" | "mp3" | "ogg";
  openaiApiKey: string;
  pythonPath: string;
}

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration("voiceSoundboard");
  return {
    defaultVoice: cfg.get<string>("defaultVoice", "bm_george"),
    speed: cfg.get<number>("speed", 1.0),
    backend: cfg.get<"mock" | "python" | "http">("backend", "python"),
    autoStart: cfg.get<boolean>("autoStart", true),
    format: cfg.get<"wav" | "mp3" | "ogg">("format", "wav"),
    openaiApiKey: cfg.get<string>("openaiApiKey", ""),
    pythonPath: cfg.get<string>("pythonPath", ""),
  };
}
