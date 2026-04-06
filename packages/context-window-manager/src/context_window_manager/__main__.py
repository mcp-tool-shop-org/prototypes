"""
Entry point for the Context Window Manager MCP server.

Usage:
    python -m context_window_manager
    cwm  # If installed via pip
"""

import asyncio
import sys
from multiprocessing import freeze_support


def main() -> int:
    """Main entry point."""
    # Windows multiprocessing support
    freeze_support()

    args = sys.argv[1:]

    if "--version" in args or "-V" in args:
        from context_window_manager import __version__

        print(f"cwm v{__version__}")
        return 0

    if "--diagnose" in args:
        import platform

        from context_window_manager import __version__
        from context_window_manager.config import Settings

        print(f"cwm v{__version__}")
        print(f"Python {platform.python_version()} ({platform.platform()})")
        settings = Settings()
        print("\nStorage:")
        cpu_status = "enabled" if settings.storage.enable_cpu else "disabled"
        print(f"  CPU tier: {cpu_status} (max {settings.storage.cpu_max_gb} GB)")
        disk_status = "enabled" if settings.storage.enable_disk else "disabled"
        print(f"  Disk tier: {disk_status} (max {settings.storage.disk_max_gb} GB)")
        print(f"  Disk path: {settings.storage.disk_path}")
        print(f"\nvLLM: {settings.vllm.url}")
        print(f"Log level: {settings.log_level}")
        return 0

    if "--help" in args or "-h" in args:
        print("""cwm — Context Window Manager MCP server

Usage:
  cwm                Run the MCP server
  cwm --version      Show version
  cwm --diagnose     Show diagnostic info
  cwm --help         Show this help""")
        return 0

    from context_window_manager.server import run_server

    try:
        asyncio.run(run_server())
        return 0
    except KeyboardInterrupt:
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
