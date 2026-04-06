"""Safety guardrails: risk flags and integrity warnings."""

from __future__ import annotations

import re

# ── Risk flag patterns (heuristic, conservative) ──

# Patterns that suggest shell execution
_EXEC_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b(subprocess|os\.system|os\.popen|shlex|exec|eval)\b"),
    re.compile(r"\b(child_process|spawn|execSync|execFile)\b"),
    re.compile(r"\b(system|popen|backtick|exec)\b"),
]

# Patterns that suggest secrets or credentials
_SECRET_PATTERNS: list[re.Pattern] = [
    re.compile(r"(?i)(api[_-]?key|secret[_-]?key|password|token|credential)\s*[=:]"),
    re.compile(r"(?i)(aws[_-]?access|aws[_-]?secret|private[_-]?key)"),
    re.compile(r"(?:^|\s)(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|AKIA[A-Z0-9]{16})"),
]

# Patterns that suggest network I/O
_NETWORK_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b(requests\.|urllib|fetch\(|axios|http\.get|https\.get)\b"),
    re.compile(r"\b(socket|websocket|net\.connect)\b"),
]

# File extensions that are binary but might masquerade as text
_BINARY_EXTS = {
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".dat",
    ".class",
    ".pyc",
    ".pyo",
    ".wasm",
}

# Extensions that should always be text
_TEXT_EXTS_FOR_BINARY_CHECK = {
    ".py",
    ".ts",
    ".js",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".txt",
    ".rst",
    ".html",
    ".css",
    ".xml",
    ".sh",
}


def detect_risk_flags(path: str, content: bytes | None, size_bytes: int) -> list[str]:
    """Detect heuristic risk signals for a file.

    Returns a list of risk flag strings. Conservative: only flags
    high-confidence signals. Empty list = no risks detected.
    """
    flags: list[str] = []
    name = path.rsplit("/", 1)[-1] if "/" in path else path
    ext = ""
    dot = name.rfind(".")
    if dot >= 0:
        ext = name[dot:].lower()

    # Path traversal
    if ".." in path.split("/"):
        flags.append("path_traversal")

    # Binary masquerading as text
    if ext in _TEXT_EXTS_FOR_BINARY_CHECK and content is not None:
        if _looks_binary(content):
            flags.append("binary_masquerade")

    # Known binary extensions in unexpected places
    if ext in _BINARY_EXTS:
        flags.append("binary_executable")

    # Content-based checks (only for text files we can read)
    if content is not None and ext not in _BINARY_EXTS:
        try:
            text = content.decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            # Can't decode as text — skip content checks
            return flags

        for pattern in _EXEC_PATTERNS:
            if pattern.search(text):
                flags.append("exec_shell")
                break

        for pattern in _SECRET_PATTERNS:
            if pattern.search(text):
                flags.append("secrets_like")
                break

        for pattern in _NETWORK_PATTERNS:
            if pattern.search(text):
                flags.append("network_io")
                break

    return flags


def _looks_binary(data: bytes) -> bool:
    """Check if data looks like binary (contains null bytes in first 8KB)."""
    sample = data[:8192]
    return b"\x00" in sample


def detect_warnings(file_entries: list[dict], ignore_globs: list[str]) -> list[str]:
    """Generate index-level safety warnings."""
    warnings: list[str] = []

    # Check for path traversal in any file path
    traversal_files = [f["path"] for f in file_entries if ".." in f["path"].split("/")]
    if traversal_files:
        warnings.append(f"Path traversal detected in {len(traversal_files)} file(s): {', '.join(traversal_files[:3])}")

    # Check for binary executables
    binary_count = sum(1 for f in file_entries if "binary_executable" in f.get("risk_flags", []))
    if binary_count:
        warnings.append(f"{binary_count} binary executable(s) found in archive")

    # Check for binary masquerading as text
    masq_count = sum(1 for f in file_entries if "binary_masquerade" in f.get("risk_flags", []))
    if masq_count:
        warnings.append(f"{masq_count} file(s) have text extensions but contain binary data")

    # Check for secrets-like patterns
    secrets_count = sum(1 for f in file_entries if "secrets_like" in f.get("risk_flags", []))
    if secrets_count:
        warnings.append(f"{secrets_count} file(s) contain patterns that look like secrets or credentials")

    # Check if ignore patterns hide security-critical directories
    _CRITICAL_DIRS = {"auth", "config", "security", "secrets", "credentials", ".ssh", ".gnupg"}
    for glob_pattern in ignore_globs:
        dir_part = glob_pattern.split("/")[0].strip("*.")
        if dir_part.lower() in _CRITICAL_DIRS:
            warnings.append(f"Ignore pattern '{glob_pattern}' hides a security-critical directory")

    return warnings
