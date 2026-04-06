import { platform } from 'node:os';
import {
  scanAllSettings,
  extractPlugins,
  extractHooks,
  getDisableAllHooks,
} from './scanner.js';
import type { ScanOptions } from './scanner.js';
import { runDiagnostics } from './diagnostics.js';
import type { DebugReport } from './types.js';

export type { ScanOptions } from './scanner.js';

export {
  scanAllSettings,
  extractPlugins,
  extractHooks,
  getDisableAllHooks,
  resolveSettingsPaths,
} from './scanner.js';

export { runDiagnostics } from './diagnostics.js';
export { formatReport, formatReportJson } from './report.js';

export type {
  SettingsScope,
  SettingsFile,
  HookEvent,
  HookCommand,
  HookGroup,
  HooksConfig,
  PluginState,
  ResolvedHook,
  Severity,
  Diagnostic,
  DebugReport,
} from './types.js';

/**
 * Run a full diagnostic scan and return a structured report.
 */
export function debug(opts?: ScanOptions): DebugReport {
  const files = scanAllSettings(opts);
  const plugins = extractPlugins(files);
  const hooks = extractHooks(files);
  const disableAllHooks = getDisableAllHooks(files);

  const diagnostics = runDiagnostics({
    files,
    plugins,
    hooks,
    disableAllHooks,
  });

  return {
    timestamp: new Date().toISOString(),
    platform: `${platform()} ${process.arch}`,
    settingsFiles: files,
    plugins,
    hooks,
    diagnostics,
    disableAllHooks,
  };
}
