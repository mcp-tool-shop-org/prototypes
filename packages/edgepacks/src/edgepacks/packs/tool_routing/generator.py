"""Generation prompts for tool-routing examples."""

from edgepacks.packs.tool_routing.tools import TOOLS


def system_prompt() -> str:
    """System prompt for generating tool-routing training data."""
    tool_list = "\n".join(
        f"- {t['name']}: {t['description']}" for t in TOOLS
    )
    return (
        "You are a training data generator for a tool-routing model.\n\n"
        f"Available tools:\n{tool_list}\n\n"
        "Generate realistic user requests that should be routed to specific tools.\n"
        "Each example must be a JSON object with:\n"
        "- 'input': {'request': '<natural language request>'}\n"
        "- 'output': {'tool': '<tool_name>', 'args': {<appropriate args>}}\n\n"
        "Make requests diverse: vary phrasing, specificity, and complexity.\n"
        "Include requests that are informal, formal, terse, and verbose.\n"
        "The tool choice must be unambiguous and correct."
    )
