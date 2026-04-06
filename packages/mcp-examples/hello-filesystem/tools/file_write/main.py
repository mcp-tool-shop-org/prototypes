#!/usr/bin/env python3
"""File write tool - stub-first, opt-in filesystem access.

This tool demonstrates irreversible side effects handled carefully:
- File writes are DISABLED by default
- User must explicitly set ALLOW_WRITE=1 to enable
- Writes are restricted to a sandbox directory by default
- Full filesystem access requires ALLOW_WRITE=full

Usage:
    # Stub mode (default) - safe, no writes
    python -m tools.file_write.main output.txt "Hello, world!"

    # Sandbox mode - writes only to ./sandbox/
    ALLOW_WRITE=1 python -m tools.file_write.main output.txt "Hello!"

    # Full mode - writes anywhere (use with caution)
    ALLOW_WRITE=full python -m tools.file_write.main /tmp/output.txt "Hello!"
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def get_write_mode() -> str:
    """Check write access level: 'disabled', 'sandbox', or 'full'."""
    allow = os.environ.get("ALLOW_WRITE", "").lower()
    if allow == "full":
        return "full"
    elif allow in ("1", "true", "yes", "sandbox"):
        return "sandbox"
    return "disabled"


def get_sandbox_dir() -> Path:
    """Get the sandbox directory for restricted writes."""
    return Path(__file__).parent.parent.parent / "sandbox"


def stub_write(filepath: str, content: str) -> str:
    """Stub file write - shows what would happen without writing."""
    return f"""[STUB MODE] File writes disabled for safety.

Would write to: {filepath}
Content length: {len(content)} chars
Content preview: {content[:100]}{"..." if len(content) > 100 else ""}

To enable file writes, set:
  ALLOW_WRITE=1      (sandbox only - writes to ./sandbox/)
  ALLOW_WRITE=full   (anywhere - use with caution)

Example:
  ALLOW_WRITE=1 python -m tools.file_write.main {filepath} "{content[:20]}..."
"""


def sanitize_filename(filepath: str) -> str:
    """Extract safe filename, blocking all path traversal attempts.

    Handles:
    - Unix traversal: ../
    - Windows traversal: ..\\
    - URL-encoded: %2e%2e%2f, %2e%2e/
    - Mixed slashes: ../, ..\\
    - Drive letters: C:\\, D:/
    - UNC paths: \\\\server\\share
    - Doubled separators: ....//
    """
    import urllib.parse

    # URL-decode first (handles %2e%2e%2f etc.)
    decoded = urllib.parse.unquote(filepath)

    # Normalize to forward slashes for consistent processing
    normalized = decoded.replace("\\", "/")

    # Strip drive letters (C:, D:, etc.)
    if len(normalized) >= 2 and normalized[1] == ":":
        normalized = normalized[2:]

    # Strip UNC prefix (//server/share or \\server\share)
    if normalized.startswith("//"):
        normalized = normalized.lstrip("/")

    # Take only the final path component (basename)
    # This naturally strips all ../ sequences
    filename = Path(normalized).name

    # Additional safety: reject if filename is empty, just dots, or contains null
    if not filename or filename in (".", "..") or "\x00" in filename:
        filename = "unnamed"

    return filename


def sandbox_write(filepath: str, content: str) -> str:
    """Write to sandbox directory only."""
    sandbox = get_sandbox_dir()
    sandbox.mkdir(parents=True, exist_ok=True)

    # Force file into sandbox with sanitized filename
    filename = sanitize_filename(filepath)
    target = sandbox / filename

    # Resolve to absolute path and verify it's still in sandbox
    # This catches symlink escapes
    target_resolved = target.resolve()
    sandbox_resolved = sandbox.resolve()

    if not str(target_resolved).startswith(str(sandbox_resolved)):
        return f"""[SANDBOX MODE] Error: Path escape detected.

Requested: {filepath}
Resolved:  {target_resolved}
Sandbox:   {sandbox_resolved}

This path would escape the sandbox. Write blocked.
"""

    target.write_text(content, encoding="utf-8")

    return f"""[SANDBOX MODE] File written to sandbox.

Requested path: {filepath}
Actual path:    {target}
Bytes written:  {len(content.encode('utf-8'))}

Note: Writes are restricted to ./sandbox/ directory.
To write anywhere, use ALLOW_WRITE=full (with caution).
"""


def full_write(filepath: str, content: str) -> str:
    """Write to any path (dangerous, requires explicit opt-in)."""
    target = Path(filepath)

    # Safety check: require parent directory to exist
    if not target.parent.exists():
        return f"""[FULL MODE] Error: Parent directory does not exist.

Path: {filepath}
Parent: {target.parent}

Create the directory first, or use a different path.
"""

    # Check if file exists (warn about overwrite)
    existed = target.exists()
    old_size = target.stat().st_size if existed else 0

    target.write_text(content, encoding="utf-8")

    if existed:
        return f"""[FULL MODE] File overwritten.

Path:         {target.absolute()}
Old size:     {old_size} bytes
New size:     {len(content.encode('utf-8'))} bytes

WARNING: Previous content has been permanently replaced.
"""
    else:
        return f"""[FULL MODE] File created.

Path:         {target.absolute()}
Bytes written: {len(content.encode('utf-8'))}
"""


def main() -> None:
    parser = argparse.ArgumentParser(
        description="File write with stub-first safety model"
    )
    parser.add_argument("filepath", help="Path to write to")
    parser.add_argument("content", help="Content to write")
    args = parser.parse_args()

    mode = get_write_mode()

    if mode == "disabled":
        result = stub_write(args.filepath, args.content)
    elif mode == "sandbox":
        result = sandbox_write(args.filepath, args.content)
    else:  # full
        result = full_write(args.filepath, args.content)

    print(result)


if __name__ == "__main__":
    main()
