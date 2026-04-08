"""Entry point for running polyglot-gpu as an MCP server."""

import sys

from . import __version__
from .server import mcp


def main() -> None:
    if "--version" in sys.argv or "-V" in sys.argv:
        print(f"polyglot-gpu {__version__}")
        sys.exit(0)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
