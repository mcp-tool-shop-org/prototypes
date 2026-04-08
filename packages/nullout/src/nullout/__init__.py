"""NullOut — MCP server for removing undeletable files on Windows."""

from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as _pkg_version

try:
    __version__ = _pkg_version("nullout-mcp")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"
