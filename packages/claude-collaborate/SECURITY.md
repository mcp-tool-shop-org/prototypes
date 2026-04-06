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

Claude Collaborate is a **local-first collaboration sandbox** with a Python web server and WebSocket bridge.
- **Data accessed:** Serves static HTML/JS files from the project directory. WebSocket bridge relays messages between browser and Claude Code via JSONL files on disk (`messages.jsonl`, `claude_responses.jsonl`). Files are cleared after read and rotated at 10 MB.
- **Data NOT accessed:** No telemetry. No cloud services. No credential storage. No database.
- **Permissions required:** Network listen on localhost (default ports 8877/8878). File system read for static assets. File system write for bridge message files in the project directory.
