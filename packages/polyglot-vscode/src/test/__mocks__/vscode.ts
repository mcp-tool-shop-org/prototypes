/**
 * Mock implementation of the `vscode` module for unit testing.
 * Covers the APIs used by polyglot-vscode source files.
 */

import { vi } from 'vitest';

/* ---------- Uri ---------- */
export class Uri {
  static file(path: string) {
    return { scheme: 'file', fsPath: path, path, toString: () => path };
  }
  static parse(value: string) {
    return { scheme: 'https', fsPath: value, path: value, toString: () => value };
  }
  static joinPath(base: { fsPath: string }, ...segments: string[]) {
    const joined = [base.fsPath, ...segments].join('/');
    return Uri.file(joined);
  }
}

/* ---------- Position / Range / Selection ---------- */
export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class Selection extends Range {}

/* ---------- TreeItem ---------- */
export class TreeItem {
  label?: string;
  description?: string;
  iconPath?: unknown;
  contextValue?: string;
  command?: unknown;

  constructor(label?: string) {
    this.label = label;
  }
}

/* ---------- ThemeIcon / ThemeColor ---------- */
export class ThemeIcon {
  constructor(public id: string) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

/* ---------- MarkdownString ---------- */
export class MarkdownString {
  value: string;
  constructor(value = '') {
    this.value = value;
  }
}

/* ---------- EventEmitter ---------- */
export class EventEmitter<T = void> {
  private _listeners: Array<(e: T) => void> = [];
  event = (listener: (e: T) => void) => {
    this._listeners.push(listener);
    return { dispose: () => {} };
  };
  fire(data?: T) {
    this._listeners.forEach((l) => l(data as T));
  }
  dispose() {
    this._listeners = [];
  }
}

/* ---------- Enums ---------- */
export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
}

/* ---------- window ---------- */
export const window = {
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  withProgress: vi.fn((_opts: unknown, task: (progress: unknown) => Promise<unknown>) =>
    task({ report: vi.fn() })
  ),
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  })),
  createStatusBarItem: vi.fn(() => ({
    text: '',
    tooltip: '',
    command: '',
    backgroundColor: undefined,
    color: undefined,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  })),
  activeTextEditor: undefined as unknown,
  showTextDocument: vi.fn().mockResolvedValue(undefined),
  registerWebviewViewProvider: vi.fn(),
};

/* ---------- workspace ---------- */
export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((key: string, defaultValue?: unknown) => {
      const defaults: Record<string, unknown> = {
        ollamaUrl: 'http://localhost:11434',
        model: 'translategemma:12b',
        defaultSourceLanguage: 'en',
        defaultLanguages: ['ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt-BR'],
      };
      return defaults[key] ?? defaultValue;
    }),
  })),
  workspaceFolders: undefined as unknown,
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
  openTextDocument: vi.fn().mockResolvedValue({}),
};

/* ---------- commands ---------- */
export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

/* ---------- env ---------- */
export const env = {
  openExternal: vi.fn(),
};
