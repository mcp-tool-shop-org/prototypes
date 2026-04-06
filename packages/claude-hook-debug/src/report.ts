import type { DebugReport, Diagnostic, SettingsFile, PluginState, ResolvedHook } from './types.js';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const UNDERLINE = '\x1b[4m';

const severityColor: Record<string, string> = {
  error: RED,
  warning: YELLOW,
  info: CYAN,
};

const severityIcon: Record<string, string> = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

// --- ANSI table report ---

function formatSettingsSection(files: SettingsFile[]): string {
  const lines: string[] = [];
  lines.push(`${BOLD}${UNDERLINE}Settings Files${RESET}`);
  lines.push('');

  for (const f of files) {
    const status = f.exists
      ? f.error
        ? `${RED}✗ BROKEN${RESET}`
        : `${GREEN}✓ loaded${RESET}`
      : `${DIM}— not found${RESET}`;

    const size =
      f.exists && f.raw
        ? `${DIM}(${(JSON.stringify(f.raw).length / 1024).toFixed(1)}KB)${RESET}`
        : '';

    lines.push(`  ${BOLD}${f.scope.padEnd(8)}${RESET} ${status} ${size}`);
    lines.push(`  ${DIM}${f.path}${RESET}`);
    if (f.error) {
      lines.push(`  ${RED}${f.error}${RESET}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatPluginsSection(plugins: PluginState[]): string {
  const lines: string[] = [];
  lines.push(`${BOLD}${UNDERLINE}Plugins${RESET}`);
  lines.push('');

  if (plugins.length === 0) {
    lines.push(`  ${DIM}No plugins configured.${RESET}`);
    lines.push('');
    return lines.join('\n');
  }

  for (const p of plugins) {
    const enabled = p.mergedEnabled;
    const icon = enabled ? `${GREEN}●${RESET}` : `${RED}○${RESET}`;
    const state = enabled ? `${GREEN}enabled${RESET}` : `${RED}disabled${RESET}`;
    lines.push(`  ${icon} ${BOLD}${p.pluginId}${RESET} → ${state}`);

    for (const s of p.scopes) {
      const scopeState = s.enabled ? `${GREEN}true${RESET}` : `${RED}false${RESET}`;
      lines.push(`    ${DIM}${s.scope}:${RESET} ${scopeState}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatHooksSection(hooks: ResolvedHook[], disableAllHooks: boolean): string {
  const lines: string[] = [];
  lines.push(`${BOLD}${UNDERLINE}Hooks${RESET}`);
  if (disableAllHooks) {
    lines.push(`  ${RED}${BOLD}disableAllHooks: true${RESET} — all hooks suppressed`);
  }
  lines.push('');

  if (hooks.length === 0) {
    lines.push(`  ${DIM}No user-defined hooks in settings files.${RESET}`);
    lines.push(`  ${DIM}(Plugin hooks are injected at runtime and invisible here.)${RESET}`);
    lines.push('');
    return lines.join('\n');
  }

  // Group by event
  const byEvent = new Map<string, ResolvedHook[]>();
  for (const h of hooks) {
    const list = byEvent.get(h.event) ?? [];
    list.push(h);
    byEvent.set(h.event, list);
  }

  for (const [event, eventHooks] of byEvent) {
    lines.push(`  ${CYAN}${event}${RESET} (${eventHooks.length})`);
    for (const h of eventHooks) {
      const matcher = h.matcher ? ` ${DIM}matcher=${h.matcher}${RESET}` : '';
      const source = `${DIM}[${h.source}]${RESET}`;
      const desc =
        h.hook.type === 'command'
          ? h.hook.command ?? '(empty)'
          : h.hook.type === 'prompt'
            ? `prompt: ${(h.hook.prompt ?? '').slice(0, 60)}...`
            : h.hook.type === 'http'
              ? `http: ${h.hook.url ?? '(no url)'}`
              : `${h.hook.type}: agent`;

      lines.push(`    ${source}${matcher} ${h.hook.type}: ${DIM}${desc}${RESET}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatDiagnosticsSection(diagnostics: Diagnostic[]): string {
  const lines: string[] = [];

  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length;
  const infos = diagnostics.filter((d) => d.severity === 'info').length;

  lines.push(`${BOLD}${UNDERLINE}Diagnostics${RESET} (${errors} errors, ${warnings} warnings, ${infos} info)`);
  lines.push('');

  if (diagnostics.length === 0) {
    lines.push(`  ${GREEN}✓ No issues detected.${RESET}`);
    lines.push('');
    return lines.join('\n');
  }

  for (const d of diagnostics) {
    const color = severityColor[d.severity] ?? DIM;
    const icon = severityIcon[d.severity] ?? '?';

    lines.push(`  ${color}${icon} [${d.id}]${RESET} ${BOLD}${d.title}${RESET}`);
    lines.push(`    ${d.detail}`);
    if (d.fix) {
      lines.push(`    ${GREEN}Fix:${RESET} ${d.fix}`);
    }
    if (d.references && d.references.length > 0) {
      lines.push(`    ${DIM}Refs: ${d.references.join(', ')}${RESET}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatReport(report: DebugReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`${BOLD}Claude Hook Debug${RESET}  ${DIM}${report.timestamp}  ${report.platform}${RESET}`);
  lines.push(`${'═'.repeat(60)}`);
  lines.push('');
  lines.push(formatSettingsSection(report.settingsFiles));
  lines.push(formatPluginsSection(report.plugins));
  lines.push(formatHooksSection(report.hooks, report.disableAllHooks));
  lines.push(formatDiagnosticsSection(report.diagnostics));

  return lines.join('\n');
}

// --- JSON report ---

export function formatReportJson(report: DebugReport): string {
  return JSON.stringify(report, null, 2);
}
