"""
Dev Brain - Intelligent developer insights MCP server.

Consumes Context Engine to provide:
- Test coverage analysis
- Behavior gap detection
- Test generation suggestions
- Refactoring recommendations
- UX insights

Usage:
    # As MCP server
    dev-brain

    # Programmatic
    from dev_brain import DevBrainConfig
    from dev_brain.server import create_server
"""

from .config import DevBrainConfig

__version__ = "1.0.2"
__all__ = [
    "DevBrainConfig",
]
