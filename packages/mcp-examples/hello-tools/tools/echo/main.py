#!/usr/bin/env python3
"""Echo tool - always safe, deterministic output.

This tool demonstrates the simplest possible MCP tool:
- No network access
- No file system writes
- Pure function: input → output

Usage:
    python -m tools.echo.main "Hello, world!"
    python -m tools.echo.main --uppercase "hello"
"""

from __future__ import annotations

import argparse
import sys


def echo(message: str, uppercase: bool = False) -> str:
    """Echo a message back."""
    if uppercase:
        return message.upper()
    return message


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Echo a message back (safe, deterministic)"
    )
    parser.add_argument("message", help="Message to echo")
    parser.add_argument(
        "--uppercase", "-u",
        action="store_true",
        help="Convert to uppercase"
    )
    args = parser.parse_args()

    result = echo(args.message, args.uppercase)
    print(result)


if __name__ == "__main__":
    main()
