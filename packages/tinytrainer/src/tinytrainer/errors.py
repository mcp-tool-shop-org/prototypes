"""Structured error handling for TinyTrainer CLI.

Follows the Shipcheck Tier 1 error shape: code, message, hint, cause, retryable.
"""

from __future__ import annotations

import sys
import traceback
from dataclasses import dataclass

# Whether to show full stack traces (set via --debug flag)
DEBUG_MODE = False


@dataclass
class TinyTrainerError(Exception):
    """Structured error with code, message, hint, and optional cause."""

    code: str
    message: str
    hint: str = ""
    cause: str = ""
    retryable: bool = False

    def __str__(self) -> str:
        parts = [f"[{self.code}] {self.message}"]
        if self.hint:
            parts.append(f"  Hint: {self.hint}")
        if self.cause:
            parts.append(f"  Cause: {self.cause}")
        return "\n".join(parts)

    @property
    def exit_code(self) -> int:
        """Map error code prefix to exit code."""
        if self.code.startswith("INPUT_"):
            return 1  # user error
        return 2  # runtime error


def handle_error(error: Exception) -> int:
    """Format and print an error, return the appropriate exit code."""
    if isinstance(error, TinyTrainerError):
        print(f"Error: {error}", file=sys.stderr)
        if DEBUG_MODE:
            traceback.print_exc()
        return error.exit_code

    # Wrap unexpected errors
    print(f"Error: [RUNTIME_UNEXPECTED] {error}", file=sys.stderr)
    if DEBUG_MODE:
        traceback.print_exc()
    else:
        print("  Hint: Run with --debug for full stack trace", file=sys.stderr)
    return 2
