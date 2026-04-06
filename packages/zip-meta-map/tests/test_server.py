"""Tests for MCP server (unit-testable parts without MCP SDK dependency)."""

import json
from pathlib import Path

# Test the handler functions directly since MCP SDK may not be installed
from zip_meta_map.builder import build, validate_index

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_server_module_imports():
    """Server module should import without MCP SDK (graceful fallback)."""
    from zip_meta_map import server

    # Server attribute should be None or a class
    # If MCP isn't installed, Server will be None
    assert hasattr(server, "create_server")
    assert hasattr(server, "main")


def test_server_build_produces_valid_output():
    """The build function used by the server should produce valid indexes."""
    front, index = build(FIXTURE_DIR)
    validate_index(index)
    assert len(front) > 0
    assert index["profile"] == "python_cli"


def test_server_explain_data_structure():
    """Explain data should have expected structure."""
    _, index = build(FIXTURE_DIR)
    files = index["files"]

    role_counts: dict[str, int] = {}
    for f in files:
        role_counts[f["role"]] = role_counts.get(f["role"], 0) + 1

    explain_data = {
        "profile": index["profile"],
        "file_count": len(files),
        "roles": role_counts,
        "start_here": index["start_here"],
        "plans": index["plans"],
    }

    assert explain_data["profile"] == "python_cli"
    assert explain_data["file_count"] > 0
    assert isinstance(explain_data["roles"], dict)
    assert len(explain_data["start_here"]) > 0
    assert "overview" in explain_data["plans"]


def test_server_diff_produces_json():
    """Diff results should be JSON-serializable."""
    from zip_meta_map.diff import diff_indices

    _, left = build(FIXTURE_DIR)
    _, right = build(FIXTURE_DIR)
    result = diff_indices(left, right)
    d = result.to_dict()
    text = json.dumps(d)
    assert json.loads(text)["has_changes"] is False


def test_server_compare_produces_json():
    """Compare results should be JSON-serializable."""
    from zip_meta_map.compare import compare_indices

    _, left = build(FIXTURE_DIR)
    _, right = build(FIXTURE_DIR)
    result = compare_indices(left, right)
    d = result.to_dict()
    text = json.dumps(d)
    assert json.loads(text)["archetype_match"] == "near_identical"
