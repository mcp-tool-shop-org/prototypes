import { debug } from './index.js';
import { formatReport, formatReportJson } from './report.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`claude-hook-debug — Diagnostic CLI for Claude Code hook issues

Usage:
  claude-hook-debug [project-path] [flags]

Flags:
  --json       Output as JSON (for piping/scripting)
  --help, -h   Show this help message
  --version    Show version

Examples:
  claude-hook-debug                  # Scan current workspace
  claude-hook-debug /path/to/project # Scan specific project
  claude-hook-debug --json           # JSON output

Exit codes:
  0  No errors found
  1  One or more diagnostic errors detected

Built by MCP Tool Shop — https://mcp-tool-shop.github.io/`);
  process.exit(0);
}

if (args.includes('--version')) {
  try {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    console.log(pkg.version);
  } catch {
    console.log('unknown');
  }
  process.exit(0);
}

const useJson = args.includes('--json');
const projectRoot = args.find((a) => !a.startsWith('-'));

const report = debug({ projectRoot: projectRoot ?? process.cwd() });

if (useJson) {
  console.log(formatReportJson(report));
} else {
  console.log(formatReport(report));
}

// Exit code: 1 if any errors, 0 otherwise
const hasErrors = report.diagnostics.some((d) => d.severity === 'error');
process.exit(hasErrors ? 1 : 0);
