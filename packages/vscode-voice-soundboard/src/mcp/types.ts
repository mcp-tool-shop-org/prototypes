export interface VoiceInfo {
  readonly id: string;
  readonly name: string;
  readonly gender: "male" | "female";
  readonly accent: string;
  readonly style: string;
  readonly language: string;
}

export interface PresetConfig {
  readonly name: string;
  readonly voice: string;
  readonly speed: number;
  readonly description: string;
}

export interface BackendInfo {
  readonly type: string;
  readonly ready: boolean;
  readonly model?: string;
  readonly sampleRate?: number;
}

export interface VoiceStatusResponse {
  readonly voices: VoiceInfo[];
  readonly presets: PresetConfig[];
  readonly defaultVoice: string;
  readonly backend: BackendInfo;
}

export interface VoiceSpeakResponse {
  readonly traceId: string;
  readonly voiceUsed: string;
  readonly presetUsed?: string;
  readonly speed: number;
  readonly artifactMode: "path" | "base64";
  readonly audioPath?: string;
  readonly audioBytesBase64?: string;
  readonly durationMs?: number;
  readonly sampleRate?: number;
  readonly format: string;
}

export interface VoiceInterruptResponse {
  readonly interrupted: boolean;
  readonly streamId?: string;
  readonly reason: string;
}

export interface DialogueLineResult {
  readonly type: "line";
  readonly speaker: string;
  readonly voice: string;
  readonly text: string;
  readonly audioPath?: string;
  readonly audioBytesBase64?: string;
  readonly durationMs: number;
}

export interface DialoguePauseResult {
  readonly type: "pause";
  readonly durationMs: number;
}

export interface DialogueResponse {
  readonly lineCount: number;
  readonly speakers: readonly string[];
  readonly cast: Record<string, string>;
  readonly artifacts: readonly (DialogueLineResult | DialoguePauseResult)[];
  readonly totalDurationMs: number;
}

export interface VoiceErrorResponse {
  readonly error: true;
  readonly code: string;
  readonly message: string;
  readonly traceId: string;
}
