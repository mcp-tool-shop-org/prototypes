/**
 * Mock implementation of the `vscode` module for unit testing.
 */
import { vi } from 'vitest';

export class Uri {
  readonly scheme: string;
  readonly fsPath: string;
  readonly path: string;

  private constructor(scheme: string, path: string) {
    this.scheme = scheme;
    this.fsPath = path;
    this.path = path;
  }

  static file(path: string) {
    return new Uri('file', path);
  }

  static parse(value: string) {
    return new Uri('https', value);
  }

  static joinPath(base: Uri, ...segments: string[]) {
    return new Uri(base.scheme, [base.fsPath, ...segments].join('/'));
  }

  toString() {
    return `${this.scheme}://${this.fsPath}`;
  }
}

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class Selection extends Range {
  constructor(
    public anchor: Position,
    public active: Position,
  ) {
    super(anchor, active);
  }

  get isEmpty(): boolean {
    return this.anchor.line === this.active.line && this.anchor.character === this.active.character;
  }
}

export class Diagnostic {
  code?: string;
  source?: string;
  relatedInformation?: unknown[];

  constructor(
    public range: Range,
    public message: string,
    public severity?: number,
  ) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class ThemeIcon {
  constructor(public id: string) {}
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

const mockStatusBarItem = {
  text: '',
  tooltip: '',
  command: '',
  backgroundColor: undefined as unknown,
  show: vi.fn(),
  hide: vi.fn(),
  dispose: vi.fn(),
};

const mockOutputChannel = {
  appendLine: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
};

const mockTerminal = {
  show: vi.fn(),
  sendText: vi.fn(),
  dispose: vi.fn(),
};

const mockWebviewView = {
  webview: {
    options: {},
    html: '',
    onDidReceiveMessage: vi.fn(),
    postMessage: vi.fn().mockResolvedValue(true),
    asWebviewUri: vi.fn((uri: Uri) => uri),
    cspSource: 'https://mock.csp',
  },
};

export const window = {
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showInputBox: vi.fn().mockResolvedValue(undefined),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  showSaveDialog: vi.fn().mockResolvedValue(undefined),
  showTextDocument: vi.fn().mockResolvedValue(undefined),
  createStatusBarItem: vi.fn(() => ({ ...mockStatusBarItem })),
  createOutputChannel: vi.fn(() => ({ ...mockOutputChannel })),
  createTerminal: vi.fn(() => ({ ...mockTerminal })),
  registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
  activeTextEditor: undefined as unknown,
};

const mockConfigGet = vi.fn((key: string, defaultValue?: unknown) => {
  const defaults: Record<string, unknown> = {
    defaultVoice: 'bm_george',
    speed: 1.0,
    backend: 'python',
    autoStart: true,
    format: 'wav',
    openaiApiKey: '',
    pythonPath: '',
  };
  return defaults[key] ?? defaultValue;
});

const mockConfigUpdate = vi.fn().mockResolvedValue(undefined);

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: mockConfigGet,
    update: mockConfigUpdate,
  })),
  workspaceFolders: undefined as unknown,
  fs: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('')),
  },
  openTextDocument: vi.fn().mockResolvedValue({ uri: Uri.file('/mock-doc') }),
};

export const commands = {
  registerCommand: vi.fn((_id: string, _handler: unknown) => ({ dispose: vi.fn() })),
  executeCommand: vi.fn().mockResolvedValue(undefined),
};

export const env = {
  openExternal: vi.fn().mockResolvedValue(true),
};

export class Disposable {
  constructor(private callOnDispose: () => void) {}
  dispose() {
    this.callOnDispose();
  }
}

export class EventEmitter<T> {
  private handlers: Array<(e: T) => void> = [];
  event = (handler: (e: T) => void) => {
    this.handlers.push(handler);
    return new Disposable(() => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    });
  };
  fire(data: T) {
    this.handlers.forEach((h) => h(data));
  }
  dispose() {
    this.handlers = [];
  }
}

// Helper to get mock internals for assertions
export const __mocks = {
  statusBarItem: mockStatusBarItem,
  outputChannel: mockOutputChannel,
  terminal: mockTerminal,
  webviewView: mockWebviewView,
  configGet: mockConfigGet,
  configUpdate: mockConfigUpdate,
};
