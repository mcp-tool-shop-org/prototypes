"""Tests that the JSON Schemas themselves are valid and enforce constraints."""

import jsonschema
import pytest

from zip_meta_map.schema import load_index_schema, load_policy_schema


def test_index_schema_loads():
    schema = load_index_schema()
    assert schema["title"] == "META_ZIP_INDEX"
    assert "properties" in schema


def test_policy_schema_loads():
    schema = load_policy_schema()
    assert schema["title"] == "META_ZIP_POLICY"


def test_index_rejects_missing_format():
    schema = load_index_schema()
    bad = {
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_index_rejects_bad_role():
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [{"path": "a.py", "size_bytes": 10, "sha256": "a" * 64, "role": "INVALID", "confidence": 0.5}],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_index_rejects_bad_sha256():
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [{"path": "a.py", "size_bytes": 10, "sha256": "tooshort", "role": "source", "confidence": 0.5}],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_index_rejects_missing_confidence():
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [{"path": "a.py", "size_bytes": 10, "sha256": "a" * 64, "role": "source"}],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_index_rejects_confidence_out_of_range():
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [{"path": "a.py", "size_bytes": 10, "sha256": "a" * 64, "role": "source", "confidence": 1.5}],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_index_accepts_valid_minimal():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.0.1",
        "profile": "python_cli",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
    }
    jsonschema.validate(good, schema)


def test_index_accepts_full_file_entry():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.0.1",
        "profile": "python_cli",
        "start_here": ["src/main.py"],
        "ignore": [],
        "files": [
            {
                "path": "src/main.py",
                "size_bytes": 100,
                "sha256": "a" * 64,
                "role": "entrypoint",
                "confidence": 0.95,
                "reason": "matches profile entrypoint pattern",
                "tags": ["cli"],
                "excerpt": "#!/usr/bin/env python3\nimport click",
                "risk_flags": ["exec_shell"],
                "chunks": [
                    {"id": "chunk_1_abc", "start_line": 1, "end_line": 50, "byte_len": 2000, "heading": "# Main"},
                ],
            }
        ],
        "plans": {
            "overview": {
                "description": "Quick look",
                "steps": ["READ src/main.py"],
                "budget_bytes": 8192,
                "max_total_bytes": 32768,
                "stop_after": ["src/main.py"],
            }
        },
    }
    jsonschema.validate(good, schema)


def test_index_accepts_new_roles():
    """All v0.1.1 roles should be accepted."""
    schema = load_index_schema()
    new_roles = [
        "entrypoint",
        "public_api",
        "source",
        "internal",
        "config",
        "lockfile",
        "ci",
        "test",
        "fixture",
        "doc",
        "doc_api",
        "doc_architecture",
        "schema",
        "build",
        "script",
        "generated",
        "vendor",
        "asset",
        "data",
        "unknown",
    ]
    for role in new_roles:
        doc = {
            "format": "zip-meta-map",
            "version": "0.2",
            "generated_by": "test",
            "profile": "test",
            "start_here": [],
            "ignore": [],
            "files": [{"path": "x", "size_bytes": 0, "sha256": "a" * 64, "role": role, "confidence": 0.5}],
            "plans": {},
        }
        jsonschema.validate(doc, schema)


def test_index_accepts_policy_applied():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "policy_applied": True,
    }
    jsonschema.validate(good, schema)


def test_index_accepts_modules():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "modules": [
            {
                "path": "src/app",
                "file_count": 5,
                "total_bytes": 10000,
                "primary_roles": ["source", "entrypoint"],
                "key_files": ["src/app/main.py"],
                "summary": "Contains source code, entry point",
            }
        ],
    }
    jsonschema.validate(good, schema)


def test_index_accepts_warnings():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "warnings": ["3 file(s) contain patterns that look like secrets"],
    }
    jsonschema.validate(good, schema)


def test_index_rejects_bad_chunk():
    """Chunk missing required field should fail."""
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [
            {
                "path": "big.py",
                "size_bytes": 50000,
                "sha256": "a" * 64,
                "role": "source",
                "confidence": 0.6,
                "chunks": [{"id": "chunk_1_abc", "start_line": 1}],  # missing end_line, byte_len
            }
        ],
        "plans": {},
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_policy_accepts_valid():
    schema = load_policy_schema()
    good = {
        "format": "zip-meta-policy",
        "version": "0.1",
        "read_only": ["*.lock"],
        "sensitive": [".env", "*.key"],
        "notes": "Be careful with credentials.",
    }
    jsonschema.validate(good, schema)


def test_index_accepts_capabilities():
    schema = load_index_schema()
    good = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "capabilities": ["chunks", "excerpts", "modules", "risk_flags", "warnings"],
    }
    jsonschema.validate(good, schema)


def test_index_rejects_extra_properties():
    """additionalProperties: false should reject unknown top-level keys."""
    schema = load_index_schema()
    bad = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test",
        "profile": "test",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "unknown_key": True,
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(bad, schema)


def test_policy_accepts_new_fields():
    schema = load_policy_schema()
    good = {
        "format": "zip-meta-policy",
        "version": "0.1",
        "ignore_extra": ["logs/**"],
        "never_read": [".env"],
        "plan_budgets": {"overview": 50000, "debug": 100000},
    }
    jsonschema.validate(good, schema)
