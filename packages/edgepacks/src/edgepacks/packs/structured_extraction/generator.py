"""Generation prompts for structured-extraction examples."""

from edgepacks.packs.structured_extraction.schemas import EXTRACTION_SCHEMAS


def system_prompt() -> str:
    """System prompt for generating extraction training data."""
    return (
        "You are a training data generator for a structured extraction model.\n\n"
        "You generate realistic messy text (emails, chat messages, notes, logs, docs) "
        "that contain extractable information matching one of these schemas:\n\n"
        f"Schemas: {list(EXTRACTION_SCHEMAS.keys())}\n\n"
        "Vary the messiness: typos, abbreviations, informal language, "
        "partial information, embedded noise. Real text is messy.\n\n"
        "Each example must be a JSON object with:\n"
        "- 'input': {'text': '<messy text>', 'schema_type': '<contact|event|config>'}\n"
        "- 'output': {'extracted': <structured data>, 'confidence': <0.0-1.0>}\n\n"
        "Use lower confidence when information is incomplete or ambiguous."
    )
