"""Shared log/output redaction — removes sensitive patterns from text.

Patterns:
    - Windows/Unix file paths -> [PATH]
    - API tokens (sk-, ghp_, xox-) -> [TOKEN]
    - Generic key=value secrets -> [REDACTED]
    - Base64 blobs (40+ chars) -> [BASE64]
    - IP addresses -> [IP]
"""

from __future__ import annotations

import re

REDACT_PATTERNS: list[tuple[re.Pattern, str]] = [
    # Windows paths: C:\Users\... or C:/Users/...
    (re.compile(r"[A-Za-z]:[\\\/][\w\\\/.\-]+"), "[PATH]"),
    # Unix paths: /home/user/...
    (re.compile(r"(?<!\w)/(?:home|usr|var|etc|tmp|opt|root)[\w/.\-]+"), "[PATH]"),
    # API tokens: sk-..., ghp_..., xox...-...
    (re.compile(r"\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|xox[bpsar]-[A-Za-z0-9\-]+)"), "[TOKEN]"),
    # Generic secrets: key=..., secret=..., password=..., token=...
    (re.compile(r"\b(?:key|secret|password|token|passwd|api_key|apikey)\s*[=:]\s*\S+", re.IGNORECASE), "[REDACTED]"),
    # Base64 blobs (40+ chars of base64)
    (re.compile(r"\b[A-Za-z0-9+/]{40,}={0,2}\b"), "[BASE64]"),
    # IP addresses
    (re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"), "[IP]"),
]


def redact_sensitive(text: str) -> str:
    """Replace sensitive patterns with placeholders."""
    for pattern, replacement in REDACT_PATTERNS:
        text = pattern.sub(replacement, text)
    return text
