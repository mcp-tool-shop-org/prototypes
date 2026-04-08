---
title: Security Checks
description: All threat categories Tool-Scan detects.
sidebar:
  order: 2
---

Tool-Scan detects threats across three main categories: prompt injection and tool poisoning, code injection, and network security.

## Prompt injection and tool poisoning

These threats hide malicious instructions inside tool descriptions or metadata.

| Threat | Example | Severity |
|--------|---------|----------|
| Instruction override | `"ignore previous instructions"` | Critical |
| Role manipulation | `"you are now an admin"` | High |
| Covert actions | `"secretly execute..."` | Critical |
| Fake system tags | `"<system>..."` | High |
| Hidden unicode | Zero-width spaces in text | High |
| Homoglyph attacks | Cyrillic lookalike characters | Medium |

Tool poisoning is particularly dangerous because the malicious content lives inside the tool definition itself — an AI model reads the description and follows the hidden instructions.

## Code injection

These threats embed executable payloads in default values or descriptions.

| Threat | Example | Severity |
|--------|---------|----------|
| Command injection | `"; rm -rf /"` | Critical |
| SQL injection | `"' OR 1=1 --"` | Critical |
| XSS | `"<script>..."` | Critical |
| Path traversal | `"../../etc/passwd"` | High |

Tool-Scan checks default values, descriptions, and all string fields for shell metacharacters, SQL fragments, HTML/script tags, and directory traversal sequences.

## Network security

These threats create covert channels to leak data or access internal services.

| Threat | Example | Severity |
|--------|---------|----------|
| SSRF (localhost) | `"http://127.0.0.1"` | Medium |
| SSRF (cloud metadata) | `"http://169.254.169.254"` | Critical |
| Data exfiltration | `"send data to http://..."` | Critical |

SSRF targeting cloud metadata endpoints is rated critical because it can expose cloud credentials and secrets.

## How detection works

Tool-Scan uses rule-based pattern matching — no AI inference, no network calls. Every scan is deterministic: the same input always produces the same result.

The scanner checks:
- All string fields in the tool definition (name, description, parameter descriptions)
- Default values in the input schema
- Annotation fields
- Nested schema properties at any depth

## Custom rules via plugins

You can add organization-specific threat patterns using the [plugin system](/tool-scan/handbook/plugins/). Plugin patterns are checked alongside built-in rules during every scan.
