"""
Context Window Manager - Lossless LLM context restoration via KV cache persistence.

This MCP server provides tools for freezing, thawing, and managing LLM session
contexts using vLLM's KV cache and LMCache for persistent storage.
"""

__version__ = "1.0.1"
__author__ = "AI Development Lab"

from context_window_manager.config import Config, Settings

__all__ = [
    "Config",
    "Settings",
    "__version__",
]
