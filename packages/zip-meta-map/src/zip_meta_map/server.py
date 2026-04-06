"""MCP server exposing zip-meta-map tools for agent consumption."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from mcp.server import Server
    from mcp.server.stdio import run_server
    from mcp.types import TextContent, Tool
except ImportError:
    Server = None  # type: ignore[assignment, misc]

from zip_meta_map.builder import build, validate_index
from zip_meta_map.profiles import ALL_PROFILES


def create_server() -> "Server":
    """Create and configure the MCP server with zip-meta-map tools."""
    if Server is None:
        raise ImportError("MCP SDK not installed. Install with: pip install 'zip-meta-map[mcp]'")

    server = Server("zip-meta-map")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name="build_metadata",
                description=(
                    "Generate an LLM-friendly metadata bundle from a directory or ZIP file. "
                    "Returns role-classified files, traversal plans, and byte budgets."
                ),
                inputSchema={
                    "type": "object",
                    "required": ["path"],
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to a directory or .zip file to analyze",
                        },
                        "profile": {
                            "type": "string",
                            "enum": list(ALL_PROFILES.keys()),
                            "description": "Force a specific profile (default: auto-detect)",
                        },
                        "manifest_only": {
                            "type": "boolean",
                            "description": "Return only the JSON index, skip FRONT.md (default: false)",
                        },
                    },
                },
            ),
            Tool(
                name="explain",
                description=(
                    "Show detected profile, top files to read first, role distribution, "
                    "and traversal plans for a project."
                ),
                inputSchema={
                    "type": "object",
                    "required": ["path"],
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to a directory or .zip file",
                        },
                        "profile": {
                            "type": "string",
                            "enum": list(ALL_PROFILES.keys()),
                            "description": "Force a specific profile (default: auto-detect)",
                        },
                    },
                },
            ),
            Tool(
                name="diff_metadata",
                description=(
                    "Compare two META_ZIP_INDEX.json files and report what changed "
                    "(files added/removed/modified, plan changes, etc)."
                ),
                inputSchema={
                    "type": "object",
                    "required": ["old_path", "new_path"],
                    "properties": {
                        "old_path": {
                            "type": "string",
                            "description": "Path to the old/base META_ZIP_INDEX.json",
                        },
                        "new_path": {
                            "type": "string",
                            "description": "Path to the new/current META_ZIP_INDEX.json",
                        },
                    },
                },
            ),
            Tool(
                name="compare_repos",
                description=(
                    "Compare two indexes from different repos to find structural similarities. "
                    "Returns archetype matching scores and shared patterns."
                ),
                inputSchema={
                    "type": "object",
                    "required": ["left_path", "right_path"],
                    "properties": {
                        "left_path": {
                            "type": "string",
                            "description": "Path to first META_ZIP_INDEX.json",
                        },
                        "right_path": {
                            "type": "string",
                            "description": "Path to second META_ZIP_INDEX.json",
                        },
                    },
                },
            ),
            Tool(
                name="validate_index",
                description="Validate a META_ZIP_INDEX.json file against the schema.",
                inputSchema={
                    "type": "object",
                    "required": ["path"],
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to a META_ZIP_INDEX.json file",
                        },
                    },
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        try:
            if name == "build_metadata":
                return _handle_build(arguments)
            elif name == "explain":
                return _handle_explain(arguments)
            elif name == "diff_metadata":
                return _handle_diff(arguments)
            elif name == "compare_repos":
                return _handle_compare(arguments)
            elif name == "validate_index":
                return _handle_validate(arguments)
            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {e}")]

    return server


def _handle_build(arguments: dict) -> list["TextContent"]:
    from mcp.types import TextContent

    input_path = Path(arguments["path"])
    if not input_path.exists():
        return [TextContent(type="text", text=f"Error: {input_path} does not exist")]

    profile_name = arguments.get("profile")
    manifest_only = arguments.get("manifest_only", False)

    front, index = build(input_path, profile_name=profile_name)

    if manifest_only:
        return [TextContent(type="text", text=json.dumps(index, indent=2))]

    return [
        TextContent(type="text", text=front),
        TextContent(type="text", text=json.dumps(index, indent=2)),
    ]


def _handle_explain(arguments: dict) -> list["TextContent"]:
    from mcp.types import TextContent

    input_path = Path(arguments["path"])
    if not input_path.exists():
        return [TextContent(type="text", text=f"Error: {input_path} does not exist")]

    profile_name = arguments.get("profile")
    _, index = build(input_path, profile_name=profile_name)

    # Build explain data
    files = index["files"]
    role_counts: dict[str, int] = {}
    for f in files:
        role_counts[f["role"]] = role_counts.get(f["role"], 0) + 1

    explain_data = {
        "profile": index["profile"],
        "file_count": len(files),
        "roles": role_counts,
        "start_here": index["start_here"],
        "modules": index.get("modules", []),
        "plans": index["plans"],
        "warnings": index.get("warnings", []),
        "capabilities": index.get("capabilities", []),
        "low_confidence_count": sum(1 for f in files if f["confidence"] < 0.5),
    }
    return [TextContent(type="text", text=json.dumps(explain_data, indent=2))]


def _handle_diff(arguments: dict) -> list["TextContent"]:
    from mcp.types import TextContent

    from zip_meta_map.diff import diff_indices

    old_path = Path(arguments["old_path"])
    new_path = Path(arguments["new_path"])

    for path, label in [(old_path, "old"), (new_path, "new")]:
        if not path.exists():
            return [TextContent(type="text", text=f"Error: {label} file {path} does not exist")]

    old_data = json.loads(old_path.read_text(encoding="utf-8"))
    new_data = json.loads(new_path.read_text(encoding="utf-8"))

    result = diff_indices(old_data, new_data)
    return [TextContent(type="text", text=json.dumps(result.to_dict(), indent=2))]


def _handle_compare(arguments: dict) -> list["TextContent"]:
    from mcp.types import TextContent

    from zip_meta_map.compare import compare_indices

    left_path = Path(arguments["left_path"])
    right_path = Path(arguments["right_path"])

    for path, label in [(left_path, "left"), (right_path, "right")]:
        if not path.exists():
            return [TextContent(type="text", text=f"Error: {label} file {path} does not exist")]

    left_data = json.loads(left_path.read_text(encoding="utf-8"))
    right_data = json.loads(right_path.read_text(encoding="utf-8"))

    result = compare_indices(left_data, right_data)
    return [TextContent(type="text", text=json.dumps(result.to_dict(), indent=2))]


def _handle_validate(arguments: dict) -> list["TextContent"]:
    from mcp.types import TextContent

    input_path = Path(arguments["path"])
    if not input_path.exists():
        return [TextContent(type="text", text=f"Error: {input_path} does not exist")]

    data = json.loads(input_path.read_text(encoding="utf-8"))
    validate_index(data)

    file_count = len(data.get("files", []))
    caps = data.get("capabilities", [])
    return [
        TextContent(
            type="text",
            text=f"Valid META_ZIP_INDEX.json ({file_count} files, version {data.get('version', '?')}, caps: {caps})",
        )
    ]


def main() -> None:
    """Run the MCP server via stdio."""
    if Server is None:
        print("Error: MCP SDK not installed. Install with: pip install 'zip-meta-map[mcp]'", file=sys.stderr)
        sys.exit(1)

    import asyncio

    server = create_server()
    asyncio.run(run_server(server))


if __name__ == "__main__":
    main()
