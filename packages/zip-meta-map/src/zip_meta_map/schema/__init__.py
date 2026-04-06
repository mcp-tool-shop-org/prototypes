"""JSON Schema definitions for zip-meta-map output files."""

import json
from pathlib import Path

_SCHEMA_DIR = Path(__file__).parent


def load_index_schema() -> dict:
    """Load the META_ZIP_INDEX JSON Schema."""
    return json.loads((_SCHEMA_DIR / "meta_zip_index.schema.json").read_text())


def load_policy_schema() -> dict:
    """Load the META_ZIP_POLICY JSON Schema."""
    return json.loads((_SCHEMA_DIR / "meta_zip_policy.schema.json").read_text())
