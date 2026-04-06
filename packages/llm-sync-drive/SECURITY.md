# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |

## Scope

llm-sync-drive syncs Google Drive documents to local filesystem for LLM consumption. It handles **Google OAuth2 tokens** and downloads document content.

Security-relevant components:
- **OAuth2 flow**: Uses Google SDK for authentication; tokens stored locally
- **File sync**: Downloads Google Docs as plain text to local directories
- **Config**: YAML config with Drive folder IDs and sync paths

## Reporting a Vulnerability

If you discover a security issue — especially related to token handling or file write paths:

1. **Email**: 64996768+mcp-tool-shop@users.noreply.github.com
2. **Subject**: `[SECURITY] llm-sync-drive: <brief description>`

We will acknowledge reports within 7 days and provide a fix within 30 days.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| OAuth token exposure | Tokens stored in user data dir; never logged or committed |
| Path traversal via sync | Sync paths validated against config; no user-controlled file names |
| Credential in repo | .gitignore excludes token.json and credentials.json |
| Man-in-the-middle | All Google API calls use HTTPS via Google SDK |

## Security Practices

- No secrets or credentials in this repository
- OAuth tokens stored in user-local directory only
- Google API access via official Python SDK (HTTPS)
- CI runs ruff lint + pytest on every push
- credentials.json and token.json gitignored
