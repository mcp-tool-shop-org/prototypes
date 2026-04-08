import * as vscode from 'vscode';
import { LANGUAGES, type Language } from '@mcptoolshop/polyglot-mcp/languages';

// ---------------------------------------------------------------------------
// Structured Error Shape (Shipcheck Gate B)
// ---------------------------------------------------------------------------

export type ErrorCode =
  | 'OLLAMA_UNAVAILABLE'
  | 'MODEL_NOT_FOUND'
  | 'UNSUPPORTED_LANGUAGE'
  | 'TRANSLATE_ERROR';

export interface ErrorInfo {
  readonly code: ErrorCode;
  readonly message: string;
  readonly hint: string;
  readonly cause?: string;
  readonly retryable: boolean;
}

/** Read all Polyglot settings from VS Code configuration. */
export function getConfig() {
  const cfg = vscode.workspace.getConfiguration('polyglot');
  return {
    ollamaUrl: cfg.get<string>('ollamaUrl', 'http://localhost:11434'),
    model: cfg.get<string>('model', 'translategemma:12b'),
    defaultSourceLanguage: cfg.get<string>('defaultSourceLanguage', 'en'),
    defaultLanguages: cfg.get<string[]>('defaultLanguages', [
      'ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt-BR',
    ]),
  };
}

/** Show a quick-pick for a single language. Returns the Language or undefined. */
export async function pickLanguage(
  placeholder: string
): Promise<Language | undefined> {
  const items = LANGUAGES.filter((l) => l.code !== 'en').map((l) => ({
    label: l.name,
    description: l.code,
    language: l,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: placeholder,
    matchOnDescription: true,
  });

  return pick?.language;
}

/** Show a multi-select quick-pick for languages. Returns selected codes. */
export async function pickLanguages(
  placeholder: string,
  defaults: string[]
): Promise<string[] | undefined> {
  const items = LANGUAGES.filter((l) => l.code !== 'en').map((l) => ({
    label: l.name,
    description: l.code,
    picked: defaults.includes(l.code),
    language: l,
  }));

  const picks = await vscode.window.showQuickPick(items, {
    placeHolder: placeholder,
    canPickMany: true,
    matchOnDescription: true,
  });

  if (!picks || picks.length === 0) return undefined;
  return picks.map((p) => p.language.code);
}

/** Shared output channel — created once during activation. */
let _outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!_outputChannel) {
    _outputChannel = vscode.window.createOutputChannel('Polyglot');
  }
  return _outputChannel;
}

export function log(msg: string): void {
  getOutputChannel().appendLine(`[${new Date().toISOString()}] ${msg}`);
}

/**
 * Classify a raw error into a structured ErrorInfo object.
 * The structured shape satisfies Shipcheck Gate B: code, message, hint, cause?, retryable?.
 */
export function classifyError(context: string, err: unknown): ErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('fetch') || raw.includes('ECONNREFUSED') || raw.includes('Cannot connect')) {
    return {
      code: 'OLLAMA_UNAVAILABLE',
      message: `${context}: Ollama doesn't seem to be running. Start it first, or check your connection.`,
      hint: 'Run "Polyglot: Check Status" or start Ollama manually.',
      cause: raw,
      retryable: true,
    };
  }

  if (raw.includes('not found') || raw.includes('Could not pull')) {
    return {
      code: 'MODEL_NOT_FOUND',
      message: `${context}: The translation model isn't available. Run "Polyglot: Check Status" to download it.`,
      hint: 'Run "Polyglot: Check Status" to auto-pull the model.',
      cause: raw,
      retryable: true,
    };
  }

  if (raw.includes('Unsupported')) {
    return {
      code: 'UNSUPPORTED_LANGUAGE',
      message: `${context}: ${raw}. Polyglot supports 55 languages — check the language code in Settings.`,
      hint: 'Open Settings and verify the language code.',
      cause: raw,
      retryable: false,
    };
  }

  return {
    code: 'TRANSLATE_ERROR',
    message: `${context}: ${raw}`,
    hint: 'Run "Polyglot: Help" for troubleshooting.',
    cause: raw,
    retryable: false,
  };
}

/**
 * Show a friendly error message with contextual action buttons.
 * Classifies the error into a structured shape, logs it, and surfaces
 * the message via VS Code notification API.
 */
export function friendlyError(context: string, err: unknown): void {
  const info = classifyError(context, err);
  log(`[${info.code}] ${info.message} (retryable: ${info.retryable})`);

  const actions: Record<ErrorCode, { buttons: string[]; handler: (a: string) => void }> = {
    OLLAMA_UNAVAILABLE: {
      buttons: ['Check Status', 'Help'],
      handler: (a) => {
        if (a === 'Check Status') vscode.commands.executeCommand('polyglot.checkStatus');
        else if (a === 'Help') vscode.commands.executeCommand('polyglot.help');
      },
    },
    MODEL_NOT_FOUND: {
      buttons: ['Check Status'],
      handler: (a) => {
        if (a === 'Check Status') vscode.commands.executeCommand('polyglot.checkStatus');
      },
    },
    UNSUPPORTED_LANGUAGE: {
      buttons: ['Settings'],
      handler: (a) => {
        if (a === 'Settings') vscode.commands.executeCommand('workbench.action.openSettings', 'polyglot');
      },
    },
    TRANSLATE_ERROR: {
      buttons: ['Help'],
      handler: (a) => {
        if (a === 'Help') vscode.commands.executeCommand('polyglot.help');
      },
    },
  };

  const { buttons, handler } = actions[info.code];
  vscode.window.showErrorMessage(info.message, ...buttons).then((action) => {
    if (action) handler(action);
  });
}
