# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

Claude Session Copilot is an **MCP server plugin** for Claude Code session continuity.
- **Data accessed:** Reads and writes session data (decisions, timeline events, snapshots) to `.claude/copilot/store.json` in the project directory or `~/.claude/copilot/store.json` as fallback. Monitors PostToolUse hooks for Bash, Write, Edit, and TodoWrite events.
- **Data NOT accessed:** No network requests. No telemetry. No cloud services. No credential storage. All data stays local. Does not read source code contents — only records file paths and event metadata.
- **Permissions required:** File system read/write for the copilot store JSON file. MCP stdio transport (no network listeners).
