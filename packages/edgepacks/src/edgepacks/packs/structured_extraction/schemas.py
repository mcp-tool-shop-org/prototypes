"""Target extraction schemas for the structured-extraction pack."""

CONTACT_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "company": {"type": "string"},
        "role": {"type": "string"},
    },
    "required": ["name"],
}

EVENT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "date": {"type": "string"},
        "time": {"type": "string"},
        "location": {"type": "string"},
        "organizer": {"type": "string"},
        "attendees": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "date"],
}

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "key": {"type": "string"},
        "value": {"type": "string"},
        "section": {"type": "string"},
        "type": {"type": "string", "enum": ["string", "integer", "boolean", "float", "list"]},
    },
    "required": ["key", "value"],
}

EXTRACTION_SCHEMAS = {
    "contact": CONTACT_SCHEMA,
    "event": EVENT_SCHEMA,
    "config": CONFIG_SCHEMA,
}

SCHEMA_NAMES = list(EXTRACTION_SCHEMAS.keys())
