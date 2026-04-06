/**
 * Minimal VS Code API mock for unit testing.
 * Only stubs the APIs actually used by tested modules.
 */

export const DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
} as const;

export class Range {
    constructor(
        public startLine: number,
        public startChar: number,
        public endLine: number,
        public endChar: number
    ) {}
}

export class Diagnostic {
    constructor(
        public range: Range,
        public message: string,
        public severity: number
    ) {}
}

export const window = {
    createOutputChannel: () => ({
        appendLine: () => {},
        append: () => {},
        show: () => {},
        dispose: () => {},
        clear: () => {},
    }),
};

export const workspace = {
    workspaceFolders: [],
    getConfiguration: () => ({
        get: () => undefined,
    }),
};

export const languages = {
    createDiagnosticCollection: () => ({
        set: () => {},
        delete: () => {},
        clear: () => {},
        dispose: () => {},
    }),
};

export class Uri {
    static file(path: string) {
        return { fsPath: path, scheme: 'file', path };
    }
    static joinPath(base: { fsPath: string }, ...segments: string[]) {
        return Uri.file([base.fsPath, ...segments].join('/'));
    }
}

export class EventEmitter {
    event = () => {};
    fire() {}
    dispose() {}
}
