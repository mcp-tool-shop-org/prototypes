# Privacy & Security

**InControl-Desktop — Data Handling & Security**

This document describes how InControl handles your data, what information is stored, and the security measures in place.

---

## Data Storage

All InControl data is stored **locally on your machine**. No data is transmitted to external servers by InControl itself.

### Storage Locations

| Data Type | Location | Purpose |
|-----------|----------|---------|
| Sessions | `%LOCALAPPDATA%\InControl\sessions\` | Conversation history and context |
| Logs | `%LOCALAPPDATA%\InControl\logs\` | Application logs for troubleshooting |
| Cache | `%LOCALAPPDATA%\InControl\cache\` | Temporary data and model caches |
| Config | `%LOCALAPPDATA%\InControl\config\` | User preferences and settings |
| Temp | `%LOCALAPPDATA%\InControl\temp\` | Temporary processing files |
| Support | `%LOCALAPPDATA%\InControl\support\` | Support bundles when exported |
| Exports | `%USERPROFILE%\Documents\InControl\exports\` | User-exported data |

### What Is Stored

- **Session Data**: Your conversation history, including messages you send and responses received from local AI models
- **Model Selections**: Which models you've chosen to use
- **UI Preferences**: Theme, layout, and display settings
- **Application Logs**: Operational logs (no message content by default)

### What Is NOT Stored

- No data is stored on external servers
- No telemetry is sent to Anthropic, Microsoft, or any third party
- No usage analytics are collected

---

## Network Activity

### Local Model Inference

InControl connects to **local inference backends** running on your machine:

| Backend | Default Address | Purpose |
|---------|-----------------|---------|
| llama.cpp | `http://localhost:8080` | Local LLM inference |
| Ollama | `http://localhost:11434` | Local LLM inference |

These connections are:
- **Localhost only** by default
- **Configurable** for custom setups
- **No external network calls** unless you explicitly configure a remote endpoint

### What InControl Does NOT Do

- Does not phone home
- Does not check for updates automatically (manual check only)
- Does not send crash reports without explicit user action
- Does not connect to cloud AI services

---

## Secrets Policy

### No Secrets in Logs

InControl is designed to **never log sensitive information**:

- API keys are never written to logs
- Tokens and credentials are never logged
- Session content is not logged (only metadata)

### Secure Storage

Any sensitive configuration (if applicable) uses:
- Windows Credential Manager for secure credential storage
- File system permissions appropriate for user data

### Support Bundles

When you export a support bundle:
- **Included**: Version info, runtime info, log files, sanitized config
- **Excluded**: Session content, API keys, tokens, credentials
- **User-Approved Only**: Session metadata is only included with explicit opt-in

---

## Data Retention

### Automatic Cleanup

- **Logs**: Rolling file system with size caps (default: 10MB per file, 5 files max)
- **Cache**: Automatic cleanup of stale cache entries
- **Temp**: Cleaned on application startup

### User Control

You have full control over your data:
- **Export**: Export sessions to JSON or Markdown anytime
- **Delete**: Delete individual sessions or all data
- **Reset**: Full application reset with export-first prompt

---

## Write Boundaries

InControl enforces strict write boundaries:

### Allowed Write Locations

- `%LOCALAPPDATA%\InControl\*` - Application data
- `%USERPROFILE%\Documents\InControl\exports\*` - User exports

### Forbidden Write Locations

InControl will **never** write to:
- System directories (`C:\Windows\*`)
- Program Files (`C:\Program Files\*`)
- Other users' directories
- Any location outside the allowed roots

---

## Dependency Security

### Vulnerability Scanning

Dependencies are scanned for known vulnerabilities:
- Run `dotnet list package --vulnerable` to check
- Security advisories are monitored for critical packages

### Key Dependencies

| Package | Purpose | Security Notes |
|---------|---------|----------------|
| Microsoft.WindowsAppSDK | UI framework | Microsoft-maintained |
| LLamaSharp | Local inference | Open source |
| System.Text.Json | Serialization | .NET BCL |

---

## Threat Model

### In Scope

- Local data confidentiality
- Protection against data exfiltration
- Secure handling of model outputs

### Out of Scope

- Physical access attacks
- Compromised operating system
- Malicious local inference backends

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email security concerns to the maintainers privately
3. Include steps to reproduce if possible

---

## Compliance Notes

- **No GDPR applicability**: No data leaves your machine
- **No cloud processing**: All inference is local
- **Full data portability**: Export all your data anytime

---

*Last updated: 2026-02-03*
