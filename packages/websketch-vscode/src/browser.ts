import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

const WINDOWS_CHROME_PATHS = [
  path.join(process.env['PROGRAMFILES'] ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['LOCALAPPDATA'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES'] ?? 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
];

const MACOS_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const LINUX_COMMANDS = ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'];

function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function whichSync(cmd: string): string | null {
  try {
    const result = childProcess.execSync(`which ${cmd} 2>/dev/null`, { encoding: 'utf-8' });
    return result.trim() || null;
  } catch {
    return null;
  }
}

export function findBrowser(): string {
  // Check user setting first
  const configured = vscode.workspace.getConfiguration('websketch').get<string>('chromePath');
  if (configured && fileExists(configured)) {
    return configured;
  }

  const platform = process.platform;

  if (platform === 'win32') {
    for (const p of WINDOWS_CHROME_PATHS) {
      if (fileExists(p)) { return p; }
    }
  } else if (platform === 'darwin') {
    for (const p of MACOS_CHROME_PATHS) {
      if (fileExists(p)) { return p; }
    }
  } else {
    for (const cmd of LINUX_COMMANDS) {
      const resolved = whichSync(cmd);
      if (resolved) { return resolved; }
    }
  }

  throw new Error(
    'Could not find Chrome or Edge. Install Chrome/Edge or set "websketch.chromePath" in VS Code settings.'
  );
}

export interface CaptureOptions {
  viewportWidth: number;
  viewportHeight: number;
  timeout: number;
  waitAfterLoad: number;
}

export function getSettings(): CaptureOptions {
  const config = vscode.workspace.getConfiguration('websketch');
  return {
    viewportWidth: config.get<number>('viewportWidth') ?? 1280,
    viewportHeight: config.get<number>('viewportHeight') ?? 800,
    timeout: config.get<number>('timeout') ?? 30000,
    waitAfterLoad: config.get<number>('waitAfterLoad') ?? 1000,
  };
}
