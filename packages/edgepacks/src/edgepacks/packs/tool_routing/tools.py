"""Tool definitions for the tool-routing pack.

Each tool has a name, description, and argument schema. These define the
label space and output schema for the routing task.
"""

TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for current information",
        "args_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "max_results": {"type": "integer", "default": 5},
            },
            "required": ["query"],
        },
    },
    {
        "name": "read_file",
        "description": "Read contents of a file from the filesystem",
        "args_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "encoding": {"type": "string", "default": "utf-8"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write content to a file on the filesystem",
        "args_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "run_command",
        "description": "Execute a shell command and return output",
        "args_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeout": {"type": "integer", "default": 30},
            },
            "required": ["command"],
        },
    },
    {
        "name": "send_email",
        "description": "Send an email to a recipient",
        "args_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
    },
    {
        "name": "create_calendar_event",
        "description": "Create a calendar event with date, time, and attendees",
        "args_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "start": {"type": "string", "format": "date-time"},
                "end": {"type": "string", "format": "date-time"},
                "attendees": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "start"],
        },
    },
    {
        "name": "query_database",
        "description": "Execute a SQL query against a database",
        "args_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "database": {"type": "string"},
            },
            "required": ["query", "database"],
        },
    },
    {
        "name": "translate_text",
        "description": "Translate text from one language to another",
        "args_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "source_lang": {"type": "string"},
                "target_lang": {"type": "string"},
            },
            "required": ["text", "target_lang"],
        },
    },
    {
        "name": "summarize_text",
        "description": "Summarize a long piece of text into key points",
        "args_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "max_length": {"type": "integer", "default": 200},
            },
            "required": ["text"],
        },
    },
    {
        "name": "extract_entities",
        "description": "Extract named entities (people, places, orgs) from text",
        "args_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "entity_types": {
                    "type": "array",
                    "items": {"type": "string"},
                    "default": ["person", "organization", "location"],
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "generate_image",
        "description": "Generate an image from a text description",
        "args_schema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "width": {"type": "integer", "default": 512},
                "height": {"type": "integer", "default": 512},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "analyze_sentiment",
        "description": "Analyze the sentiment of a piece of text",
        "args_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
            },
            "required": ["text"],
        },
    },
    {
        "name": "convert_currency",
        "description": "Convert an amount from one currency to another",
        "args_schema": {
            "type": "object",
            "properties": {
                "amount": {"type": "number"},
                "from_currency": {"type": "string"},
                "to_currency": {"type": "string"},
            },
            "required": ["amount", "from_currency", "to_currency"],
        },
    },
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "args_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string"},
                "units": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["location"],
        },
    },
    {
        "name": "create_task",
        "description": "Create a task in a project management system",
        "args_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "assignee": {"type": "string"},
            },
            "required": ["title"],
        },
    },
    {
        "name": "git_commit",
        "description": "Stage and commit changes to a git repository",
        "args_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["message"],
        },
    },
    {
        "name": "http_request",
        "description": "Make an HTTP request to an API endpoint",
        "args_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"]},
                "body": {"type": "object"},
                "headers": {"type": "object"},
            },
            "required": ["url", "method"],
        },
    },
    {
        "name": "parse_json",
        "description": "Parse and validate a JSON string",
        "args_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "schema": {"type": "object"},
            },
            "required": ["text"],
        },
    },
    {
        "name": "compress_files",
        "description": "Compress files into an archive",
        "args_schema": {
            "type": "object",
            "properties": {
                "files": {"type": "array", "items": {"type": "string"}},
                "output": {"type": "string"},
                "format": {"type": "string", "enum": ["zip", "tar.gz", "7z"]},
            },
            "required": ["files", "output"],
        },
    },
    {
        "name": "resize_image",
        "description": "Resize an image to specified dimensions",
        "args_schema": {
            "type": "object",
            "properties": {
                "input_path": {"type": "string"},
                "output_path": {"type": "string"},
                "width": {"type": "integer"},
                "height": {"type": "integer"},
            },
            "required": ["input_path", "width", "height"],
        },
    },
]

TOOL_NAMES = [t["name"] for t in TOOLS]
