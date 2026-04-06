#!/usr/bin/env python3
"""HTTP GET tool - stub-first, opt-in network access.

This tool demonstrates the stub-first safety model:
- Network calls are DISABLED by default
- User must explicitly set ALLOW_NETWORK=1 to enable
- No surprises, opt-in capabilities

Usage:
    # Stub mode (default) - safe, no network
    python -m tools.http_get.main https://example.com

    # Real mode - requires explicit opt-in
    ALLOW_NETWORK=1 python -m tools.http_get.main https://example.com
"""

from __future__ import annotations

import argparse
import os
import sys


def is_network_allowed() -> bool:
    """Check if network access is explicitly allowed."""
    return os.environ.get("ALLOW_NETWORK", "").lower() in ("1", "true", "yes")


def stub_get(url: str) -> str:
    """Stub HTTP GET - returns mock response without network access."""
    return f"""[STUB MODE] Network disabled for safety.

Request would be:
  GET {url}

To enable network access, set:
  ALLOW_NETWORK=1

Example:
  ALLOW_NETWORK=1 python -m tools.http_get.main {url}
"""


def real_get(url: str, timeout: float = 10.0) -> str:
    """Real HTTP GET - requires ALLOW_NETWORK=1."""
    try:
        import httpx
    except ImportError:
        return "Error: httpx not installed. Run: pip install httpx"

    try:
        response = httpx.get(url, timeout=timeout, follow_redirects=True)
        return f"""[REAL MODE] Network enabled.

Status: {response.status_code}
URL: {response.url}

Response ({len(response.text)} chars):
{response.text[:500]}{"..." if len(response.text) > 500 else ""}
"""
    except httpx.RequestError as e:
        return f"Error: {e}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="HTTP GET with stub-first safety model"
    )
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument(
        "--timeout", "-t",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10)"
    )
    args = parser.parse_args()

    if is_network_allowed():
        result = real_get(args.url, args.timeout)
    else:
        result = stub_get(args.url)

    print(result)


if __name__ == "__main__":
    main()
